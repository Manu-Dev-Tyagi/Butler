import React from 'react';

export function Card({ children, className = '', ...props }) {
    return (
        <div className={`card glass ${className}`} {...props}>
            {children}
        </div>
    );
}
