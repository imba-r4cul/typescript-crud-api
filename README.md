# Full-Stack TypeScript CRUD API (Lab 2 Integration)

This is a full-stack project I built to connect a **TypeScript CRUD API** with my existing **Lab 2 frontend**. The goal was to create a secure, reliable backend that handles user accounts, departments, and employees while ensuring everything is strictly typed for better stability.

## 🌟 What's inside?

I used a modern tech stack to make sure the app is both fast and secure:

- **TypeScript & Node.js**: For a strictly typed and predictable backend.
- **Express**: To handle all the API routing.
- **Sequelize & MySQL**: To manage data persistence and automatic database syncing.
- **JWT Authentication**: To keep user sessions secure and implement Role-Based Access Control (RBAC).

---

## 🛠️ Getting Started

To get this running on your local machine, you'll just need **Node.js** and **MySQL** (I used XAMPP for my setup).

### 1. Setup the Files

First, clone the project and install all the necessary packages:

```bash
git clone https://github.com/your-username/typescript-crud-api.git
cd typescript-crud-api
npm install
```

### 2. Configure your Database

1. Open up **XAMPP** (or your MySQL tool) and start the MySQL service.
2. Open the `config.json` file in the root folder. You'll need to put in your local database credentials here:
   ```json
   {
     "database": {
       "host": "localhost",
       "user": "root",
       "password": "",
       "database": "typescript_crud_api"
     },
     "jwtSecret": "your_custom_secret_key"
   }
   ```
   _Note: Don't worry about creating the database manually—the API is set up to create it for you on the first run._

### 3. Run the App

Launch the server in development mode:

```bash
npm run start:dev
```

The backend should now be live at `http://localhost:4000`.

---

## 🔗 How to link your Lab 2 Activity

If you want to plug your own frontend into this API, I've made it pretty straightforward:

1.  **Drop your files**: Put your Lab 2 HTML/CSS/JS files into the `Full-Stack-Web-App/` directory.
2.  **Point to the API**: In your JavaScript (or the provided `api-client.js`), make sure the `API_BASE_URL` is set to `http://localhost:4000`.
3.  **Authentication**: When a user logs in, save the token they get back into `localStorage`. The `api-client.js` is already set up to look for that token and attach it to your requests automatically.
4.  **Test it**: Use the browser's **Network tab (F12)** to check that your requests are hitting the right endpoints.

---

## 📑 API Reference

I've organized the routes into a few main categories:

### 🔐 Authentication

- `POST /auth/register` (Create a user)
- `POST /auth/login` (Get your JWT token)

### 👥 Administrative Controls (Admin Only)

- `GET /users` (See everyone)
- `GET /departments` & `GET /employees` (Management routes)
