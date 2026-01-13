// Comment Interface
export interface Comment {
    id: string;
    ticket_id: string;
    user_id: string;
    content: string;
    created_at: Date;
}

// DTOs
export interface CreateCommentDTO {
    ticket_id: string;
    user_id: string;
    content: string;
}
