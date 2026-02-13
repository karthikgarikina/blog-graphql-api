# Production-Ready GraphQL Blog API

[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![GraphQL](https://img.shields.io/badge/GraphQL-16.8-E10098)](https://graphql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-336791)](https://www.postgresql.org/)

A production-ready, performant GraphQL API for a blog platform featuring the DataLoader pattern for N+1 optimization, field-level JWT authorization, and real-time capabilities with GraphQL subscriptions.

## 🎯 Features

- **GraphQL API** with queries, mutations, and subscriptions
- **DataLoader Pattern** - Eliminates N+1 query problem with batched database calls
- **Field-Level Authorization** - JWT-based auth with granular access control
- **Real-Time Subscriptions** - WebSocket support for live updates
- **Cursor-Based Pagination** - Efficient pagination for large datasets
- **Fully Containerized** - Docker Compose for one-command deployment
- **SQL Query Logging** - Debug and verify DataLoader optimization

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Authentication & Authorization](#-authentication--authorization)
- [DataLoader Verification](#-dataloader-verification)
- [Subscriptions](#-subscriptions)
- [Testing](#-testing)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- (Optional) Node.js 20+ for local development

### Start the Application

```bash
# Clone the repository
git clone https://github.com/karthikgarikina/blog-graphql-api
cd blog-graphql-api

# Start all services (app, PostgreSQL, Redis)
docker-compose up --build

# The API will be available at:
# - GraphQL Playground: http://localhost:4000/graphql
# - GraphQL Endpoint: POST http://localhost:4000/graphql
# - Schema SDL: GET http://localhost:4000/graphql/schema
# - WebSocket: ws://localhost:4000/graphql
```

The database is automatically seeded with test data on first run.

### Stop the Application

```bash
docker-compose down
```

---

## 🏗️ Architecture

### Tech Stack

- **API Framework**: Apollo Server 4 + Express
- **Database**: PostgreSQL 14
- **Cache/PubSub**: Redis 7
- **Authentication**: JSON Web Tokens (JWT)
- **Real-time**: GraphQL Subscriptions over WebSockets
- **N+1 Solution**: DataLoader

### Database Schema

**users**
```
id          SERIAL PRIMARY KEY
username    VARCHAR(255) UNIQUE NOT NULL
email       VARCHAR(255) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL
role        VARCHAR(50) DEFAULT 'user'
created_at  TIMESTAMPTZ DEFAULT NOW()
```

**posts**
```
id          SERIAL PRIMARY KEY
title       VARCHAR(255) NOT NULL
content     TEXT NOT NULL
author_id   INT REFERENCES users(id)
published   BOOLEAN DEFAULT false
created_at  TIMESTAMPTZ DEFAULT NOW()
updated_at  TIMESTAMPTZ DEFAULT NOW()
```

**comments**
```
id          SERIAL PRIMARY KEY
content     TEXT NOT NULL
author_id   INT REFERENCES users(id)
post_id     INT REFERENCES posts(id)
created_at  TIMESTAMPTZ DEFAULT NOW()
```

### Seeded Test Data

- **Users**: `user1`, `user2`, `admin` (username as password)
- **Posts**: 3 posts (2 published, 1 draft)
- **Comments**: 3 comments across posts

---

## 📡 API Documentation

### Endpoint Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/graphql` | GraphQL Playground (interactive UI) |
| POST | `/graphql` | GraphQL API endpoint |
| GET | `/graphql/schema` | Download schema SDL |
| WS | `/graphql` | GraphQL Subscriptions |

### Queries

#### `me: User`
Returns the currently authenticated user.

**Requires**: JWT token

**Example**:
```graphql
query {
  me {
    id
    username
    email
    role
  }
}
```

**Headers**:
```
Authorization: Bearer <your-jwt-token>
```

---

#### `user(id: ID!): User`
Fetch a single user by ID.

**Example**:
```graphql
query {
  user(id: "1") {
    id
    username
    email  # Only visible to owner or admin
    posts(first: 5) {
      edges {
        node {
          id
          title
        }
      }
    }
  }
}
```

---

#### `users(first: Int, after: String): UserConnection`
Fetch paginated list of users.

**Example**:
```graphql
query {
  users(first: 10) {
    edges {
      cursor
      node {
        id
        username
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

**Pagination**:
```graphql
query {
  users(first: 10, after: "MQ==") {
    edges { node { id } }
  }
}
```

---

#### `post(id: ID!): Post`
Fetch a single post by ID.

**Example**:
```graphql
query {
  post(id: "1") {
    id
    title
    content
    published
    author {
      username
    }
    comments(first: 5) {
      edges {
        node {
          id
          content
          author {
            username
          }
        }
      }
    }
  }
}
```

---

#### `posts(first: Int, after: String, published: Boolean): PostConnection`
Fetch paginated list of posts with optional filter.

**Example**:
```graphql
query {
  posts(first: 10, published: true) {
    edges {
      cursor
      node {
        id
        title
        author {
          username
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

---

### Mutations

#### `login(username: String!): AuthPayload`
Authenticate and receive JWT token.

**Example**:
```graphql
mutation {
  login(username: "user1") {
    token
    user {
      id
      username
      role
    }
  }
}
```

**Response**:
```json
{
  "data": {
    "login": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "1",
        "username": "user1",
        "role": "user"
      }
    }
  }
}
```

---

#### `createPost(input: CreatePostInput!): Post`
Create a new post.

**Requires**: JWT token

**Example**:
```graphql
mutation {
  createPost(input: {
    title: "My New Post"
    content: "This is the content..."
    published: true
  }) {
    id
    title
    content
    published
    author {
      username
    }
  }
}
```

---

#### `updatePost(id: ID!, input: UpdatePostInput!): Post`
Update an existing post (author only).

**Requires**: JWT token (must be post author)

**Example**:
```graphql
mutation {
  updatePost(id: "1", input: {
    title: "Updated Title"
    published: true
  }) {
    id
    title
    published
  }
}
```

---

#### `deletePost(id: ID!): Boolean`
Delete a post (author only).

**Requires**: JWT token (must be post author)

**Example**:
```graphql
mutation {
  deletePost(id: "1")
}
```

---

#### `createComment(input: CreateCommentInput!): Comment`
Add a comment to a post.

**Requires**: JWT token

**Example**:
```graphql
mutation {
  createComment(input: {
    postId: "1"
    content: "Great post!"
  }) {
    id
    content
    author {
      username
    }
  }
}
```

---

### Subscriptions

#### `postCreated: Post`
Subscribe to new post creation events.

**Example**:
```graphql
subscription {
  postCreated {
    id
    title
    author {
      username
    }
  }
}
```

---

#### `commentAdded(postId: ID!): Comment`
Subscribe to new comments on a specific post.

**Example**:
```graphql
subscription {
  commentAdded(postId: "1") {
    id
    content
    author {
      username
    }
  }
}
```

---

## 🔐 Authentication & Authorization

### JWT Authentication

All protected operations require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Login Flow

1. Call `login` mutation with username
2. Receive JWT token in response
3. Include token in subsequent requests

### Field-Level Authorization

The `User.email` field implements granular access control:

- **Owner**: Can view their own email
- **Admin**: Can view any user's email
- **Other users**: Cannot view email (returns `null` + error)

**Example**:
```graphql
# As user1 (ID: 1)
{ user(id: "1") { email } }  # ✓ Returns email

{ user(id: "2") { email } }  # ✗ Returns null + error

# As admin
{ user(id: "2") { email } }  # ✓ Returns email
```

### Role-Based Access

- **user**: Standard permissions (CRUD own posts/comments)
- **admin**: Full access to all resources

---

## ⚡ DataLoader Verification

### The N+1 Problem

Without DataLoader, fetching posts with authors causes N+1 queries:
```sql
SELECT * FROM posts;           -- 1 query
SELECT * FROM users WHERE id = 1;  -- N queries (one per post)
SELECT * FROM users WHERE id = 2;
SELECT * FROM users WHERE id = 1;
...
```

### DataLoader Solution

DataLoader batches individual loads into a single query:
```sql
SELECT * FROM posts;
SELECT * FROM users WHERE id = ANY($1);  -- Single batch query [1,2]
```

### Enable SQL Logging

Set `SQL_LOG=true` in docker-compose.yml (already enabled):

```yaml
environment:
  SQL_LOG: "true"
```

### Verify Batching

Run this query:
```graphql
{
  posts(first: 10) {
    edges {
      node {
        id
        title
        author {
          username
        }
        comments(first: 5) {
          edges {
            node {
              id
              content
              author {
                username
              }
            }
          }
        }
      }
    }
  }
}
```

Check logs:
```bash
docker-compose logs app | grep "SQL:"
```

**Expected Output**:
```
SQL: SELECT * FROM posts
SQL: SELECT * FROM users WHERE id = ANY($1)      ← Batched!
SQL: SELECT * FROM comments WHERE post_id = ANY($1)  ← Batched!
```

✅ **Only 3 queries** instead of 1 + N + M!

---

## 🔴 Subscriptions

### WebSocket Connection

Use a GraphQL WebSocket client or `wscat`:

```bash
npm install -g wscat
wscat -c ws://localhost:4000/graphql -s graphql-transport-ws
```

### Connection Init

Send authentication:
```json
{"type":"connection_init","payload":{"Authorization":"Bearer <token>"}}
```

### Subscribe to Post Creation

```json
{
  "id":"1",
  "type":"subscribe",
  "payload":{
    "query":"subscription { postCreated { id title author { username } } }"
  }
}
```

### Subscribe to Comments

```json
{
  "id":"2",
  "type":"subscribe",
  "payload":{
    "query":"subscription { commentAdded(postId: \"1\") { id content author { username } } }"
  }
}
```

### Trigger Events

Create a post or comment via HTTP GraphQL:
```graphql
mutation {
  createPost(input: { title: "New", content: "Content", published: true }) {
    id
  }
}
```

The WebSocket client will receive the event immediately.

---


### GraphQL Playground

Open http://localhost:4000/graphql in your browser for an interactive IDE with:
- Schema documentation
- Query builder with autocomplete
- Request history

---

## 🔧 Environment Variables

All variables are documented in `.env.example`:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@db:5432/blogdb` |
| `JWT_SECRET` | Secret key for signing JWTs | `super-secret-key` |
| `PORT` | Application server port | `4000` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379` |
| `SQL_LOG` | Enable SQL query logging | `true` |

⚠️ **Production**: Change `JWT_SECRET` and database credentials!

---

## 📁 Project Structure

```
blog-graphql-api/
├── docker-compose.yml          # Container orchestration
├── Dockerfile                  # App container definition
├── package.json                # Dependencies
├── .env.example                # Environment template
├── README.md                   # This file
│
├── seeds/
│   └── init.sql                # Database schema + seed data
│
├── src/
│   ├── index.js                # Entry point
│   ├── server.js               # Apollo Server + WebSocket setup
│   ├── app.js                  # Express app
│   │
│   ├── auth/
│   │   ├── authMiddleware.js   # JWT verification + context
│   │   └── jwt.js              # Token generation/validation
│   │
│   ├── config/
│   │   └── env.js              # Environment config
│   │
│   ├── db/
│   │   └── pool.js             # PostgreSQL connection pool
│   │
│   ├── loaders/
│   │   └── index.js            # DataLoader factory
│   │
│   ├── resolvers/
│   │   ├── index.js            # Resolver aggregation
│   │   ├── query.js            # Query resolvers
│   │   ├── mutation.js         # Mutation resolvers
│   │   ├── subscription.js     # Subscription resolvers
│   │   ├── user.js             # User type resolvers
│   │   ├── post.js             # Post type resolvers
│   │   └── comment.js          # Comment type resolvers
│   │
│   ├── schema/
│   │   └── schema.graphql      # GraphQL SDL schema
│   │
│   ├── services/
│   │   ├── user.service.js     # User database operations
│   │   ├── post.service.js     # Post database operations
│   │   └── comment.service.js  # Comment database operations
│   │
│   └── utils/
│       ├── errors.js           # Custom error classes
│       └── pagination.js       # Cursor encoding/decoding

```

---

## ✅ Core Requirements Checklist

### Containerization
- ✅ Docker Compose orchestration
- ✅ Healthchecks for dependencies
- ✅ Automatic database seeding
- ✅ One-command startup

### Database
- ✅ PostgreSQL with proper schema
- ✅ Foreign key relationships
- ✅ Test data seeding

### GraphQL API
- ✅ POST /graphql endpoint
- ✅ GET /graphql playground
- ✅ GET /graphql/schema endpoint
- ✅ WS /graphql subscriptions

### Queries
- ✅ `user(id)` - Single user
- ✅ `users(first, after)` - Paginated users
- ✅ `post(id)` - Single post
- ✅ `posts(first, after, published)` - Paginated posts
- ✅ `me` - Current authenticated user

### Mutations
- ✅ `login` - Authentication
- ✅ `createPost` - Create post (auth required)
- ✅ `updatePost` - Update post (author only)
- ✅ `deletePost` - Delete post (author only)
- ✅ `createComment` - Add comment (auth required)

### Subscriptions
- ✅ `postCreated` - New post notifications
- ✅ `commentAdded(postId)` - New comment notifications

### DataLoader
- ✅ User batching (N+1 elimination)
- ✅ Comment batching (N+1 elimination)
- ✅ SQL logging for verification

### Authorization
- ✅ JWT authentication
- ✅ Field-level access control (email)
- ✅ Role-based permissions (admin)
- ✅ Ownership validation (update/delete)

### Pagination
- ✅ Cursor-based pagination
- ✅ PageInfo with hasNextPage
- ✅ Opaque cursors (base64)

---

## 🎓 Key Concepts Demonstrated

1. **N+1 Query Optimization**: DataLoader batches individual database calls into efficient bulk operations
2. **Field-Level Authorization**: Granular access control at the GraphQL field level
3. **Real-Time Capabilities**: WebSocket subscriptions for live updates
4. **Schema-First Design**: GraphQL SDL defines the contract between client and server
5. **Production Architecture**: Proper separation of concerns, modular resolvers, service layer

---

## 📝 Notes

- **Performance**: DataLoader provides request-scoped caching and batching
- **Security**: JWTs are stateless; implement refresh tokens for production
- **Scalability**: Redis pub/sub enables multi-instance deployments
- **Error Handling**: GraphQL errors are returned in the `errors` array
- **Database**: PostgreSQL data persists in `./db-data` volume

---

## Support

For issues or questions:
1. Check GraphQL Playground at http://localhost:4000/graphql
2. View logs: `docker-compose logs app`
3. Verify SQL queries: Check logs with `SQL_LOG=true`
4. Test subscriptions: Use wscat or GraphQL Playground (WS tab)

---

**Built with ❤️ using Apollo Server, DataLoader, and PostgreSQL**
