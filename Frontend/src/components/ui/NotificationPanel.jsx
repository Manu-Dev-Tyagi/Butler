import React, { useRef, useEffect } from 'react';
import { Card } from './Card';
import { Bell, Check, X, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

export function NotificationPanel({ onClose }) {
    const { notifications, markAsRead, markAllAsRead } = useNotifications();
    const panelRef = useRef(null);
    const navigate = useNavigate();

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    const getIcon = (type) => {
        switch (type) {
            case 'alert': return <AlertCircle size={16} color="var(--color-danger)" />;
            case 'success': return <CheckCircle size={16} color="var(--color-success)" />;
            default: return <Info size={16} color="var(--color-info)" />;
        }
    };

    return (
        <div ref={panelRef} className="animate-fadeIn" style={{
            position: 'absolute',
            top: '60px',
            right: '20px',
            width: '320px',
            zIndex: 1000,
            filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))'
        }}>
            <Card style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                <div style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--color-bg-card-hover)'
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Notifications</h3>
                    <button
                        onClick={markAllAsRead}
                        style={{ fontSize: '0.75rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        Mark all read
                    </button>
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                            No new notifications
                        </div>
                    ) : (
                        notifications.map(note => (
                            <div key={note.id} style={{
                                padding: '1rem',
                                borderBottom: '1px solid var(--color-border)',
                                background: note.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                                display: 'flex',
                                gap: '0.75rem',
                                opacity: note.read ? 0.7 : 1,
                                transition: 'background 0.2s'
                            }}>
                                <div style={{ marginTop: '2px' }}>{getIcon(note.type)}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>{note.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{note.message}</div>
                                    <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>{note.time}</div>
                                </div>
                                {!note.read && (
                                    <button
                                        onClick={() => markAsRead(note.id)}
                                        title="Mark as read"
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            height: '24px', width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--color-text-muted)'
                                        }}
                                    >
                                        <Check size={14} />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div style={{ padding: '0.75rem', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>
                    <button style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        View All History
                    </button>
                </div>
            </Card>
        </div>
    );
}
