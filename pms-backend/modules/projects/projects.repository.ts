import { BaseRepository } from '@database/base.repository';
import { Pool, PoolClient } from 'pg';
import { pool } from '@database/connection';
import { Project, ProjectPOC, ProjectMember } from './projects.types';

export class ProjectsRepository extends BaseRepository<Project> {
    async findAll(): Promise<Project[]> {
        const result = await this.execute(
            `SELECT p.*, c.name as client_name 
             FROM projects p 
             LEFT JOIN clients c ON p.client_id = c.id
             ORDER BY p.created_at DESC`
        );

        const projects = result.rows;
        for (const project of projects) {
            const [pocs, members] = await Promise.all([
                this.findPOCsByProject(project.id),
                this.findMembersByProject(project.id)
            ]);
            project.pocs = pocs;
            project.members = members.map((m: any) => m.user_id);
        }

        return projects;
    }

    async findById(id: string): Promise<Project | null> {
        const result = await this.execute(
            `SELECT p.*, c.name as client_name 
             FROM projects p 
             LEFT JOIN clients c ON p.client_id = c.id 
             WHERE p.id = $1`,
            [id]
        );
        const project = result.rows[0] || null;
        if (project) {
            const [pocs, members] = await Promise.all([
                this.findPOCsByProject(id),
                this.findMembersByProject(id)
            ]);
            project.pocs = pocs;
            project.members = members.map((m: any) => m.user_id);
        }
        return project;
    }

    constructor() {
        super('projects');
    }

    /**
     * Transactional Project Creation
     * Creates a project along with POCs and Members atomically
     */
    async createWithRelations(
        projectData: { client_id: string; name: string; status?: string },
        pocs: Array<{ name: string; email?: string; phone?: string }> = [],
        memberIds: string[] = []
    ): Promise<{ project: Project; pocs: ProjectPOC[]; members: ProjectMember[] }> {
        const client: PoolClient = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Insert Project
            const projectResult = await client.query(
                `INSERT INTO projects (client_id, name, status)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [projectData.client_id, projectData.name, projectData.status || 'ACTIVE']
            );
            const project: Project = projectResult.rows[0];

            // 2. Insert POCs
            const createdPOCs: ProjectPOC[] = [];
            for (const poc of pocs) {
                const pocResult = await client.query(
                    `INSERT INTO project_pocs (project_id, name, email, phone)
                     VALUES ($1, $2, $3, $4)
                     RETURNING *`,
                    [project.id, poc.name, poc.email || null, poc.phone || null]
                );
                createdPOCs.push(pocResult.rows[0]);
            }

            // 3. Insert Project Members
            const createdMembers: ProjectMember[] = [];
            for (const userId of memberIds) {
                const memberResult = await client.query(
                    `INSERT INTO project_members (project_id, user_id, is_current)
                     VALUES ($1, $2, TRUE)
                     RETURNING *`,
                    [project.id, userId]
                );
                createdMembers.push(memberResult.rows[0]);
            }

            await client.query('COMMIT');

            return { project, pocs: createdPOCs, members: createdMembers };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async update(id: string, data: Partial<Project>): Promise<Project | null> {
        const columns = Object.keys(data);
        if (columns.length === 0) return this.findById(id);

        const setClause = columns.map((col, i) => `${col} = $${i + 2}`).join(', ');
        const values = Object.values(data);

        const result = await this.execute(
            `UPDATE projects SET ${setClause} WHERE id = $1 RETURNING *`,
            [id, ...values]
        );
        return result.rows[0] || null;
    }

    // ======================== POC METHODS ========================

    async addPOC(projectId: string, poc: { name: string; email?: string; phone?: string }): Promise<ProjectPOC> {
        const result = await this.execute(
            `INSERT INTO project_pocs (project_id, name, email, phone)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [projectId, poc.name, poc.email || null, poc.phone || null]
        );
        return result.rows[0];
    }

    async findPOCsByProject(projectId: string): Promise<ProjectPOC[]> {
        const result = await this.execute(
            `SELECT * FROM project_pocs WHERE project_id = $1 ORDER BY name`,
            [projectId]
        );
        return result.rows;
    }

    // ======================== MEMBER METHODS ========================

    async addMember(projectId: string, userId: string): Promise<ProjectMember> {
        const result = await this.execute(
            `INSERT INTO project_members (project_id, user_id, is_current)
             VALUES ($1, $2, TRUE)
             RETURNING *`,
            [projectId, userId]
        );
        return result.rows[0];
    }

    async findMembersByProject(projectId: string, currentOnly: boolean = true): Promise<ProjectMember[]> {
        const query = currentOnly
            ? `SELECT pm.*, u.name as user_name, u.email as user_email
               FROM project_members pm
               JOIN users u ON pm.user_id = u.id
               WHERE pm.project_id = $1 AND pm.is_current = TRUE`
            : `SELECT pm.*, u.name as user_name, u.email as user_email
               FROM project_members pm
               JOIN users u ON pm.user_id = u.id
               WHERE pm.project_id = $1`;

        const result = await this.execute(query, [projectId]);
        return result.rows;
    }

    async removeMember(projectId: string, userId: string): Promise<boolean> {
        const result = await this.execute(
            `UPDATE project_members
             SET is_current = FALSE, assigned_to = CURRENT_TIMESTAMP
             WHERE project_id = $1 AND user_id = $2 AND is_current = TRUE
             RETURNING *`,
            [projectId, userId]
        );
        return result.rows.length > 0;
    }

    async isMemberAssigned(projectId: string, userId: string): Promise<boolean> {
        const result = await this.execute(
            `SELECT COUNT(*) as count FROM project_members
             WHERE project_id = $1 AND user_id = $2 AND is_current = TRUE`,
            [projectId, userId]
        );
        return parseInt(result.rows[0].count) > 0;
    }
}
