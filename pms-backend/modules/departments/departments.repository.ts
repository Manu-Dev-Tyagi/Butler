import { BaseRepository } from '@database/base.repository';

export interface Department {
    id: string;
    name: string;
}

export interface SubDepartment {
    id: string;
    department_id: string;
    name: string;
}

export class DepartmentsRepository extends BaseRepository<Department> {
    constructor() {
        super('departments');
    }

    async createDepartment(name: string): Promise<Department> {
        const result = await this.execute(
            'INSERT INTO departments (name) VALUES ($1) RETURNING *',
            [name]
        );
        return result.rows[0];
    }

    async createSubDepartment(departmentId: string, name: string): Promise<SubDepartment> {
        const result = await this.execute(
            'INSERT INTO sub_departments (department_id, name) VALUES ($1, $2) RETURNING *',
            [departmentId, name]
        );
        return result.rows[0];
    }

    async findAllDepartments(): Promise<Department[]> {
        return this.findAll();
    }

    async findAllSubDepartments(): Promise<SubDepartment[]> {
        const result = await this.execute('SELECT * FROM sub_departments');
        return result.rows;
    }

    async findSubDepartmentsByDeptId(deptId: string): Promise<SubDepartment[]> {
        const result = await this.execute(
            'SELECT * FROM sub_departments WHERE department_id = $1',
            [deptId]
        );
        return result.rows;
    }
}
