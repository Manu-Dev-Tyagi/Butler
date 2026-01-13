import { ProjectsRepository } from './projects.repository';
import { Project, ProjectPOC, ProjectMember, CreateProjectDTO } from './projects.types';
import { ProjectEventPublisher } from '@events/publishers/project.publisher';

export class ProjectsService {
    private readonly repository: ProjectsRepository;
    private readonly eventPublisher: ProjectEventPublisher;

    constructor() {
        this.repository = new ProjectsRepository();
        this.eventPublisher = new ProjectEventPublisher();
    }

    /**
     * Transactional Project Creation
     * - Creates project, POCs, and members atomically
     * - Emits PROJECT_CREATED event for async Slack channel creation
     */
    async createProject(data: CreateProjectDTO): Promise<{
        project: Project;
        pocs: ProjectPOC[];
        members: ProjectMember[];
    }> {
        const { client_id, name, pocs = [], member_ids = [] } = data;

        // Validation
        if (!client_id || !name) {
            throw new Error('client_id and name are required');
        }

        // Transactional creation
        const result = await this.repository.createWithRelations(
            { client_id, name },
            pocs,
            member_ids
        );

        // Emit PROJECT_CREATED event (async Slack channel creation)
        this.eventPublisher.emitProjectCreated({
            project_id: result.project.id,
            project_name: result.project.name,
            client_id: result.project.client_id,
            pocs: result.pocs,
        });

        return result;
    }

    async findAll(): Promise<Project[]> {
        return this.repository.findAll();
    }

    async findById(id: string): Promise<Project | null> {
        return this.repository.findById(id);
    }

    async updateProject(id: string, data: Partial<Project>): Promise<Project | null> {
        return this.repository.update(id, data);
    }

    // ======================== POC OPERATIONS ========================

    async addPOC(
        projectId: string,
        pocData: { name: string; email?: string; phone?: string }
    ): Promise<ProjectPOC> {
        if (!pocData.name || pocData.name.trim() === '') {
            throw new Error('POC name is required');
        }

        return this.repository.addPOC(projectId, pocData);
    }

    async getPOCs(projectId: string): Promise<ProjectPOC[]> {
        return this.repository.findPOCsByProject(projectId);
    }

    // ======================== MEMBER OPERATIONS ========================

    async addMember(projectId: string, userId: string): Promise<ProjectMember> {
        // Check if already assigned
        const isAssigned = await this.repository.isMemberAssigned(projectId, userId);
        if (isAssigned) {
            throw new Error('User is already assigned to this project');
        }

        return this.repository.addMember(projectId, userId);
    }

    async getMembers(projectId: string): Promise<ProjectMember[]> {
        return this.repository.findMembersByProject(projectId, true);
    }

    async removeMember(projectId: string, userId: string): Promise<boolean> {
        const removed = await this.repository.removeMember(projectId, userId);
        if (!removed) {
            throw new Error('Member not found or already unassigned');
        }
        return true;
    }
}
