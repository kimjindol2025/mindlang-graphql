// GraphQL Types

export interface GraphQLType {
  name: string;
  kind: 'SCALAR' | 'OBJECT' | 'INTERFACE' | 'UNION' | 'ENUM' | 'INPUT_OBJECT' | 'LIST' | 'NON_NULL';
  fields?: Record<string, GraphQLField>;
  ofType?: GraphQLType;
}

export interface GraphQLField {
  name: string;
  type: GraphQLType;
  args?: Record<string, GraphQLArg>;
  resolve?: (parent: any, args: any, context: any) => any;
}

export interface GraphQLArg {
  name: string;
  type: GraphQLType;
  defaultValue?: any;
}

export interface GraphQLSchema {
  query: GraphQLType;
  mutation?: GraphQLType;
  subscription?: GraphQLType;
}

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export interface GraphQLResponse {
  data?: any;
  errors?: GraphQLError[];
}

export interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: (string | number)[];
}

export interface ResolverContext {
  db?: any;
  userId?: string;
  user?: any;
}
