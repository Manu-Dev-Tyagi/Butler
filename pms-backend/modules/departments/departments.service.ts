import { DepartmentsRepository, Department, SubDepartment } from './departments.repository';

export class DepartmentsService {
    private readonly repository: DepartmentsRepository;

    constructor() {
        this.repository = new DepartmentsRepository();
    }

    async createDepartment(name: string): Promise<Department> {
        return this.repository.createDepartment(name);
    }

    async createSubDepartment(departmentId: string, name: string): Promise<SubDepartment> {
        // Validate department exists
        const dept = await this.repository.findById(departmentId);
        if (!dept) {
            throw new Error('Department not found');
        }
        return this.repository.createSubDepartment(departmentId, name);
    }

    async getAllDepartments(): Promise<Department[]> {
        return this.repository.findAllDepartments();
    }

    async getAllSubDepartments(): Promise<SubDepartment[]> {
        return this.repository.findAllSubDepartments();
    }
}
