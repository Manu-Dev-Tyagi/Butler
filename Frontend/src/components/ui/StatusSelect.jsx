import React, { useState } from 'react';

export function StatusSelect({ initialStatus, onChange, readOnly = false }) {
    const [status, setStatus] = useState(initialStatus);

    const getStyles = (currentStatus) => {
        switch (currentStatus) {
            case 'Active':
                return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }; // Green
            case 'IN_PROGRESS':
                return { bg: 'rgba(234, 179, 8, 0.2)', color: '#eab308' }; // Yellow
            case 'DELAYED':
                return { bg: 'rgba(249, 115, 22, 0.2)', color: '#f97316' }; // Orange
            case 'COMPLETED':
                return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }; // Blue
            default:
                return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' };
        }
    };

    const styles = getStyles(status);

    const handleChange = (e) => {
        const newStatus = e.target.value;
        setStatus(newStatus);
        e.target.blur();
        if (onChange) {
            onChange(newStatus);
        }
    };

    return (
        <select
            onClick={(e) => e.stopPropagation()}
            disabled={readOnly}
            style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                cursor: readOnly ? 'default' : 'pointer',
                appearance: 'none',
                background: styles.bg,
                color: styles.color,
                textAlign: 'center',
                outline: 'none',
                minWidth: '100px',
                opacity: readOnly ? 0.8 : 1
            }}
            value={status}
            onChange={handleChange}
        >
            <option value="Active" style={{ background: '#1f2937', color: '#ffffff' }}>Active</option>
            <option value="IN_PROGRESS" style={{ background: '#1f2937', color: '#ffffff' }}>In Progress</option>
            <option value="DELAYED" style={{ background: '#1f2937', color: '#ffffff' }}>Delayed</option>
            <option value="COMPLETED" style={{ background: '#1f2937', color: '#ffffff' }}>Completed</option>
        </select>
    );
}
