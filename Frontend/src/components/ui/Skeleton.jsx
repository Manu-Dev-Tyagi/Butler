import React from 'react';

export function Skeleton({ className = '', style, ...props }) {
    return (
        <div
            className={`skeleton ${className}`}
            style={style}
            {...props}
        />
    );
}
