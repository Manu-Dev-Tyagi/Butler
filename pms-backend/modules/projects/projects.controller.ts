import { Router, Request, Response } from 'express';
import { ProjectsService } from './projects.service';

const router = Router();
const projectsService = new ProjectsService();

// ======================== PROJECT ROUTES ========================

// Create Project (with optional POCs and Members)
router.post('/projects', async (req: Request, res: Response) => {
    try {
        const { client_id, name, pocs, member_ids } = req.body;

        if (!client_id || !name) {
            res.status(400).json({ error: 'client_id and name are required' });
            return;
        }

        const result = await projectsService.createProject({
            client_id,
            name,
            pocs,
            member_ids,
        });

        res.status(201).json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// List All Projects
router.get('/projects', async (req: Request, res: Response) => {
    try {
        const projects = await projectsService.findAll();
        res.json(projects);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get Project by ID
router.get('/projects/:id', async (req: Request, res: Response) => {
    try {
        const project = await projectsService.findById(req.params.id as string);
        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        res.json(project);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update Project
router.patch('/projects/:id', async (req: Request, res: Response) => {
    try {
        const { name, status } = req.body;
        const updateData: any = {};

        if (name) updateData.name = name;
        if (status) updateData.status = status;

        const project = await projectsService.updateProject(req.params.id as string, updateData);
        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        res.json(project);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ======================== POC ROUTES ========================

// Add POC to Project
router.post('/projects/:id/pocs', async (req: Request, res: Response) => {
    try {
        const { name, email, phone } = req.body;

        if (!name || name.trim() === '') {
            res.status(400).json({ error: 'POC name is required' });
            return;
        }

        const poc = await projectsService.addPOC(req.params.id as string, { name, email, phone });
        res.status(201).json(poc);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get POCs for Project
router.get('/projects/:id/pocs', async (req: Request, res: Response) => {
    try {
        const pocs = await projectsService.getPOCs(req.params.id as string);
        res.json(pocs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ======================== MEMBER ROUTES ========================

// Add Member to Project
router.post('/projects/:id/members', async (req: Request, res: Response) => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            res.status(400).json({ error: 'user_id is required' });
            return;
        }

        const member = await projectsService.addMember(req.params.id as string, user_id);
        res.status(201).json(member);
    } catch (error: any) {
        if (error.message.includes('already assigned')) {
            res.status(409).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Get Members for Project
router.get('/projects/:id/members', async (req: Request, res: Response) => {
    try {
        const members = await projectsService.getMembers(req.params.id as string);
        res.json(members);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Remove Member from Project
router.delete('/projects/:id/members/:userId', async (req: Request, res: Response) => {
    try {
        await projectsService.removeMember(req.params.id as string, req.params.userId as string);
        res.status(204).send();
    } catch (error: any) {
        if (error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

export default router;
