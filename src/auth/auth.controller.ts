import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import config from '../../config.json';
import { db } from '../_helpers/db';
import { Role } from '../_helpers/role';
import { validateRequest } from '../_middleware/validateRequest';
import { authenticateJWT, type AuthenticatedRequest } from '../_middleware/auth.middleware';

const router = Router();

router.post('/register', registerSchema, register);
router.post('/login', loginSchema, login);
router.get('/me', authenticateJWT, me);

export default router;

function registerSchema(req: Request, res: Response, next: NextFunction): void {
  const schema = Joi.object({
    title: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    role: Joi.string().valid(Role.Admin, Role.User).default(Role.User),
  });

  validateRequest(req, next, schema);
}

async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const existingUser = await db.User.findOne({ where: { email: req.body.email } });
    if (existingUser) {
      throw new Error(`Email "${req.body.email}" is already registered`);
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const { title, firstName, lastName, email, role } = req.body as {
      title: string;
      firstName: string;
      lastName: string;
      email: string;
      role?: string;
    };

    const createdUser = await db.User.create({
      title,
      firstName,
      lastName,
      email,
      role: role || Role.User,
      passwordHash,
    });

    const token = generateToken(createdUser);

    res.status(201).json({
      message: 'User registered',
      user: safeUser(createdUser),
      token,
    });
  } catch (error) {
    next(error);
  }
}

function loginSchema(req: Request, res: Response, next: NextFunction): void {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  validateRequest(req, next, schema);
}

async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await db.User.scope('withHash').findOne({ where: { email: req.body.email } });

    if (!user) {
      return next('Email or password is incorrect');
    }

    const isPasswordValid = await bcrypt.compare(req.body.password, user.passwordHash as string);
    if (!isPasswordValid) {
      return next('Email or password is incorrect');
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      user: safeUser(user),
      token,
    });
  } catch (error) {
    next(error);
  }
}

function me(req: Request, res: Response): void {
  const authReq = req as AuthenticatedRequest;
  res.json({ user: authReq.user });
}

function generateToken(user: { id: number; role: string; email: string }): string {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    config.jwtSecret,
    { expiresIn: '1d' }
  );
}

function safeUser(user: {
  id: number;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}): {
  id: number;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
} {
  return {
    id: user.id,
    title: user.title,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  };
}
