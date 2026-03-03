/**
 * 예제 3: Database 통합
 * MindLang Database 모듈과 통합
 */

import { GraphQLServer } from '../src/server';
import { SchemaBuilder } from '../src/schema-builder';

// Mock Database (실제로는 MindLang Database 모듈 사용)
class MockDatabase {
  private users: Array<{ id: string; name: string; email: string }> = [
    { id: '1', name: 'Alice', email: 'alice@example.com' },
    { id: '2', name: 'Bob', email: 'bob@example.com' },
  ];

  private todos: Array<{ id: string; userId: string; title: string; completed: boolean }> = [
    { id: '1', userId: '1', title: 'Learn GraphQL', completed: true },
    { id: '2', userId: '1', title: 'Build API', completed: false },
    { id: '3', userId: '2', title: 'Read Docs', completed: true },
  ];

  getUser(id: string) {
    return this.users.find((u) => u.id === id);
  }

  getAllUsers() {
    return this.users;
  }

  createUser(name: string, email: string) {
    const newUser = {
      id: String(this.users.length + 1),
      name,
      email,
    };
    this.users.push(newUser);
    return newUser;
  }

  getTodosByUser(userId: string) {
    return this.todos.filter((t) => t.userId === userId);
  }

  getAllTodos() {
    return this.todos;
  }

  createTodo(userId: string, title: string) {
    const newTodo = {
      id: String(this.todos.length + 1),
      userId,
      title,
      completed: false,
    };
    this.todos.push(newTodo);
    return newTodo;
  }

  completeTodo(id: string) {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = true;
    }
    return todo;
  }
}

const db = new MockDatabase();

// Todo 타입
const TodoType = SchemaBuilder.ObjectType('Todo')
  .field('id', {
    type: SchemaBuilder.ID,
    resolve: (todo) => todo.id,
  })
  .field('title', {
    type: SchemaBuilder.String,
    resolve: (todo) => todo.title,
  })
  .field('completed', {
    type: SchemaBuilder.Boolean,
    resolve: (todo) => todo.completed,
  })
  .build();

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
  .field('todos', {
    type: SchemaBuilder.List(TodoType),
    resolve: (user) => db.getTodosByUser(user.id),
  })
  .build();

// Query
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
  .field('todos', {
    type: SchemaBuilder.List(TodoType),
    resolve: () => db.getAllTodos(),
  })
  .build();

// Mutation
const MutationType = SchemaBuilder.Mutation()
  .field('createUser', {
    type: UserType,
    args: {
      name: { name: 'name', type: SchemaBuilder.String },
      email: { name: 'email', type: SchemaBuilder.String },
    },
    resolve: (_, args) => db.createUser(args.name, args.email),
  })
  .field('createTodo', {
    type: TodoType,
    args: {
      userId: { name: 'userId', type: SchemaBuilder.ID },
      title: { name: 'title', type: SchemaBuilder.String },
    },
    resolve: (_, args) => db.createTodo(args.userId, args.title),
  })
  .field('completeTodo', {
    type: TodoType,
    args: {
      id: { name: 'id', type: SchemaBuilder.ID },
    },
    resolve: (_, args) => db.completeTodo(args.id),
  })
  .build();

// 스키마
const schema = SchemaBuilder.createSchema({
  query: QueryType,
  mutation: MutationType,
});

// 서버
const server = new GraphQLServer(schema);

// 테스트
async function main() {
  console.log('🚀 GraphQL + Database\n');

  // 1. 사용자와 TODO 조회
  console.log('1️⃣ User with TODOs');
  let result = await server.query(`
    {
      user(id: "1") {
        name
        email
        todos {
          title
          completed
        }
      }
    }
  `);
  console.log(JSON.stringify(result, null, 2));

  // 2. 모든 사용자와 TODO
  console.log('\n2️⃣ All Users with TODOs');
  result = await server.query(`
    {
      users {
        name
        todos {
          title
        }
      }
    }
  `);
  console.log(JSON.stringify(result, null, 2));

  // 3. 새 사용자 생성
  console.log('\n3️⃣ Create New User');
  result = await server.query(`
    mutation {
      createUser(name: "Charlie", email: "charlie@example.com") {
        id
        name
        email
      }
    }
  `);
  console.log(JSON.stringify(result, null, 2));

  // 4. 새 TODO 생성
  console.log('\n4️⃣ Create TODO');
  result = await server.query(`
    mutation {
      createTodo(userId: "1", title: "Deploy GraphQL") {
        id
        title
        completed
      }
    }
  `);
  console.log(JSON.stringify(result, null, 2));

  // 5. TODO 완료
  console.log('\n5️⃣ Complete TODO');
  result = await server.query(`
    mutation {
      completeTodo(id: "2") {
        title
        completed
      }
    }
  `);
  console.log(JSON.stringify(result, null, 2));

  await server.start();
}

main().catch(console.error);
