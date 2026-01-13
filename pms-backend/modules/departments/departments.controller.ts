import { Router, Request, Response } from 'express';
import { DepartmentsService } from './departments.service';

const router = Router();
const service = new DepartmentsService();

// Create Department
router.post('/departments', async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) {
            res.status(400).json({ error: 'Name is required' });
            return;
        }
        const dept = await service.createDepartment(name);
        res.status(201).json(dept);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// List Departments
router.get('/departments', async (req: Request, res: Response) => {
    try {
        const depts = await service.getAllDepartments();
        res.json(depts);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create Sub-Department
router.post('/sub-departments', async (req: Request, res: Response) => {
    try {
        const { department_id, name } = req.body;
        if (!department_id || !name) {
            res.status(400).json({ error: 'department_id and name are required' });
            return;
        }
        const subDept = await service.createSubDepartment(department_id, name);
        res.status(201).json(subDept);
    } catch (error: any) {
        if (error.message === 'Department not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// List Sub-Departments
router.get('/sub-departments', async (req: Request, res: Response) => {
    try {
        const subDepts = await service.getAllSubDepartments();
        res.json(subDepts);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
