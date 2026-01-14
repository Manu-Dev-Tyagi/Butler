import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Plus, Trash2, ArrowLeft, Save, PlusCircle } from 'lucide-react';
import { api } from '../services/api';
import { NewClientModal } from '../components/ui/NewClientModal';

export default function CreateProject() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        client_id: '',
        pocs: [{ name: '', email: '', phone: '' }]
    });
    const [clients, setClients] = useState([]);

    const fetchClients = async () => {
        try {
            const data = await api.clients.list();
            setClients(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch clients:', err);
            // Don't show alert on initial load, just log error
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleClientCreated = async (newClient) => {
        if (!newClient || !newClient.id) {
            console.error('Invalid client data received:', newClient);
            alert('Client created but failed to update the list. Please refresh the page.');
            return;
        }
        
        // Refresh clients list to ensure we have the latest data
        try {
            await fetchClients();
        } catch (err) {
            console.error('Failed to refresh clients list:', err);
        }
        
        // Auto-select the newly created client
        setFormData(prev => ({ ...prev, client_id: newClient.id }));
    };

    const handlePOCChange = (index, field, value) => {
        const newPOCs = [...formData.pocs];
        newPOCs[index][field] = value;
        setFormData({ ...formData, pocs: newPOCs });
    };

    const addPOC = () => {
        setFormData({ ...formData, pocs: [...formData.pocs, { name: '', email: '', phone: '' }] });
    };

    const removePOC = (index) => {
        if (formData.pocs.length > 1) {
            const newPOCs = formData.pocs.filter((_, i) => i !== index);
            setFormData({ ...formData, pocs: newPOCs });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Basic validation
        if (!formData.name || !formData.client_id || formData.pocs.some(p => !p.name || !p.email)) {
            alert('Please fill in all required fields');
            setLoading(false);
            return;
        }


        try {
            const createdProject = await api.projects.create(formData);
            
            if (createdProject && createdProject.id) {
                // Navigate to the newly created project detail page
                navigate(`/projects/${createdProject.id}`);
            } else {
                // Fallback: navigate to admin dashboard if project ID not available
                console.warn('Project created but ID not returned, navigating to dashboard');
                navigate('/dashboard/admin');
            }
        } catch (err) {
            console.error('Failed to create project:', err);
            const errorMessage = err.response?.data?.error || err.message || 'Failed to create project. Please try again.';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fadeIn" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <NewClientModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                onClientCreated={handleClientCreated}
            />

            <button
                onClick={() => navigate(-1)}
                style={{
                    background: 'none', border: 'none', color: 'var(--color-text-muted)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer'
                }}
            >
                <ArrowLeft size={18} /> Back
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Create New Project</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <Card style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>Project Details</h3>

                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <Input
                            label="Project Name"
                            placeholder="e.g. Q1 Marketing Campaign"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />

                        <div className="input-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label className="input-label" style={{ marginBottom: 0 }}>Client</label>
                                <button
                                    type="button"
                                    onClick={() => setIsClientModalOpen(true)}
                                    style={{
                                        background: 'none', border: 'none', color: 'var(--color-primary)',
                                        fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem',
                                        cursor: 'pointer', fontWeight: 500
                                    }}
                                >
                                    <PlusCircle size={14} /> Add New Client
                                </button>
                            </div>
                            <select
                                className="input-field"
                                value={formData.client_id}
                                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                            >
                                <option value="">Select a Client</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </Card>

                <Card style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Point of Contacts</h3>
                        <Button type="button" variant="ghost" onClick={addPOC} size="sm">
                            <Plus size={16} /> Add POC
                        </Button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {formData.pocs.map((poc, index) => (
                            <div key={index} className="animate-slideUp" style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end',
                                padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)'
                            }}>
                                <Input
                                    label={index === 0 ? "Name" : ""}
                                    placeholder="Full Name"
                                    value={poc.name}
                                    onChange={(e) => handlePOCChange(index, 'name', e.target.value)}
                                />
                                <Input
                                    label={index === 0 ? "Email" : ""}
                                    placeholder="email@company.com"
                                    type="email"
                                    value={poc.email}
                                    onChange={(e) => handlePOCChange(index, 'email', e.target.value)}
                                />
                                <Input
                                    label={index === 0 ? "Phone" : ""}
                                    placeholder="+1 (555) 000-0000"
                                    value={poc.phone}
                                    onChange={(e) => handlePOCChange(index, 'phone', e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => removePOC(index)}
                                    disabled={formData.pocs.length === 1}
                                    style={{
                                        background: 'var(--color-bg-input)', border: '1px solid var(--color-danger)',
                                        color: 'var(--color-danger)', width: '42px', height: '42px',
                                        borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: formData.pocs.length === 1 ? 'not-allowed' : 'pointer',
                                        opacity: formData.pocs.length === 1 ? 0.5 : 1
                                    }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </Card>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
                    <Button type="submit" isLoading={loading}>
                        <Save size={18} /> Create Project
                    </Button>
                </div>
            </form>
        </div>
    );
}
