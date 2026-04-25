// src/server.ts
import express, { Application } from 'express';
import cors from 'cors';
import { errorHandler } from './_middleware/errorHandler';
import { authenticateJWT, authorizeRole } from './_middleware/auth.middleware';
import { initialize } from './_helpers/db';
import { Role } from './_helpers/role';
import authController from './auth/auth.controller';
import departmentsController from './departments/departments.controller';
import employeesController from './employees/employees.controller';
import requestsController from './requests/requests.controller';
import usersController from './users/users.controller';

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// API Routes
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/auth', authController);
app.use('/users', authenticateJWT, authorizeRole(Role.Admin), usersController);
app.use('/departments', authenticateJWT, authorizeRole(Role.Admin), departmentsController);
app.use('/employees', authenticateJWT, authorizeRole(Role.Admin), employeesController);
app.use('/requests', authenticateJWT, requestsController);

// Global Error Handler (must be last)
app.use(errorHandler);

// Start server + initialize database
const PORT = process.env.PORT || 4000;

initialize()  
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`🔖 Test with: POST /users with { email, password, ... }`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });