import * as bcrypt from 'bcrypt';
import { UsersRepository, User } from './users.repository';

export class UsersService {
    private readonly repository: UsersRepository;

    constructor() {
        this.repository = new UsersRepository();
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
        return this.repository.update(id, {
            employment_status: 'EXIT_INITIATED',
            exit_requested_at: new Date(),
        });
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
