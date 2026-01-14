import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
    children,
    variant = 'primary',
    isLoading = false,
    disabled,
    className = '',
    ...props
}) {
    return (
        <button
            className={`btn btn-${variant} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            {children}
        </button>
    );
}
