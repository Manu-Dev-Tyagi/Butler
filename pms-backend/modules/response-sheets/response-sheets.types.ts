// ==================== SNAPSHOT DATA STRUCTURE ====================

export interface ResponseSheetSnapshot {
    project: {
        id: string;
        name: string;
        status: string;
        created_at: Date;
    };
    client: {
        id: string;
        name: string;
    };
    pocs: Array<{
        name: string;
        email: string | null;
        phone: string | null;
    }>;
    team_members: Array<{
        user_id: string;
        name: string;
        email: string;
        role: string;
        assigned_from: Date;
    }>;
    tickets: Array<{
        id: string;
        title: string;
        description: string | null;
        priority: string;
        status: string;
        delivery_datetime: Date | null;
        created_at: Date;
        assigned_to: string | null;
        assignee_name: string | null;
        iteration_count: number;
        first_time_right: boolean | null;
        resolution_hours: number | null;
    }>;
    summary: {
        total_tickets: number;
        completed_tickets: number;
        in_progress_tickets: number;
        pending_tickets: number;
        ftr_percentage: number;
        avg_resolution_hours: number;
        total_iterations: number;
        avg_iterations_per_ticket: number;
    };
    generated_at: Date;
}

// ==================== DATABASE MODEL ====================

export interface ResponseSheet {
    id: string;
    project_id: string;
    snapshot_data: ResponseSheetSnapshot;
    generated_at: Date;
    sent_at: Date | null;
    sent_to: string[] | null;
    avg_resolution_time: number | null;
}

// ==================== DTOs ====================

export interface CreateResponseSheetDTO {
    project_id: string;
}

export interface SendResponseSheetDTO {
    sheet_id: string;
    recipients: string[];
    subject?: string;
    message?: string;
}

export interface ResponseSheetListItem {
    id: string;
    project_id: string;
    project_name: string;
    generated_at: Date;
    sent_at: Date | null;
    sent_to: string[] | null;
    total_tickets: number;
    completed_tickets: number;
    ftr_percentage: number;
}
