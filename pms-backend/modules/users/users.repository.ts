import { BaseRepository } from '@database/base.repository';
import { PoolClient } from 'pg';

export interface User {
    id: string;
    name: string;
    email: string;
    password_hash?: string;
    role: 'ADMIN' | 'PM' | 'EMPLOYEE';
    employment_status: 'ACTIVE' | 'EXIT_INITIATED' | 'OFFBOARDED';
    is_assignable: boolean;
    exit_requested_at?: Date;
    exit_effective_at?: Date;
    created_at: Date;
}

export class UsersRepository extends BaseRepository<User> {
    constructor() {
        super('users');
    }

    async create(user: Partial<User>): Promise<User> {
        const columns = Object.keys(user).join(', ');
        const values = Object.values(user);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const result = await this.execute(
            `INSERT INTO users (${columns}) VALUES (${placeholders}) RETURNING *`,
            values
        );
        return result.rows[0];
    }

    async findByEmail(email: string): Promise<User | null> {
        const result = await this.execute('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
    }

    async update(id: string, data: Partial<User>): Promise<User | null> {
        const columns = Object.keys(data);
        if (columns.length === 0) return this.findById(id);

        const setClause = columns.map((col, i) => `${col} = $${i + 2}`).join(', ');
        const values = Object.values(data);

        const result = await this.execute(
            `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`,
            [id, ...values]
        );
        return result.rows[0] || null;
    }

    async findByStatus(status: string): Promise<User[]> {
        const result = await this.execute('SELECT * FROM users WHERE employment_status = $1', [status]);
        return result.rows;
    }

    /**
     * Checks if the user has any active tickets assigned.
     * Looks at ticket_assignments where unassigned_at is NULL.
     */
    async hasActiveTickets(userId: string): Promise<boolean> {
        const result = await this.execute(
            `SELECT COUNT(*) as count FROM ticket_assignments 
             WHERE user_id = $1 AND unassigned_at IS NULL AND assignment_status = 'ACTIVE'`,
            [userId]
        );
        return parseInt(result.rows[0].count) > 0;
    }
}
