import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { FileText, Send, Plus, X, Mail, Calendar, Eye, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

/**
 * Response Sheet Generator
 * Wizard-based:
 * - Select project
 * - Select date range
 * - Preview snapshot
 * - Send to client
 * Snapshot is immutable once generated.
 */
export default function ResponseSheet() {
    const [sheets, setSheets] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [wizardStep, setWizardStep] = useState(0); // 0: closed, 1: project, 2: date range, 3: preview, 4: send
    const [wizardData, setWizardData] = useState({
        project_id: '',
        date_from: '',
        date_to: '',
        preview: null
    });
    const [showSendModal, setShowSendModal] = useState(null);
    const [emailAddresses, setEmailAddresses] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchSheets();
        fetchProjects();
    }, []);

    const fetchSheets = async () => {
        try {
            setLoading(true);
            const data = await api.responseSheets.list();
            setSheets(data || []);
        } catch (err) {
            console.error('Failed to fetch response sheets', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const data = await api.projects.list();
            setProjects(data || []);
        } catch (err) {
            console.error('Failed to fetch projects', err);
        }
    };

    const handleWizardNext = async () => {
        if (wizardStep === 1) {
            // Step 1: Validate project selection
            if (!wizardData.project_id) {
                alert('Please select a project');
                return;
            }
            setWizardStep(2);
        } else if (wizardStep === 2) {
            // Step 2: Validate date range and generate preview
            if (!wizardData.date_from || !wizardData.date_to) {
                alert('Please select date range');
                return;
            }
            setGenerating(true);
            try {
                // Generate preview (would need backend to support date range)
                const preview = await api.responseSheets.generate(wizardData.project_id);
                setWizardData({ ...wizardData, preview });
                setWizardStep(3);
            } catch (err) {
                console.error('Failed to generate preview:', err);
                alert('Failed to generate preview. Please try again.');
            } finally {
                setGenerating(false);
            }
        } else if (wizardStep === 3) {
            // Step 3: Move to send step
            setWizardStep(4);
        }
    };

    const handleWizardBack = () => {
        if (wizardStep > 1) {
            setWizardStep(wizardStep - 1);
        } else {
            setWizardStep(0);
            setWizardData({ project_id: '', date_from: '', date_to: '', preview: null });
        }
    };

    const handleGenerateFinal = async () => {
        if (!wizardData.project_id) {
            alert('Please select a project');
            return;
        }
        setGenerating(true);
        try {
            const sheet = await api.responseSheets.generate(wizardData.project_id);
            await fetchSheets();
            setWizardStep(0);
            setWizardData({ project_id: '', date_from: '', date_to: '', preview: null });
            alert('Response sheet generated successfully! Snapshot is now immutable.');
        } catch (err) {
            console.error('Failed to generate response sheet', err);
            alert('Failed to generate response sheet. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const handleSend = async (sheetId) => {
        if (!emailAddresses.trim()) {
            alert('Please enter at least one email address');
            return;
        }
        const emails = emailAddresses.split(',').map(e => e.trim()).filter(e => e);
        setSending(true);
        try {
            await api.responseSheets.send(sheetId, emails);
            await fetchSheets();
            setShowSendModal(null);
            setEmailAddresses('');
            alert('Response sheet sent successfully!');
        } catch (err) {
            console.error('Failed to send response sheet', err);
            alert('Failed to send response sheet. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'DRAFT': 'warning',
            'SENT': 'success',
            'GENERATED': 'neutral'
        };
        return statusMap[status] || 'neutral';
    };

    return (
        <div className="animate-fadeIn">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Response Sheets</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Generate and send project status reports to clients</p>
                </div>
                <Button onClick={() => setWizardStep(1)}>
                    <Plus size={18} style={{ marginRight: '0.5rem' }} />
                    Generate New Sheet
                </Button>
            </div>

            {loading ? (
                <Card style={{ padding: '2rem' }}>
                    <Skeleton style={{ height: '200px' }} />
                </Card>
            ) : (
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                    {sheets.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Response Sheets</h3>
                            <p>Generate your first response sheet to get started.</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9375rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Generated At</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Project</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Client</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Status</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sheets.map((sheet) => (
                                    <tr key={sheet.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="hover-row">
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            {new Date(sheet.created_at).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>
                                            {sheet.project_name || 'N/A'}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            {sheet.client_name || 'N/A'}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <Badge variant={getStatusBadge(sheet.status)}>
                                                {sheet.status || 'DRAFT'}
                                            </Badge>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {sheet.status === 'DRAFT' && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => setShowSendModal(sheet.id)}
                                                    >
                                                        <Send size={14} style={{ marginRight: '0.25rem' }} />
                                                        Send
                                                    </Button>
                                                )}
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost"
                                                    onClick={() => window.open(`/response-sheets/${sheet.id}`, '_blank')}
                                                >
                                                    View
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>
            )}

            {/* Wizard Modal */}
            {wizardStep > 0 && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
                }}>
                    <Card style={{ width: '90%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }} className="animate-scaleIn">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Generate Response Sheet</h2>
                            <button 
                                onClick={handleWizardBack}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Progress Steps */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', position: 'relative' }}>
                            {[1, 2, 3, 4].map((step, i) => {
                                const isActive = wizardStep === step;
                                const isCompleted = wizardStep > step;
                                return (
                                    <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                        {i > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '20px',
                                                left: '-50%',
                                                width: '100%',
                                                height: '2px',
                                                background: isCompleted ? 'var(--color-primary)' : 'var(--color-border)',
                                                zIndex: 0
                                            }} />
                                        )}
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: isCompleted ? 'var(--color-primary)' : isActive ? 'var(--color-primary)' : 'var(--color-bg-card)',
                                            border: isActive ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 1,
                                            position: 'relative'
                                        }}>
                                            {isCompleted ? (
                                                <CheckCircle size={20} color="#fff" />
                                            ) : (
                                                <span style={{ color: isActive ? '#fff' : 'var(--color-text-muted)', fontWeight: 600 }}>
                                                    {step}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)', textAlign: 'center' }}>
                                            {step === 1 ? 'Project' : step === 2 ? 'Date Range' : step === 3 ? 'Preview' : 'Send'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Step 1: Select Project */}
                        {wizardStep === 1 && (
                            <div className="animate-slideUp">
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        Select Project
                                    </label>
                                    <select
                                        value={wizardData.project_id}
                                        onChange={(e) => setWizardData({ ...wizardData, project_id: e.target.value })}
                                        style={{
                                            width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)', background: 'var(--color-bg-input)',
                                            color: 'var(--color-text-main)', fontSize: '0.9375rem'
                                        }}
                                    >
                                        <option value="">Select a project...</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                                        Select the project for which you want to generate a response sheet.
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <Button variant="outline" onClick={handleWizardBack}>Cancel</Button>
                                    <Button onClick={handleWizardNext} disabled={!wizardData.project_id}>
                                        Next <ArrowRight size={16} style={{ marginLeft: '0.5rem' }} />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Select Date Range */}
                        {wizardStep === 2 && (
                            <div className="animate-slideUp">
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        <Calendar size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                                        Date Range (Optional)
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                                From
                                            </label>
                                            <input
                                                type="date"
                                                value={wizardData.date_from}
                                                onChange={(e) => setWizardData({ ...wizardData, date_from: e.target.value })}
                                                style={{
                                                    width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                                    border: '1px solid var(--color-border)', background: 'var(--color-bg-input)',
                                                    color: 'var(--color-text-main)', fontSize: '0.9375rem'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                                To
                                            </label>
                                            <input
                                                type="date"
                                                value={wizardData.date_to}
                                                onChange={(e) => setWizardData({ ...wizardData, date_to: e.target.value })}
                                                style={{
                                                    width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                                    border: '1px solid var(--color-border)', background: 'var(--color-bg-input)',
                                                    color: 'var(--color-text-main)', fontSize: '0.9375rem'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                                        Select a date range to filter the snapshot data. If not specified, all project data will be included.
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
                                    <Button variant="outline" onClick={handleWizardBack}>
                                        <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} />
                                        Back
                                    </Button>
                                    <Button onClick={handleWizardNext} isLoading={generating}>
                                        Generate Preview <ArrowRight size={16} style={{ marginLeft: '0.5rem' }} />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Preview Snapshot */}
                        {wizardStep === 3 && wizardData.preview && (
                            <div className="animate-slideUp">
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Eye size={18} />
                                        Preview Snapshot
                                    </h3>
                                    <Card style={{ padding: '1.5rem', background: 'var(--color-bg-card)', maxHeight: '400px', overflow: 'auto' }}>
                                        <pre style={{
                                            fontSize: '0.75rem',
                                            fontFamily: 'monospace',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            color: 'var(--color-text-main)'
                                        }}>
                                            {JSON.stringify(wizardData.preview.snapshot_data || wizardData.preview, null, 2)}
                                        </pre>
                                    </Card>
                                </div>
                                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                    <p style={{ fontSize: '0.875rem', color: '#ef4444', lineHeight: 1.6 }}>
                                        <strong>⚠️ Important:</strong> Once generated, this snapshot is immutable and will never be recomputed. 
                                        This ensures historical accuracy for client reporting.
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
                                    <Button variant="outline" onClick={handleWizardBack}>
                                        <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} />
                                        Back
                                    </Button>
                                    <Button onClick={handleWizardNext}>
                                        Continue to Send <ArrowRight size={16} style={{ marginLeft: '0.5rem' }} />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Send to Client */}
                        {wizardStep === 4 && (
                            <div className="animate-slideUp">
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
                                        Send to Client
                                    </h3>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                            Email Addresses <span style={{ color: 'var(--color-text-muted)' }}>(comma-separated)</span>
                                        </label>
                                        <textarea
                                            value={emailAddresses}
                                            onChange={(e) => setEmailAddresses(e.target.value)}
                                            placeholder="client@example.com, manager@example.com"
                                            rows={4}
                                            style={{
                                                width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--color-border)', background: 'var(--color-bg-input)',
                                                color: 'var(--color-text-main)', fontSize: '0.9375rem', resize: 'vertical',
                                                fontFamily: 'inherit'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
                                    <Button variant="outline" onClick={handleWizardBack}>
                                        <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} />
                                        Back
                                    </Button>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <Button variant="outline" onClick={handleGenerateFinal} isLoading={generating}>
                                            <FileText size={16} style={{ marginRight: '0.5rem' }} />
                                            Generate Only
                                        </Button>
                                        {wizardData.preview && (
                                            <Button 
                                                onClick={async () => {
                                                    if (!emailAddresses.trim()) {
                                                        alert('Please enter at least one email address');
                                                        return;
                                                    }
                                                    const emails = emailAddresses.split(',').map(e => e.trim()).filter(e => e);
                                                    setSending(true);
                                                    try {
                                                        await api.responseSheets.send(wizardData.preview.id, emails);
                                                        await fetchSheets();
                                                        setWizardStep(0);
                                                        setWizardData({ project_id: '', date_from: '', date_to: '', preview: null });
                                                        setEmailAddresses('');
                                                        alert('Response sheet sent successfully!');
                                                    } catch (err) {
                                                        console.error('Failed to send response sheet', err);
                                                        alert('Failed to send response sheet. Please try again.');
                                                    } finally {
                                                        setSending(false);
                                                    }
                                                }} 
                                                isLoading={sending} 
                                                disabled={!emailAddresses.trim()}
                                            >
                                                <Send size={16} style={{ marginRight: '0.5rem' }} />
                                                Generate & Send
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* Send Modal */}
            {showSendModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <Card style={{ width: '500px', padding: '2rem', maxWidth: '90vw' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Send Response Sheet</h3>
                            <button 
                                onClick={() => { setShowSendModal(null); setEmailAddresses(''); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                Email Addresses <span style={{ color: 'var(--color-text-muted)' }}>(comma-separated)</span>
                            </label>
                            <textarea
                                value={emailAddresses}
                                onChange={(e) => setEmailAddresses(e.target.value)}
                                placeholder="client@example.com, manager@example.com"
                                rows={4}
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)', background: 'var(--color-bg-input)',
                                    color: 'var(--color-text-main)', fontSize: '0.9375rem', resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <Button variant="outline" onClick={() => { setShowSendModal(null); setEmailAddresses(''); }}>
                                Cancel
                            </Button>
                            <Button onClick={() => handleSend(showSendModal)} isLoading={sending} disabled={!emailAddresses.trim()}>
                                <Mail size={16} style={{ marginRight: '0.5rem' }} />
                                Send
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
