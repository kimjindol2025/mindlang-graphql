/**
 * 예제 1: 기본 GraphQL 서버
 */

import { GraphQLServer } from '../src/server';
import { SchemaBuilder } from '../src/schema-builder';

// 더미 데이터
const users = [
  { id: '1', name: 'Alice', email: 'alice@example.com', age: 25 },
  { id: '2', name: 'Bob', email: 'bob@example.com', age: 30 },
  { id: '3', name: 'Charlie', email: 'charlie@example.com', age: 28 },
];

// User 타입
const UserType = SchemaBuilder.ObjectType('User')
  .field('id', {
    type: SchemaBuilder.ID,
    resolve: (user) => user.id,
  })
  .field('name', {
    type: SchemaBuilder.String,
    resolve: (user) => user.name,
  })
  .field('email', {
    type: SchemaBuilder.String,
    resolve: (user) => user.email,
  })
  .field('age', {
    type: SchemaBuilder.Int,
    resolve: (user) => user.age,
  })
  .build();

// Query 타입
const QueryType = SchemaBuilder.Query()
  .field('hello', {
    type: SchemaBuilder.String,
    resolve: () => 'Hello, GraphQL!',
  })
  .field('user', {
    type: UserType,
    args: {
      id: { name: 'id', type: SchemaBuilder.ID },
    },
    resolve: (_, args) => users.find((u) => u.id === args.id),
  })
  .field('users', {
    type: SchemaBuilder.List(UserType),
    resolve: () => users,
  })
  .field('userCount', {
    type: SchemaBuilder.Int,
    resolve: () => users.length,
  })
  .build();

// Mutation 타입
const MutationType = SchemaBuilder.Mutation()
  .field('createUser', {
    type: UserType,
    args: {
      name: { name: 'name', type: SchemaBuilder.String },
      email: { name: 'email', type: SchemaBuilder.String },
      age: { name: 'age', type: SchemaBuilder.Int },
    },
    resolve: (_, args) => {
      const newUser = {
        id: String(users.length + 1),
        name: args.name,
        email: args.email,
        age: args.age,
      };
      users.push(newUser);
      return newUser;
    },
  })
  .build();

// 스키마 생성
const schema = SchemaBuilder.createSchema({
  query: QueryType,
  mutation: MutationType,
});

// 서버 생성
const server = new GraphQLServer(schema, { port: 5000 });

// 테스트 쿼리 실행
async function main() {
  console.log('🚀 GraphQL Server\n');

  // 1. 간단한 쿼리
  console.log('1️⃣ Query: hello');
  let result = await server.query('{ hello }');
  console.log(JSON.stringify(result, null, 2));

  // 2. 사용자 조회
  console.log('\n2️⃣ Query: 단일 사용자 조회');
  result = await server.query(`
    {
      user(id: "1") {
        id
        name
        email
        age
      }
    }
  `);
  console.log(JSON.stringify(result, null, 2));

  // 3. 모든 사용자 조회
  console.log('\n3️⃣ Query: 모든 사용자');
  result = await server.query(`
    {
      users {
        id
        name
        email
      }
    }
  `);
  console.log(JSON.stringify(result, null, 2));

  // 4. 사용자 수
  console.log('\n4️⃣ Query: 사용자 수');
  result = await server.query('{ userCount }');
  console.log(JSON.stringify(result, null, 2));

  // 5. Mutation: 사용자 생성
  console.log('\n5️⃣ Mutation: 사용자 생성');
  result = await server.query(`
    mutation {
      createUser(name: "Diana", email: "diana@example.com", age: 26) {
        id
        name
        email
        age
      }
    }
  `);
  console.log(JSON.stringify(result, null, 2));

  // 6. 생성 후 사용자 수 다시 확인
  console.log('\n6️⃣ Query: 사용자 수 (생성 후)');
  result = await server.query('{ userCount }');
  console.log(JSON.stringify(result, null, 2));

  // 서버 시작
  await server.start();
}

main().catch(console.error);
