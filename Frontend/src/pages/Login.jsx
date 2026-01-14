import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import '../styles/animations.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!email || !password) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }

        const result = await login(email, password);

        if (result.success) {
            // Redirect based on role
            if (result.role === 'ADMIN') {
                navigate('/dashboard/admin');
            } else if (result.role === 'PM') {
                navigate('/dashboard/pm');
            } else {
                navigate('/dashboard/employee');
            }
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '2rem' }}>
            <div className="animate-slideUp" style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div className="flex-center" style={{
                        width: '64px', height: '64px',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                        borderRadius: '16px', margin: '0 auto 1rem', boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
                    }}>
                        <ShieldCheck size={32} color="#fff" />
                    </div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome Back</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Enterprise Project Management System</p>
                </div>

                <Card style={{ padding: '2rem' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {error && (
                            <div style={{
                                padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: 'var(--color-danger)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}>
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />

                        <Button type="submit" isLoading={loading} style={{ width: '100%' }}>
                            Sign In to Dashboard
                        </Button>

                        <div style={{
                            textAlign: 'center', marginTop: '1rem', paddingTop: '1rem',
                            borderTop: '1px solid var(--color-border)', fontSize: '0.875rem'
                        }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Don't have an account? </span>
                            <Link to="/signup" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>Sign Up</Link>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
