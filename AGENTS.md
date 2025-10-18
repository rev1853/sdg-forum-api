# Project Rules
- Use express js to build the api
- I prefer file based controller, so each feature would have its own file
- Use JWT Token as authentication method
- The jwt only used for user-scoped endpoints, so endpoints like post list, and other that dont need user identification should not use JWT
- To store file, create a folder and name the file uniquely
- Integrate this api to Swagger UI to manage the endpoints
- Use soft delete method in the database
- You can modify the schema and migrate it using prisma
- Always use pagination for list-style response

# Features
- This api is to manage a social media app
- The features is login, register, create forum, create thread, see thread list, thread detail, follow forum, and comment
- There are owner-scoped features like take down the post, comment, make follower as moderator, owner can remove their forum