/**
 * 예제 2: 고급 - Nested 타입, 필터링, 정렬
 */

import { GraphQLServer } from '../src/server';
import { SchemaBuilder } from '../src/schema-builder';

// 더미 데이터
const posts = [
  { id: '1', title: 'GraphQL Basics', content: '...', authorId: '1', likes: 10 },
  { id: '2', title: 'Advanced GraphQL', content: '...', authorId: '2', likes: 25 },
  { id: '3', title: 'GraphQL in Production', content: '...', authorId: '1', likes: 35 },
];

const users = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
];

// Post 타입
const PostType = SchemaBuilder.ObjectType('Post')
  .field('id', {
    type: SchemaBuilder.ID,
    resolve: (post) => post.id,
  })
  .field('title', {
    type: SchemaBuilder.String,
    resolve: (post) => post.title,
  })
  .field('content', {
    type: SchemaBuilder.String,
    resolve: (post) => post.content,
  })
  .field('likes', {
    type: SchemaBuilder.Int,
    resolve: (post) => post.likes,
  })
  .field('author', {
    type: SchemaBuilder.ObjectType('Author')
      .field('id', {
        type: SchemaBuilder.ID,
        resolve: (user) => user.id,
      })
      .field('name', {
        type: SchemaBuilder.String,
        resolve: (user) => user.name,
      })
      .build(),
    resolve: (post) => users.find((u) => u.id === post.authorId),
  })
  .build();

// User 타입 (posts 포함)
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
  .field('posts', {
    type: SchemaBuilder.List(PostType),
    resolve: (user) => posts.filter((p) => p.authorId === user.id),
  })
  .build();

// Query
const QueryType = SchemaBuilder.Query()
  .field('posts', {
    type: SchemaBuilder.List(PostType),
    args: {
      limit: { name: 'limit', type: SchemaBuilder.Int },
      sortBy: { name: 'sortBy', type: SchemaBuilder.String },
    },
    resolve: (_, args) => {
      let result = [...posts];

      // 정렬
      if (args.sortBy === 'likes') {
        result.sort((a, b) => b.likes - a.likes);
      }

      // 제한
      if (args.limit) {
        result = result.slice(0, args.limit);
      }

      return result;
    },
  })
  .field('post', {
    type: PostType,
    args: {
      id: { name: 'id', type: SchemaBuilder.ID },
    },
    resolve: (_, args) => posts.find((p) => p.id === args.id),
  })
  .field('usersByName', {
    type: SchemaBuilder.List(UserType),
    args: {
      search: { name: 'search', type: SchemaBuilder.String },
    },
    resolve: (_, args) => {
      if (!args.search) return users;
      return users.filter((u) =>
        u.name.toLowerCase().includes(args.search.toLowerCase())
      );
    },
  })
  .build();

// Mutation
const MutationType = SchemaBuilder.Mutation()
  .field('likePost', {
    type: PostType,
    args: {
      postId: { name: 'postId', type: SchemaBuilder.ID },
    },
    resolve: (_, args) => {
      const post = posts.find((p) => p.id === args.postId);
      if (post) {
        post.likes += 1;
      }
      return post;
    },
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
  console.log('🚀 Advanced GraphQL\n');

  // 1. Nested 쿼리: 작가 정보 포함
  console.log('1️⃣ Posts with Author Info');
  let result = await server.query(`
    {
      posts {
        id
        title
        likes
        author {
          name
          email
        }
      }
    }
  `);
  console.log(JSON.stringify(result, null, 2));

  // 2. 정렬 및 제한
  console.log('\n2️⃣ Top 2 Posts by Likes');
  result = await server.query(`
    {
      posts(sortBy: "likes", limit: 2) {
        title
        likes
      }
    }
  `);
  console.log(JSON.stringify(result, null, 2));

  // 3. 사용자와 포스트
  console.log('\n3️⃣ User with Posts');
  result = await server.query(`
    {
      usersByName(search: "Alice") {
        name
        posts {
          title
          likes
        }
      }
    }
  `);
  console.log(JSON.stringify(result, null, 2));

  // 4. Mutation: Like
  console.log('\n4️⃣ Like Post');
  result = await server.query(`
    mutation {
      likePost(postId: "1") {
        title
        likes
      }
    }
  `);
  console.log(JSON.stringify(result, null, 2));

  // 5. 업데이트 확인
  console.log('\n5️⃣ Check Updated Likes');
  result = await server.query(`
    {
      post(id: "1") {
        title
        likes
      }
    }
  `);
  console.log(JSON.stringify(result, null, 2));

  await server.start();
}

main().catch(console.error);
