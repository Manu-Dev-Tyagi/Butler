import { BaseRepository } from '@database/base.repository';
import { FileAttachment } from './files.types';

export class FilesRepository extends BaseRepository<FileAttachment> {
    constructor() {
        super('file_attachments');
    }

    /**
     * Upload file metadata
     */
    async uploadFile(
        ticketId: string,
        fileUrl: string,
        uploadedBy: string,
        iterationId?: string,
        fileType?: string
    ): Promise<FileAttachment> {
        const result = await this.execute(
            `INSERT INTO file_attachments (ticket_id, iteration_id, file_url, file_type, uploaded_by)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [ticketId, iterationId || null, fileUrl, fileType || null, uploadedBy]
        );
        return result.rows[0];
    }

    /**
     * Get all files for a ticket (with uploader details)
     */
    async findByTicket(ticketId: string): Promise<FileAttachment[]> {
        const result = await this.execute(
            `SELECT f.*, u.name as uploader_name, u.email as uploader_email
             FROM file_attachments f
             JOIN users u ON f.uploaded_by = u.id
             WHERE f.ticket_id = $1
             ORDER BY f.uploaded_at DESC`,
            [ticketId]
        );
        return result.rows;
    }

    /**
     * Get all files for a specific iteration
     */
    async findByIteration(iterationId: string): Promise<FileAttachment[]> {
        const result = await this.execute(
            `SELECT f.*, u.name as uploader_name, u.email as uploader_email
             FROM file_attachments f
             JOIN users u ON f.uploaded_by = u.id
             WHERE f.iteration_id = $1
             ORDER BY f.uploaded_at DESC`,
            [iterationId]
        );
        return result.rows;
    }

    /**
     * Get file count for a ticket
     */
    async countByTicket(ticketId: string): Promise<number> {
        const result = await this.execute(
            'SELECT COUNT(*) as count FROM file_attachments WHERE ticket_id = $1',
            [ticketId]
        );
        return parseInt(result.rows[0].count);
    }

    /**
     * Find file by ID
     */
    async findById(id: string): Promise<FileAttachment | null> {
        const result = await this.execute(
            'SELECT * FROM file_attachments WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Delete file by ID
     */
    async delete(id: string): Promise<boolean> {
        const result = await this.execute(
            'DELETE FROM file_attachments WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rowCount > 0;
    }
}
