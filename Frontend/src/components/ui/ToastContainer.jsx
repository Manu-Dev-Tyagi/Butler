import React from 'react';
import Toast from './Toast';

export function ToastContainer({ toasts, onRemove }) {
    return (
        <div
            style={{
                position: 'fixed',
                top: '80px',
                right: '2rem',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                pointerEvents: 'none'
            }}
        >
            {toasts.map((toast) => (
                <div key={toast.id} style={{ pointerEvents: 'auto' }}>
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => onRemove(toast.id)}
                        duration={toast.duration}
                    />
                </div>
            ))}
        </div>
    );
}
