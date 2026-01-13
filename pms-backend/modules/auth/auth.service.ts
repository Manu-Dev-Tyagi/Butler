import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { query } from '@database/connection';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export class AuthService {
    async validateUser(email: string, pass: string) {
        const res = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (res.rows.length === 0) return null;

        const user = res.rows[0];
        if (!user.password_hash) return null;

        const match = await bcrypt.compare(pass, user.password_hash);
        if (!match) return null;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password_hash, ...result } = user;
        return result;
    }

    async login(user: any) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        return {
            access_token: jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' }),
            user,
        };
    }
}
