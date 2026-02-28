import React, { useState, useRef, useEffect } from 'react';

/**
 * Specialized input to avoid cursor jumping when performing transformations like toUpperCase()
 */
interface CodeInputProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
}

export const CodeInput: React.FC<CodeInputProps> = ({ value, onChange, placeholder, className }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        if (value !== localValue) {
            setLocalValue(value);
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const val = input.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');

        setLocalValue(val);
        onChange(val);

        // Restore cursor after state update/re-render
        requestAnimationFrame(() => {
            if (inputRef.current) {
                inputRef.current.setSelectionRange(start, end);
            }
        });
    };

    return (
        <input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={handleChange}
            placeholder={placeholder}
            className={className}
        />
    );
};
