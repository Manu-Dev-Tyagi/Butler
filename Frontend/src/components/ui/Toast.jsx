import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 5000 }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const icons = {
        success: CheckCircle,
        error: AlertCircle,
        warning: AlertTriangle,
        info: Info
    };

    const colors = {
        success: 'var(--color-success)',
        error: 'var(--color-danger)',
        warning: 'var(--color-warning)',
        info: 'var(--color-info)'
    };

    const Icon = icons[type] || Info;
    const color = colors[type] || colors.info;

    return (
        <div
            className="animate-slideUp"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: 'var(--color-bg-card)',
                border: `1px solid ${color}`,
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                minWidth: '300px',
                maxWidth: '500px',
                position: 'relative'
            }}
        >
            <Icon size={20} color={color} />
            <p style={{ flex: 1, fontSize: '0.9375rem', color: 'var(--color-text-main)' }}>
                {message}
            </p>
            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                className="hover-danger"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
