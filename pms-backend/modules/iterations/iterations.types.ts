// Iteration Outcome Enum
export enum IterationOutcome {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

// Approval Status Enum
export enum ApprovalStatus {
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

// Ticket Iteration Interface
export interface TicketIteration {
    id: string;
    ticket_id: string;
    iteration_number: number;
    outcome: IterationOutcome;
    created_at: Date;
}

// Approval Interface
export interface Approval {
    id: string;
    ticket_id: string;
    approved_by: string;
    status: ApprovalStatus;
    approved_at: Date;
}

// FTR Metric Interface
export interface FTRMetric {
    id: string;
    ticket_id: string;
    first_time_right: boolean;
    score: number;
}

// DTOs
export interface CreateIterationDTO {
    ticket_id: string;
    iteration_number: number;
}

export interface ApproveTicketDTO {
    approved_by: string;
}

export interface RejectTicketDTO {
    approved_by: string;
    reason?: string;
}
