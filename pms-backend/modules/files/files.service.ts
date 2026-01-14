import { FilesRepository } from './files.repository';
import { TicketsRepository } from '@modules/tickets/tickets.repository';
import { FileAttachment, UploadFileDTO } from './files.types';

export class FilesService {
    private readonly filesRepo: FilesRepository;
    private readonly ticketsRepo: TicketsRepository;

    constructor() {
        this.filesRepo = new FilesRepository();
        this.ticketsRepo = new TicketsRepository();
    }

    /**
     * Upload file metadata
     * Business Rule: Files always linked to iteration (per to-do.md)
     */
    async uploadFile(data: UploadFileDTO): Promise<FileAttachment> {
        // Verify ticket exists
        const ticket = await this.ticketsRepo.findById(data.ticket_id);
        if (!ticket) {
            throw new Error('Ticket not found');
        }

        // Verify iteration exists if provided (REQUIRED per to-do.md: "Files always linked to iteration")
        if (!data.iteration_id) {
            throw new Error('iteration_id is required - files must be linked to an iteration');
        }

        return this.filesRepo.uploadFile(
            data.ticket_id,
            data.file_url,
            data.uploaded_by,
            data.iteration_id,
            data.file_type
        );
    }

    /**
     * Get all files for a ticket
     */
    async getFilesByTicket(ticketId: string): Promise<FileAttachment[]> {
        // Verify ticket exists
        const ticket = await this.ticketsRepo.findById(ticketId);
        if (!ticket) {
            throw new Error('Ticket not found');
        }

        return this.filesRepo.findByTicket(ticketId);
    }

    /**
     * Get files for a specific iteration
     */
    async getFilesByIteration(iterationId: string): Promise<FileAttachment[]> {
        return this.filesRepo.findByIteration(iterationId);
    }

    /**
     * Get file count for a ticket
     */
    async getFileCount(ticketId: string): Promise<number> {
        return this.filesRepo.countByTicket(ticketId);
    }

    /**
     * Delete a file
     */
    async deleteFile(fileId: string): Promise<boolean> {
        const file = await this.filesRepo.findById(fileId);
        if (!file) {
            throw new Error('File not found');
        }
        return this.filesRepo.delete(fileId);
    }
}
