import { SprintsRepository, Sprint } from './sprints.repository';

export class SprintsService {
    private readonly repository: SprintsRepository;

    constructor() {
        this.repository = new SprintsRepository();
    }

    async createSprint(data: {
        name: string;
        start_date: string | Date;
        end_date: string | Date;
    }): Promise<Sprint> {
        // Validation
        if (!data.name || data.name.trim() === '') {
            throw new Error('Sprint name is required');
        }

        if (!data.start_date || !data.end_date) {
            throw new Error('start_date and end_date are required');
        }

        // Convert strings to Date objects
        const start_date = new Date(data.start_date);
        const end_date = new Date(data.end_date);

        // Validate dates
        if (isNaN(start_date.getTime()) || isNaN(end_date.getTime())) {
            throw new Error('Invalid date format');
        }

        if (end_date <= start_date) {
            throw new Error('end_date must be after start_date');
        }

        // Check for duplicate name
        const existing = await this.repository.findByName(data.name);
        if (existing) {
            throw new Error('Sprint with this name already exists');
        }

        return this.repository.create({
            name: data.name,
            start_date,
            end_date,
        });
    }

    async findAll(): Promise<Sprint[]> {
        return this.repository.findAllOrdered();
    }

    async findById(id: string): Promise<Sprint | null> {
        return this.repository.findById(id);
    }
}
