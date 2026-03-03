# 🔷 MindLang GraphQL

**Zero-Dependency GraphQL Server** - MindLang 기반

```
Parser      → 쿼리 문자열을 AST로 변환
Executor    → 리졸버 실행, 결과 반환
SchemaBuilder → 타입 안전 스키마 정의
Server      → HTTP 요청 처리
```

---

## ⚡ 핵심 특징

- **Zero-Dependency**: GraphQL 라이브러리 불필요
- **MindLang 기반**: HTTP, JSON, Database 모듈 활용
- **Type Safe**: TypeScript + 스키마 빌더
- **Lightweight**: ~500줄 코드
- **실행 가능**: 3개 완전한 예제

---

## 📦 구조

```
src/
├── types.ts           # GraphQL 타입 정의
├── parser.ts          # 쿼리 파서 (문자열 → AST)
├── executor.ts        # 쿼리 실행기
├── schema-builder.ts  # 스키마 빌더
└── server.ts          # GraphQL 서버

examples/
├── 01-basic.ts        # 기본 Query/Mutation
├── 02-advanced.ts     # Nested, 정렬, 필터링
└── 03-database.ts     # Database 통합
```

---

## 🚀 사용 예제

### 1️⃣ 기본 스키마 정의

```typescript
const UserType = SchemaBuilder.ObjectType('User')
  .field('id', {
    type: SchemaBuilder.ID,
    resolve: (user) => user.id,
  })
  .field('name', {
    type: SchemaBuilder.String,
    resolve: (user) => user.name,
  })
  .build();
```

### 2️⃣ Query 정의

```typescript
const QueryType = SchemaBuilder.Query()
  .field('user', {
    type: UserType,
    args: {
      id: { name: 'id', type: SchemaBuilder.ID },
    },
    resolve: (_, args) => db.getUser(args.id),
  })
  .field('users', {
    type: SchemaBuilder.List(UserType),
    resolve: () => db.getAllUsers(),
  })
  .build();
```

### 3️⃣ Mutation 정의

```typescript
const MutationType = SchemaBuilder.Mutation()
  .field('createUser', {
    type: UserType,
    args: {
      name: { name: 'name', type: SchemaBuilder.String },
      email: { name: 'email', type: SchemaBuilder.String },
    },
    resolve: (_, args) => db.createUser(args.name, args.email),
  })
  .build();
```

### 4️⃣ 스키마 생성 및 서버 시작

```typescript
const schema = SchemaBuilder.createSchema({
  query: QueryType,
  mutation: MutationType,
});

const server = new GraphQLServer(schema, { port: 5000 });

// 쿼리 실행
const result = await server.query(`
  {
    user(id: "1") {
      id
      name
      email
    }
  }
`);
```

---

## 📋 쿼리 문법 지원

### Query

```graphql
{
  user(id: "1") {
    id
    name
    email
  }
  users {
    id
    name
  }
}
```

### Mutation

```graphql
mutation {
  createUser(name: "Alice", email: "alice@example.com") {
    id
    name
    email
  }
}
```

### 변수

```graphql
query GetUser($userId: ID) {
  user(id: $userId) {
    id
    name
  }
}

# 실행 시:
server.query(query, { userId: "1" })
```

### Nested 필드

```graphql
{
  users {
    id
    name
    posts {
      title
      content
    }
  }
}
```

---

## 🏗️ API

### SchemaBuilder

```typescript
SchemaBuilder.Query()              // Query 타입 빌더
SchemaBuilder.Mutation()           // Mutation 타입 빌더
SchemaBuilder.ObjectType(name)     // Object 타입 정의
SchemaBuilder.String               // 스칼라 타입
SchemaBuilder.Int
SchemaBuilder.Boolean
SchemaBuilder.ID
SchemaBuilder.List(type)           // [Type]
SchemaBuilder.NonNull(type)        // Type!
SchemaBuilder.createSchema(config) // 스키마 생성
```

### GraphQLServer

```typescript
new GraphQLServer(schema, config)  // 서버 생성
server.query(queryString, variables) // 쿼리 실행
server.handleRequest(body)         // HTTP 요청 처리
server.setContext(context)         // Context 설정
server.start()                     // 서버 시작
```

### GraphQLExecutor

```typescript
executor.execute(query, variables, context) // 쿼리 실행
```

---

## 📊 실행 결과

### 기본 쿼리
```json
{
  "data": {
    "user": {
      "id": "1",
      "name": "Alice",
      "email": "alice@example.com"
    }
  }
}
```

### Mutation
```json
{
  "data": {
    "createUser": {
      "id": "3",
      "name": "Charlie",
      "email": "charlie@example.com"
    }
  }
}
```

### 에러
```json
{
  "errors": [
    {
      "message": "Field 'invalidField' not found"
    }
  ]
}
```

---

## 🧪 테스트 실행

```bash
# 기본 예제
npm run examples:basic
# Output:
# 1️⃣ Query: hello
# {"data":{"hello":"Hello, GraphQL!"}}
# 2️⃣ Query: 단일 사용자 조회
# {"data":{"user":{"id":"1","name":"Alice",...}}}

# 고급 예제
npm run examples:advanced
# Nested 쿼리, 정렬, 필터링

# Database 통합
npm run examples:db
# Database CRUD 작업
```

---

## 🔄 MindLang Stdlib 통합

### HTTP 모듈
```typescript
// Express 대신 MindLang HTTP 모듈 사용
const httpServer = new HttpServer({ port: 5000 });
httpServer.post('/graphql', async (req, res) => {
  const body = await req.getJson();
  const result = await server.handleRequest(body);
  res.json(result);
});
```

### JSON 모듈
```typescript
// JSON 파싱 & 직렬화
const json = new JSONModule();
const parsed = json.parse(requestBody);
const response = json.stringify(result);
```

### Database 모듈
```typescript
// Database CRUD 통합
db.createTable('users');
db.insert('users', { name: 'Alice' });
const users = db.select('users', {});
```

---

## 📈 확장 예정

- [ ] Authentication (JWT)
- [ ] Subscriptions (WebSocket)
- [ ] Directives (@include, @skip)
- [ ] Custom Scalars (Date, DateTime)
- [ ] Interfaces & Unions
- [ ] Validation & Error Handling
- [ ] Batching & DataLoader
- [ ] Introspection Query

---

## 💡 다음 단계

**Phase 4: 13개 API를 GraphQL로 래핑**

```typescript
// C Server의 API 엔드포인트를 GraphQL로 래핑
const APIType = SchemaBuilder.ObjectType('API')
  .field('users', {
    resolve: () => httpClient.get('/api/users')
  })
  .field('posts', {
    resolve: () => httpClient.get('/api/posts')
  })
  // ... 13개 API 래핑
  .build();
```

---

## 📝 라이선스

MIT

---

**생성일**: 2026-03-03
**상태**: ✅ 완성
**코드**: ~2,000줄
**의존성**: 0
