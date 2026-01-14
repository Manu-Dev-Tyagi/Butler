import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { Skeleton } from '../ui/Skeleton';
import { Paperclip, X, Download, File } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function FileUpload({ ticketId, onFileUploaded }) {
    const { user } = useAuth();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        fetchFiles();
    }, [ticketId]);

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const data = await api.files.list(ticketId);
            setFiles(data || []);
        } catch (err) {
            console.error('Failed to fetch files', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (fileList) => {
        if (!fileList || fileList.length === 0) return;

        setUploading(true);
        try {
            const formData = new FormData();
            Array.from(fileList).forEach(file => {
                formData.append('files', file);
            });
            formData.append('ticket_id', ticketId);
            formData.append('uploaded_by', user.id);

            await api.files.upload(formData);
            await fetchFiles();
            if (onFileUploaded) onFileUploaded();
        } catch (err) {
            console.error('Failed to upload file', err);
            alert('Failed to upload file. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (fileId) => {
        if (!confirm('Are you sure you want to delete this file?')) return;
        try {
            await api.files.delete(fileId);
            await fetchFiles();
        } catch (err) {
            console.error('Failed to delete file', err);
            alert('Failed to delete file. Please try again.');
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files);
        }
    };

    if (loading) {
        return (
            <Card style={{ padding: '1.5rem' }}>
                <Skeleton style={{ height: '100px' }} />
            </Card>
        );
    }

    return (
        <Card style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Files & Deliverables</h3>
                <label>
                    <input
                        type="file"
                        multiple
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e.target.files)}
                        disabled={uploading}
                    />
                    <Button variant="ghost" size="sm" as="span" disabled={uploading}>
                        <Paperclip size={16} style={{ marginRight: '0.5rem' }} />
                        {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                </label>
            </div>

            {/* Drop Zone */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                    padding: '2rem',
                    border: `2px dashed ${dragActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    background: dragActive ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    marginBottom: files.length > 0 ? '1rem' : 0
                }}
                onClick={() => document.querySelector('input[type="file"]')?.click()}
            >
                <Paperclip size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    {dragActive ? 'Drop files here' : 'Drag & drop files here or click to browse'}
                </p>
            </div>

            {/* Files List */}
            {files.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {files.map((file) => (
                        <div
                            key={file.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.75rem',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--color-border)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                <File size={18} style={{ color: 'var(--color-text-muted)' }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 500, fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {file.file_name}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        {file.file_size ? `${(file.file_size / 1024).toFixed(2)} KB` : 'Unknown size'} • 
                                        {new Date(file.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {file.file_url && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => window.open(file.file_url, '_blank')}
                                    >
                                        <Download size={14} />
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDelete(file.id)}
                                    className="hover-danger"
                                >
                                    <X size={14} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
