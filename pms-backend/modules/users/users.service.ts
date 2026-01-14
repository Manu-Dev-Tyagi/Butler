import * as bcrypt from 'bcrypt';
import { UsersRepository, User } from './users.repository';
import { TicketsService } from '@modules/tickets/tickets.service';
import { pool } from '@database/connection';
import { PoolClient } from 'pg';

export class UsersService {
    private readonly repository: UsersRepository;
    private readonly ticketsService: TicketsService;

    constructor() {
        this.repository = new UsersRepository();
        this.ticketsService = new TicketsService();
    }

    async createUser(data: any): Promise<User> {
        const { password, ...userData } = data;
        let password_hash = null;

        if (password) {
            password_hash = await bcrypt.hash(password, 10);
        }

        return this.repository.create({
            ...userData,
            password_hash,
            employment_status: 'ACTIVE',
            is_assignable: true,
        });
    }

    async findAll(): Promise<User[]> {
        return this.repository.findAll();
    }

    async findById(id: string): Promise<User | null> {
        return this.repository.findById(id);
    }

    async updateUser(id: string, data: Partial<User>): Promise<User | null> {
        // If updating password, hash it
        if (data.password_hash) {
            // Assume controller passes hashed or we handle plaintext 'password' prop here? 
            // Let's stick to handling plaintext 'password' if passed in 'data' by controller.
            // But types say Partial<User> which has password_hash. 
            // We will handle specific 'password' field in controller or here.
            // For safety, let's assume this method receives direct DB fields.
        }
        return this.repository.update(id, data);
    }

    async updateProfile(id: string, data: any): Promise<User | null> {
        const { password, ...updateData } = data;
        if (password) {
            updateData.password_hash = await bcrypt.hash(password, 10);
        }
        return this.repository.update(id, updateData);
    }

    async initiateExit(id: string): Promise<User | null> {
        const client: PoolClient = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Update user employment status
            const userResult = await client.query(
                `UPDATE users
                 SET employment_status = $1, exit_requested_at = $2
                 WHERE id = $3
                 RETURNING *`,
                ['EXIT_INITIATED', new Date(), id]
            );

            if (userResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return null;
            }

            // 2. Get all active tickets assigned to this user
            const activeTicketsResult = await client.query(
                `SELECT t.id FROM tickets t
                 INNER JOIN ticket_assignments ta ON t.id = ta.ticket_id
                 WHERE ta.user_id = $1
                 AND ta.assignment_status = 'ACTIVE'
                 AND t.status NOT IN ('DELIVERED', 'CLOSED', 'CANCELLED')`,
                [id]
            );

            // 3. Unassign all active tickets (moves them to REASSIGNED status)
            for (const row of activeTicketsResult.rows) {
                const ticketId = row.id;

                // Deactivate assignment
                await client.query(
                    `UPDATE ticket_assignments
                     SET assignment_status = 'INACTIVE', unassigned_at = $1
                     WHERE ticket_id = $2 AND assignment_status = 'ACTIVE'`,
                    [new Date(), ticketId]
                );

                // Set ticket status to REASSIGNED
                await client.query(
                    `UPDATE tickets
                     SET status = $1
                     WHERE id = $2`,
                    ['REASSIGNED', ticketId]
                );
            }

            await client.query('COMMIT');
            client.release();

            console.log(`[EXIT] User ${id} exit initiated. ${activeTicketsResult.rows.length} ticket(s) reassigned.`);

            return userResult.rows[0];
        } catch (error) {
            if (client) {
                await client.query('ROLLBACK');
                client.release();
            }
            throw error;
        }
    }

    async getExits(): Promise<User[]> {
        return this.repository.findByStatus('EXIT_INITIATED');
    }

    async offboardUser(id: string): Promise<User | null> {
        const hasTickets = await this.repository.hasActiveTickets(id);
        if (hasTickets) {
            throw new Error('Cannot offboard user: Active tickets assigned. Please reassign tickets first.');
        }

        return this.repository.update(id, {
            employment_status: 'OFFBOARDED',
            is_assignable: false,
            exit_effective_at: new Date(),
        });
    }
}
