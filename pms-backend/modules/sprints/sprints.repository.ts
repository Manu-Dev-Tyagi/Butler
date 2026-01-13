import { BaseRepository } from '@database/base.repository';

export interface Sprint {
    id: string;
    name: string;
    start_date: Date;
    end_date: Date;
}

export class SprintsRepository extends BaseRepository<Sprint> {
    constructor() {
        super('sprints');
    }

    async create(sprint: { name: string; start_date: Date; end_date: Date }): Promise<Sprint> {
        const result = await this.execute(
            `INSERT INTO sprints (name, start_date, end_date)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [sprint.name, sprint.start_date, sprint.end_date]
        );
        return result.rows[0];
    }

    async findByName(name: string): Promise<Sprint | null> {
        const result = await this.execute('SELECT * FROM sprints WHERE name = $1', [name]);
        return result.rows[0] || null;
    }

    async findAllOrdered(): Promise<Sprint[]> {
        const result = await this.execute(
            'SELECT * FROM sprints ORDER BY start_date DESC',
            []
        );
        return result.rows;
    }
}
