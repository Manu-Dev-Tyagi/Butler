import React from 'react';

export function Input({ label, error, className = '', ...props }) {
    return (
        <div className="input-group">
            {label && <label className="input-label">{label}</label>}
            <input
                className={`input-field ${error ? 'input-error' : ''} ${className}`}
                {...props}
            />
            {error && <span className="error-text">{error}</span>}
        </div>
    );
}
