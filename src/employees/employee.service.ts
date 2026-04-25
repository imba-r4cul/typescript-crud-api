import { db } from '../_helpers/db';
import { Employee, EmployeeCreationAttributes } from './employee.model';

export const employeeService = {
  getAll,
  getById,
  create,
  update,
  delete: _delete,
};

async function getAll(): Promise<Employee[]> {
  return await db.Employee.findAll({ order: [['createdAt', 'DESC']] });
}

async function getById(id: number): Promise<Employee> {
  return await getEmployee(id);
}

async function create(params: EmployeeCreationAttributes): Promise<void> {
  const existing = await db.Employee.findOne({ where: { employeeId: params.employeeId } });
  if (existing) {
    throw new Error(`Employee ID "${params.employeeId}" already exists`);
  }

  await db.Employee.create(params);
}

async function update(id: number, params: Partial<EmployeeCreationAttributes>): Promise<void> {
  const employee = await getEmployee(id);

  if (params.employeeId && params.employeeId !== employee.employeeId) {
    const existing = await db.Employee.findOne({ where: { employeeId: params.employeeId } });
    if (existing) {
      throw new Error(`Employee ID "${params.employeeId}" already exists`);
    }
  }

  await employee.update(params);
}

async function _delete(id: number): Promise<void> {
  const employee = await getEmployee(id);
  await employee.destroy();
}

async function getEmployee(id: number): Promise<Employee> {
  const employee = await db.Employee.findByPk(id);
  if (!employee) {
    throw new Error('Employee not found');
  }

  return employee;
}
