/**
 * GraphQL Parser
 * 간단하지만 실용적인 쿼리 파서
 */

export interface ParsedQuery {
  type: 'query' | 'mutation' | 'subscription';
  operationName?: string;
  fields: ParsedField[];
}

export interface ParsedField {
  name: string;
  alias?: string;
  arguments: Record<string, any>;
  fields: ParsedField[];
}

export class GraphQLParser {
  /**
   * 쿼리 파싱
   */
  static parse(query: string): ParsedQuery {
    const trimmed = query.trim();

    // 작업 타입 검출
    let type: 'query' | 'mutation' | 'subscription' = 'query';
    let offset = 0;

    if (trimmed.startsWith('mutation')) {
      type = 'mutation';
      offset = 8;
    } else if (trimmed.startsWith('subscription')) {
      type = 'subscription';
      offset = 12;
    } else if (trimmed.startsWith('query')) {
      offset = 5;
    }

    const rest = trimmed.substring(offset).trim();

    // operation name 추출
    let operationName: string | undefined;
    let bodyStart = 0;

    const nameMatch = rest.match(/^(\w+)\s*(\(.*?\))?\s*\{/);
    if (nameMatch && nameMatch[1] && nameMatch[1] !== '{') {
      operationName = nameMatch[1];
      bodyStart = nameMatch[0].length - 1;
    } else if (rest.startsWith('{')) {
      bodyStart = 1;
    }

    // 필드 파싱
    const body = rest.substring(bodyStart);
    const fields = this.parseFields(body);

    return {
      type,
      operationName,
      fields,
    };
  }

  /**
   * 필드 파싱
   */
  private static parseFields(body: string, depth: number = 0): ParsedField[] {
    const fields: ParsedField[] = [];
    let current = '';
    let inBrace = false;
    let inParen = false;

    for (let i = 0; i < body.length; i++) {
      const char = body[i];

      if (char === '{') {
        inBrace = true;
        current += char;
      } else if (char === '}') {
        inBrace = false;
        if (depth === 0) break;
        current += char;
      } else if (char === '(') {
        inParen = true;
        current += char;
      } else if (char === ')') {
        inParen = false;
        current += char;
      } else if ((char === ',' || char === '\n') && !inBrace && !inParen) {
        if (current.trim()) {
          fields.push(this.parseField(current.trim()));
        }
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      fields.push(this.parseField(current.trim()));
    }

    return fields;
  }

  /**
   * 단일 필드 파싱
   */
  private static parseField(fieldStr: string): ParsedField {
    // alias: name(args) { fields }
    let alias: string | undefined;
    let name = '';
    let argsStr = '';
    let fieldsStr = '';

    // alias 추출
    if (fieldStr.includes(':')) {
      const [a, rest] = fieldStr.split(':');
      alias = a.trim();
      fieldStr = rest.trim();
    }

    // 필드명 추출
    const nameMatch = fieldStr.match(/^(\w+)/);
    if (nameMatch) {
      name = nameMatch[1];
    }

    // 인자 추출
    const argsMatch = fieldStr.match(/\((.*?)\)/);
    if (argsMatch) {
      argsStr = argsMatch[1];
    }

    // 중첩 필드 추출
    const fieldsMatch = fieldStr.match(/\{(.*)\}$/);
    if (fieldsMatch) {
      fieldsStr = fieldsMatch[1];
    }

    return {
      name,
      alias,
      arguments: this.parseArguments(argsStr),
      fields: fieldsStr ? this.parseFields(fieldsStr, 1) : [],
    };
  }

  /**
   * 인자 파싱
   */
  private static parseArguments(argsStr: string): Record<string, any> {
    if (!argsStr.trim()) return {};

    const args: Record<string, any> = {};
    const parts = argsStr.split(',');

    for (const part of parts) {
      const [key, value] = part.split(':').map(s => s.trim());
      if (key && value) {
        args[key] = this.parseValue(value);
      }
    }

    return args;
  }

  /**
   * 값 파싱 (문자열, 숫자, boolean, null, 리스트, 객체)
   */
  private static parseValue(value: string): any {
    value = value.trim();

    // null
    if (value === 'null') return null;

    // boolean
    if (value === 'true') return true;
    if (value === 'false') return false;

    // 숫자
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return parseFloat(value);
    }

    // 문자열
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    // 리스트
    if (value.startsWith('[') && value.endsWith(']')) {
      const items = value.slice(1, -1).split(',');
      return items.map(item => this.parseValue(item));
    }

    // 변수 ($varName)
    if (value.startsWith('$')) {
      return { $variable: value.substring(1) };
    }

    return value;
  }
}
