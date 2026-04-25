import { db } from '../_helpers/db';
import { RequestRecord, RequestCreationAttributes } from './request.model';

export const requestService = {
  getAll,
  getForUser,
  create,
  setStatus,
};

async function getAll(): Promise<RequestRecord[]> {
  return await db.Request.findAll({ order: [['createdAt', 'DESC']] });
}

async function getForUser(userId: number): Promise<RequestRecord[]> {
  return await db.Request.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
}

async function create(params: RequestCreationAttributes): Promise<void> {
  await db.Request.create(params);
}

async function setStatus(id: number, status: 'Approved' | 'Rejected'): Promise<void> {
  const record = await db.Request.findByPk(id);
  if (!record) {
    throw new Error('Request not found');
  }

  await record.update({ status });
}
