// File Attachment Interface
export interface FileAttachment {
    id: string;
    ticket_id: string;
    iteration_id: string | null;
    file_url: string;
    file_type: string | null;
    uploaded_by: string;
    uploaded_at: Date;
}

// DTOs
export interface UploadFileDTO {
    ticket_id: string;
    iteration_id?: string;
    file_url: string;
    file_type?: string;
    uploaded_by: string;
}
