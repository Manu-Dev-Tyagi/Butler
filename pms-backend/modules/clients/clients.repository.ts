import { BaseRepository } from '@database/base.repository';

export interface Client {
    id: string;
    name: string;
}

export class ClientsRepository extends BaseRepository<Client> {
    constructor() {
        super('clients');
    }

    async create(client: Partial<Client>): Promise<Client> {
        if (!client.name || client.name.trim() === '') {
            throw new Error('Client name is required');
        }

        const result = await this.execute(
            `INSERT INTO clients (name) VALUES ($1) RETURNING *`,
            [client.name.trim()]
        );
        
        if (!result.rows || result.rows.length === 0) {
            throw new Error('Failed to create client - no data returned');
        }
        
        return result.rows[0];
    }

    async findByName(name: string): Promise<Client | null> {
        const result = await this.execute('SELECT * FROM clients WHERE name = $1', [name]);
        return result.rows[0] || null;
    }
}
