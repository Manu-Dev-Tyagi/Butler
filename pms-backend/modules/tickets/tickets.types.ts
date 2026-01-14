// Ticket Status Enum (State Machine)
export enum TicketStatus {
    CREATED = 'CREATED',
    ASSIGNED = 'ASSIGNED',
    IN_PROGRESS = 'IN_PROGRESS',
    SUBMITTED = 'SUBMITTED',
    APPROVED = 'APPROVED',
    REVISION_REQUIRED = 'REVISION_REQUIRED',
    REASSIGNED = 'REASSIGNED',
    DELIVERED = 'DELIVERED',
    CLOSED = 'CLOSED',
    CANCELLED = 'CANCELLED',
}

// Ticket Priority Enum
export enum TicketPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

// Ticket Assignment Status
export enum AssignmentStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

// Ticket Interface
export interface Ticket {
    id: string;
    project_id: string;
    sprint_id: string | null;
    title: string;
    description: string | null;
    priority: TicketPriority;
    delivery_datetime: Date | null;
    delivery_slot: string | null;
    ad_name: string | null;
    creative_count: number | null;
    status: TicketStatus;
    created_at: Date;
}

// Ticket Assignment Interface
export interface TicketAssignment {
    id: string;
    ticket_id: string;
    user_id: string;
    assigned_at: Date;
    unassigned_at: Date | null;
    assignment_status: AssignmentStatus;
}

// Create Ticket DTO
export interface CreateTicketDTO {
    project_id: string;
    sprint_id?: string;
    title: string;
    description?: string;
    priority: TicketPriority;
    delivery_datetime?: Date | string;
    delivery_slot?: string;
    ad_name?: string;
    creative_count?: number;
}

// Update Ticket DTO
export interface UpdateTicketDTO {
    title?: string;
    description?: string;
    priority?: TicketPriority;
    delivery_datetime?: Date | string;
    delivery_slot?: string;
    ad_name?: string;
    creative_count?: number;
    sprint_id?: string;
    status?: TicketStatus;
}

// Assign Ticket DTO
export interface AssignTicketDTO {
    user_id: string;
}
