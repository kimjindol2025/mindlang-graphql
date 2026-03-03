/**
 * GraphQL Schema Builder
 * 타입 안전한 스키마 정의
 */

import { GraphQLType, GraphQLField, GraphQLSchema, GraphQLArg } from './types';

export class SchemaBuilder {
  /**
   * 스칼라 타입
   */
  static readonly String = { name: 'String', kind: 'SCALAR' } as GraphQLType;
  static readonly Int = { name: 'Int', kind: 'SCALAR' } as GraphQLType;
  static readonly Float = { name: 'Float', kind: 'SCALAR' } as GraphQLType;
  static readonly Boolean = { name: 'Boolean', kind: 'SCALAR' } as GraphQLType;
  static readonly ID = { name: 'ID', kind: 'SCALAR' } as GraphQLType;

  /**
   * NON_NULL 래퍼
   */
  static NonNull(type: GraphQLType): GraphQLType {
    return {
      name: `${type.name}!`,
      kind: 'NON_NULL',
      ofType: type,
    };
  }

  /**
   * LIST 래퍼
   */
  static List(type: GraphQLType): GraphQLType {
    return {
      name: `[${type.name}]`,
      kind: 'LIST',
      ofType: type,
    };
  }

  /**
   * OBJECT 타입 생성
   */
  static ObjectType(name: string): ObjectTypeBuilder {
    return new ObjectTypeBuilder(name);
  }

  /**
   * Query 타입 빌더
   */
  static Query(): ObjectTypeBuilder {
    return new ObjectTypeBuilder('Query');
  }

  /**
   * Mutation 타입 빌더
   */
  static Mutation(): ObjectTypeBuilder {
    return new ObjectTypeBuilder('Mutation');
  }

  /**
   * 스키마 생성
   */
  static createSchema(config: {
    query: GraphQLType;
    mutation?: GraphQLType;
    subscription?: GraphQLType;
  }): GraphQLSchema {
    return {
      query: config.query,
      mutation: config.mutation,
      subscription: config.subscription,
    };
  }
}

/**
 * OBJECT 타입 빌더
 */
class ObjectTypeBuilder {
  private name: string;
  private fields: Record<string, GraphQLField> = {};

  constructor(name: string) {
    this.name = name;
  }

  /**
   * 필드 추가
   */
  field(
    name: string,
    config: {
      type: GraphQLType;
      args?: Record<string, GraphQLArg>;
      resolve?: (parent: any, args: any, context: any) => any;
    }
  ): this {
    this.fields[name] = {
      name,
      type: config.type,
      args: config.args,
      resolve: config.resolve,
    };
    return this;
  }

  /**
   * 스칼라 필드 (String)
   */
  string(name: string, resolve: (parent: any, args: any) => any): this {
    return this.field(name, {
      type: SchemaBuilder.String,
      resolve,
    });
  }

  /**
   * 스칼라 필드 (Int)
   */
  int(name: string, resolve: (parent: any, args: any) => any): this {
    return this.field(name, {
      type: SchemaBuilder.Int,
      resolve,
    });
  }

  /**
   * 스칼라 필드 (Boolean)
   */
  boolean(name: string, resolve: (parent: any, args: any) => any): this {
    return this.field(name, {
      type: SchemaBuilder.Boolean,
      resolve,
    });
  }

  /**
   * 빌드
   */
  build(): GraphQLType {
    return {
      name: this.name,
      kind: 'OBJECT',
      fields: this.fields,
    };
  }
}
