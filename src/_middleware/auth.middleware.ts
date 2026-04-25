import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import config from '../../config.json';
import { Role } from '../_helpers/role';

export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    if (
      typeof decoded === 'string' ||
      typeof decoded.sub !== 'number' ||
      typeof decoded.email !== 'string' ||
      typeof decoded.role !== 'string'
    ) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    (req as AuthenticatedRequest).user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function authorizeRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(authReq.user.role as Role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }

    return next();
  };
}
