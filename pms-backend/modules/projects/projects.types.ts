export interface Project {
    id: string;
    client_id: string;
    name: string;
    status: string;
    created_at: Date;
}

export interface ProjectPOC {
    id: string;
    project_id: string;
    name: string;
    email: string | null;
    phone: string | null;
}

export interface ProjectMember {
    id: string;
    project_id: string;
    user_id: string;
    assigned_from: Date;
    assigned_to: Date | null;
    is_current: boolean;
}

export interface CreateProjectDTO {
    client_id: string;
    name: string;
    pocs?: Array<{
        name: string;
        email?: string;
        phone?: string;
    }>;
    member_ids?: string[];
}
