// src/_helpers/db.ts
import config from '../../config.json';
import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';
import { Role } from './role';

export interface Database {
  User: any; // We'll type this properly after creating the model
  Department: any;
  Employee: any;
  Request: any;
}

export const db: Database = {} as Database;

export async function initialize(): Promise<void> {
  const { host, port, user, password, database } = config.database;

  // Create database if it doesn't exist
  const connection = await mysql.createConnection({ host, port, user, password });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
  await connection.end();

  // Connect to database with Sequelize
  const sequelize = new Sequelize(database, user, password, { dialect: 'mysql' });

  // Initialize models
  const { default: userModel } = await import('../users/user.model');
  const { default: departmentModel } = await import('../departments/department.model');
  const { default: employeeModel } = await import('../employees/employee.model');
  const { default: requestModel } = await import('../requests/request.model');
  db.User = userModel(sequelize);
  db.Department = departmentModel(sequelize);
  db.Employee = employeeModel(sequelize);
  db.Request = requestModel(sequelize);

  // Sync models with database
  await sequelize.sync({ alter: true });

  // Seed one admin account for first-time setup.
  const adminEmail = 'admin@example.com';
  const existingAdmin = await db.User.scope('withHash').findOne({ where: { email: adminEmail } });

  if (!existingAdmin) {
    await db.User.create({
      title: 'Mr',
      firstName: 'Admin',
      lastName: 'User',
      email: adminEmail,
      role: Role.Admin,
      passwordHash: await bcrypt.hash('Password123!', 10),
    });

    console.log('✅ Seeded default admin account (admin@example.com / Password123!)');
  }

  const defaultDepartments = [
    { name: 'Engineering', description: 'Software development and engineering team' },
    { name: 'HR', description: 'Human resources and recruitment' },
  ];

  for (const department of defaultDepartments) {
    const existingDepartment = await db.Department.findOne({ where: { name: department.name } });
    if (!existingDepartment) {
      await db.Department.create(department);
    }
  }

  console.log('✅ Database initialized and models synced');
}