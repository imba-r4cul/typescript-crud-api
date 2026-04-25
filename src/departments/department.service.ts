import { db } from '../_helpers/db';
import { Department, DepartmentCreationAttributes } from './department.model';

export const departmentService = {
  getAll,
  getById,
  create,
  update,
  delete: _delete,
};

async function getAll(): Promise<Department[]> {
  return await db.Department.findAll({ order: [['name', 'ASC']] });
}

async function getById(id: number): Promise<Department> {
  return await getDepartment(id);
}

async function create(params: DepartmentCreationAttributes): Promise<void> {
  const existing = await db.Department.findOne({ where: { name: params.name } });
  if (existing) {
    throw new Error(`Department "${params.name}" already exists`);
  }

  await db.Department.create(params);
}

async function update(id: number, params: Partial<DepartmentCreationAttributes>): Promise<void> {
  const department = await getDepartment(id);

  if (params.name && params.name !== department.name) {
    const existing = await db.Department.findOne({ where: { name: params.name } });
    if (existing) {
      throw new Error(`Department "${params.name}" already exists`);
    }
  }

  await department.update(params);
}

async function _delete(id: number): Promise<void> {
  const department = await getDepartment(id);
  await department.destroy();
}

async function getDepartment(id: number): Promise<Department> {
  const department = await db.Department.findByPk(id);
  if (!department) {
    throw new Error('Department not found');
  }

  return department;
}
