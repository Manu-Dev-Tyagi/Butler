import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LeavePortal() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    const activeTicketsCount = 3; // Mocked check

    const handleExit = async () => {
        setLoading(true);
        try {
            await api.users.initiateExit(user.id);
            alert('Exit process initiated. HR and your Manager have been notified.');
            navigate('/dashboard/employee');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fadeIn" style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '2rem' }}>
            <button
                onClick={() => navigate(-1)}
                style={{
                    background: 'none', border: 'none', color: 'var(--color-text-muted)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer'
                }}
            >
                <ArrowLeft size={18} /> Back
            </button>

            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '2rem' }}>Employee Portal</h1>

            <Card style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                    Resignation / Exit Process
                </h3>

                {step === 1 && (
                    <div>
                        <p style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
                            We're sorry to see you go. Starting this process will notify your manager and HR.
                            <br /><br />
                            Please review your active responsibilities before proceeding.
                        </p>

                        <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                            <AlertTriangle size={24} color="var(--color-warning)" />
                            <div>
                                <h4 style={{ fontWeight: 600, color: 'var(--color-warning)', marginBottom: '0.25rem' }}>Active Dependencies</h4>
                                <p style={{ fontSize: '0.875rem' }}>You currently have <strong>{activeTicketsCount} active tickets</strong> assigned to you. These must be reassigned or closed before your final date.</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button onClick={() => setStep(2)}>Continue to Exit</Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-slideUp">
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Reason (Optional)</label>
                            <select style={{ width: '100%', padding: '0.75rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', borderRadius: 'var(--radius-md)' }}>
                                <option>Better Opportunity</option>
                                <option>Higher Studies</option>
                                <option>Personal Reasons</option>
                                <option>Relocation</option>
                            </select>
                        </div>

                        <p style={{ padding: '1rem', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                            By clicking "Confirm Resignation", you acknowledge that your exit process will begin immediately. Your access level may change during the notice period.
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Button variant="ghost" onClick={() => setStep(1)}>Cancel</Button>
                            <Button variant="danger" isLoading={loading} onClick={handleExit}>Confirm Resignation</Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
