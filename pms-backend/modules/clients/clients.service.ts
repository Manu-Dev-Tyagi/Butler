import { ClientsRepository, Client } from './clients.repository';

export class ClientsService {
    private readonly repository: ClientsRepository;

    constructor() {
        this.repository = new ClientsRepository();
    }

    async createClient(data: { name: string }): Promise<Client> {
        // Check if client with same name already exists
        const existing = await this.repository.findByName(data.name);
        if (existing) {
            throw new Error('Client with this name already exists');
        }

        return this.repository.create({ name: data.name });
    }

    async findAll(): Promise<Client[]> {
        return this.repository.findAll();
    }

    async findById(id: string): Promise<Client | null> {
        return this.repository.findById(id);
    }
}
