# TypeScript CRUD API with Node.js, Express, and MySQL

A small CRUD API built with TypeScript, Express, Sequelize, and MySQL. It manages user records and includes validation, password hashing, and typed model/service/controller code.

## What you need

- Node.js
- MySQL
- npm
- Postman, Thunder Client, EchoAPI, or curl

## Setup

1. Install dependencies:

```bash
npm install
```

2. Make sure MySQL is running on your machine.

3. Update [config.json](config.json) with your local database settings:

```json
{
  "database": {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "",
    "database": "typescript_crud_api"
  },
  "jwtSecret": "change-this-in-production-123!"
}
```

4. Start the app in development mode:

```bash
npm run start:dev
```

If everything is working, the server starts on `http://localhost:4000` and creates the database if it does not already exist.

## Build and run

```bash
npm run build
npm start
```

## Available routes

The API currently exposes these user routes:

- `GET /users` - get all users
- `GET /users/:id` - get one user
- `POST /users` - create a user
- `PUT /users/:id` - update a user
- `DELETE /users/:id` - delete a user

## Example requests

### Create a user

```http
POST http://localhost:4000/users
Content-Type: application/json

{
  "title": "Mr",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "password": "secret123",
  "confirmPassword": "secret123",
  "role": "User"
}
```

Expected response:

```json
{
  "message": "User created"
}
```

### Get all users

```http
GET http://localhost:4000/users
```

### Update a user

```http
PUT http://localhost:4000/users/1
Content-Type: application/json

{
  "firstName": "Janet",
  "password": "newsecret456",
  "confirmPassword": "newsecret456"
}
```

### Delete a user

```http
DELETE http://localhost:4000/users/1
```

## Testing

You can test the API with Postman or curl.

### Curl example: create a user

```bash
curl -X POST http://localhost:4000/users ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Mr\",\"firstName\":\"Jane\",\"lastName\":\"Smith\",\"email\":\"jane@example.com\",\"password\":\"secret123\",\"confirmPassword\":\"secret123\",\"role\":\"User\"}"
```

### Curl example: get all users

```bash
curl http://localhost:4000/users
```

### Curl example: validation error

```bash
curl -X POST http://localhost:4000/users ^
  -H "Content-Type: application/json" ^
  -d "{\"firstName\":\"Bob\"}"
```


Expected response:

```json
{
  "message": "Validation error: ..."
}
```

---

That’s it—spin up the server, poke at the endpoints, and see what breaks. Happy coding.

