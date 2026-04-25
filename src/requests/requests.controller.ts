import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import Joi from 'joi';
import { validateRequest } from '../_middleware/validateRequest';
import { authorizeRole, type AuthenticatedRequest } from '../_middleware/auth.middleware';
import { Role } from '../_helpers/role';
import { requestService } from './request.service';

const router = Router();

router.get('/', getAllForCurrentUser);
router.post('/', createSchema, create);
router.put('/:id/status', authorizeRole(Role.Admin), statusSchema, setStatus);

export default router;

function getAllForCurrentUser(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;
  const user = authReq.user;

  if (!user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const getRequests = user.role === Role.Admin
    ? requestService.getAll()
    : requestService.getForUser(user.id);

  getRequests
    .then((requests) => res.json(requests))
    .catch(next);
}

function createSchema(req: Request, res: Response, next: NextFunction): void {
  const schema = Joi.object({
    type: Joi.string().required(),
    items: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        qty: Joi.number().integer().min(1).required(),
      })
    ).min(1).required(),
  });

  validateRequest(req, next, schema);
}

function create(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;
  const user = authReq.user;

  if (!user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  requestService.create({
    userId: user.id,
    employeeEmail: user.email,
    type: req.body.type,
    items: req.body.items,
    status: 'Pending',
    date: new Date().toISOString().split('T')[0],
  })
    .then(() => res.json({ message: 'Request submitted' }))
    .catch(next);
}

function statusSchema(req: Request, res: Response, next: NextFunction): void {
  const schema = Joi.object({
    status: Joi.string().valid('Approved', 'Rejected').required(),
  });

  validateRequest(req, next, schema);
}

function setStatus(req: Request, res: Response, next: NextFunction): void {
  requestService.setStatus(Number(req.params.id), req.body.status)
    .then(() => res.json({ message: 'Request status updated' }))
    .catch(next);
}
