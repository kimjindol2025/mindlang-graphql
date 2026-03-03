/**
 * GraphQL Executor
 * 파싱된 쿼리를 실행하고 결과 반환
 */

import { GraphQLParser, ParsedField, ParsedQuery } from './parser';
import { GraphQLSchema, ResolverContext, GraphQLError, GraphQLResponse } from './types';

export class GraphQLExecutor {
  private schema: GraphQLSchema;

  constructor(schema: GraphQLSchema) {
    this.schema = schema;
  }

  /**
   * 쿼리 실행
   */
  async execute(
    queryString: string,
    variables: Record<string, any> = {},
    context: ResolverContext = {}
  ): Promise<GraphQLResponse> {
    try {
      // 쿼리 파싱
      const parsed = GraphQLParser.parse(queryString);

      // 변수 대체
      this.replaceVariables(parsed.fields, variables);

      // 실행 타입에 따라 처리
      let rootType = this.schema.query;
      if (parsed.type === 'mutation' && this.schema.mutation) {
        rootType = this.schema.mutation;
      } else if (parsed.type === 'subscription' && this.schema.subscription) {
        rootType = this.schema.subscription;
      }

      // 필드 실행
      const data = await this.executeFields(
        parsed.fields,
        rootType.fields || {},
        null,
        context
      );

      return { data };
    } catch (error: any) {
      return {
        errors: [
          {
            message: error.message || 'Internal Server Error',
          },
        ],
      };
    }
  }

  /**
   * 필드 실행
   */
  private async executeFields(
    fields: ParsedField[],
    fieldMap: Record<string, any>,
    parent: any,
    context: ResolverContext
  ): Promise<any> {
    const result: Record<string, any> = {};

    for (const field of fields) {
      const fieldName = field.name;
      const outputName = field.alias || fieldName;

      if (!fieldMap[fieldName]) {
        throw new Error(`Field '${fieldName}' not found`);
      }

      const fieldDef = fieldMap[fieldName];
      const resolver = fieldDef.resolve || (() => undefined);

      try {
        const value = await resolver(parent, field.arguments, context);

        if (field.fields.length > 0 && value !== null && value !== undefined) {
          // 중첩 필드 처리
          if (Array.isArray(value)) {
            result[outputName] = await Promise.all(
              value.map((item) =>
                this.executeFields(
                  field.fields,
                  fieldDef.type.fields || {},
                  item,
                  context
                )
              )
            );
          } else {
            result[outputName] = await this.executeFields(
              field.fields,
              fieldDef.type.fields || {},
              value,
              context
            );
          }
        } else {
          result[outputName] = value;
        }
      } catch (error: any) {
        result[outputName] = null;
        console.error(`Error executing field '${fieldName}':`, error);
      }
    }

    return result;
  }

  /**
   * 변수 대체
   */
  private replaceVariables(fields: ParsedField[], variables: Record<string, any>): void {
    for (const field of fields) {
      // 인자의 변수 대체
      for (const [key, value] of Object.entries(field.arguments)) {
        if (
          typeof value === 'object' &&
          value !== null &&
          '$variable' in value
        ) {
          const varName = value.$variable;
          field.arguments[key] = variables[varName];
        }
      }

      // 중첩 필드 처리
      if (field.fields.length > 0) {
        this.replaceVariables(field.fields, variables);
      }
    }
  }
}
