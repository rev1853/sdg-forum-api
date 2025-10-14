# SGD Forum API

Starter Express.js REST API using Prisma ORM and MySQL. Includes example routes and Prisma models for `User` and `Post`.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment example and update it with your MySQL connection string:
   ```bash
   cp .env.example .env
   ```
3. Apply database migrations (this will also generate the Prisma client):
   ```bash
   npx prisma migrate dev --name init
   ```
   Use `npx prisma generate` if you only need to regenerate the client after schema changes.
4. Start the dev server:
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000/health` to verify the API is running.

## Example endpoints

All example payloads use JSON.

- `GET /health` – Health check.
- `GET /users` – List users with their posts.
- `POST /users`
  ```json
  {
    "email": "user@example.com",
    "name": "Grace Hopper"
  }
  ```
- `GET /posts` – List posts with author information.
- `POST /posts`
  ```json
  {
    "title": "Hello World",
    "content": "My first post",
    "authorId": 1,
    "published": false
  }
  ```
- `PATCH /posts/:id/publish` – Mark a post as published.

## Useful commands

- `npm start` – Run the server without hot reloading.
- `npm run dev` – Start in watch mode with Nodemon.
- `npm run prisma:studio` – Launch Prisma Studio to inspect the database.
