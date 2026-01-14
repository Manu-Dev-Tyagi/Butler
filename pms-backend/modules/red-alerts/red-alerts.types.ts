// Red Alert Types and Enums

export enum AlertReason {
    EXCESSIVE_ITERATIONS = 'EXCESSIVE_ITERATIONS', // > 2 iterations
    SLA_BREACH = 'SLA_BREACH', // Delivery date crossed
    IDLE_TICKET = 'IDLE_TICKET', // No updates for too long
}

export interface RedAlert {
    id: string;
    ticket_id: string;
    reason: AlertReason;
    triggered_at: Date;
}

export interface RedAlertWithDetails extends RedAlert {
    ticket_title: string;
    ticket_status: string;
    ticket_priority: string;
    project_id: string;
    project_name: string;
    assigned_to?: string;
    assignee_name?: string;
    assignee_email?: string;
    iteration_count?: number;
    delivery_datetime?: Date;
    last_updated?: Date;
}

export interface CreateRedAlertDTO {
    ticket_id: string;
    reason: AlertReason;
}

export interface AlertFilters {
    reason?: AlertReason;
    project_id?: string;
    ticket_id?: string;
    from_date?: Date;
    to_date?: Date;
}

export interface AlertStatistics {
    total_alerts: number;
    active_alerts: number;
    by_reason: {
        excessive_iterations: number;
        sla_breach: number;
        idle_ticket: number;
    };
    by_project: {
        project_id: string;
        project_name: string;
        alert_count: number;
    }[];
}
