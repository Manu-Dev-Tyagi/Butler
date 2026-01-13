import { PoolClient, QueryResult } from 'pg';
import { query } from './connection';

export class BaseRepository<T> {
    constructor(private readonly tableName: string) { }

    protected async execute(text: string, params?: any[]): Promise<QueryResult> {
        return query(text, params);
    }

    async findAll(): Promise<T[]> {
        const result = await this.execute(`SELECT * FROM ${this.tableName}`);
        return result.rows;
    }

    async findById(id: string): Promise<T | null> {
        const result = await this.execute(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id]);
        return result.rows[0] || null;
    }

    // Basic health check for the repository connection
    static async healthCheck(): Promise<boolean> {
        try {
            await query('SELECT 1');
            return true;
        } catch {
            return false;
        }
    }
}
