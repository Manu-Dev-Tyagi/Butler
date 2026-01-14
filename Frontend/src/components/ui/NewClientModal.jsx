import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';
import { X, Save, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { checkApiHealth } from '../../utils/apiHealthCheck';

export function NewClientModal({ isOpen, onClose, onClientCreated }) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [apiStatus, setApiStatus] = useState(null);

    useEffect(() => {
        if (isOpen) {
            // Check API health when modal opens
            checkApiHealth().then(setApiStatus);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!name.trim()) {
            alert('Please enter a client name');
            return;
        }

        setLoading(true);
        try {
            const newClient = await api.clients.create(name.trim());
            
            if (!newClient || !newClient.id) {
                throw new Error('Invalid response from server');
            }
            
            // Call the callback to update parent state
            if (onClientCreated) {
                onClientCreated(newClient);
            }
            
            setName('');
            onClose();
        } catch (err) {
            console.error('Error creating client:', err);
            
            let errorMessage = 'Failed to create client. Please try again.';
            
            // Network error (server not reachable)
            if (!err.response) {
                errorMessage = `Cannot connect to backend server.\n\n` +
                    `Please ensure:\n` +
                    `1. Backend server is running (npm run dev:api)\n` +
                    `2. Server is running on ${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}\n` +
                    `3. Check browser console for details`;
            } 
            // Backend error response
            else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            }
            // Axios error with message
            else if (err.message) {
                errorMessage = err.message;
            }
            // User-friendly message if available
            else if (err.userMessage) {
                errorMessage = err.userMessage;
            }
            
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem'
        }}>
            <Card style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative' }} className="animate-scaleIn">
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                >
                    <X size={20} />
                </button>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Add New Client</h2>

                {apiStatus && !apiStatus.isHealthy && (
                    <div style={{
                        padding: '0.75rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'start',
                        gap: '0.75rem'
                    }}>
                        <AlertCircle size={18} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-danger)', marginBottom: '0.25rem' }}>
                                Backend Server Not Reachable
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                {apiStatus.message}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                URL: {apiStatus.url}
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                    <Input
                        label="Client Name"
                        placeholder="e.g. Acme Corp"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" isLoading={loading}>
                            <Save size={18} /> Save Client
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
