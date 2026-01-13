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
        const columns = Object.keys(client).join(', ');
        const values = Object.values(client);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const result = await this.execute(
            `INSERT INTO clients (${columns}) VALUES (${placeholders}) RETURNING *`,
            values
        );
        return result.rows[0];
    }

    async findByName(name: string): Promise<Client | null> {
        const result = await this.execute('SELECT * FROM clients WHERE name = $1', [name]);
        return result.rows[0] || null;
    }
}
