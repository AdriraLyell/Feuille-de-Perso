
import React, { useRef } from 'react';

interface NotebookInputProps {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}

const NotebookInput: React.FC<NotebookInputProps> = ({ value, onChange, placeholder }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const maskRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (textareaRef.current && maskRef.current) {
            maskRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const lineHeight = '22px'; 
    const fontSize = '0.95rem'; 
    const paddingTop = '2px'; 
    const paddingX = '4px';

    const typoStyles: React.CSSProperties = {
        fontFamily: '"Patrick Hand", cursive',
        fontSize,
        lineHeight,
        paddingTop,
        paddingLeft: paddingX,
        paddingRight: paddingX,
        whiteSpace: 'pre-wrap', 
        wordWrap: 'break-word',
    };

    return (
        <div className="relative w-full h-full overflow-hidden rounded-sm bg-white/50 group/notebook">
            <div 
                ref={maskRef}
                className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-10 text-transparent"
                style={{
                    ...typoStyles,
                    backgroundImage: `linear-gradient(transparent 21px, #d1d5db 21px)`,
                    backgroundSize: `100% ${lineHeight}`,
                    backgroundAttachment: 'local',
                    backgroundRepeat: 'repeat',
                }}
                aria-hidden="true"
            >
                <div className="min-h-full w-full">
                    <span className="box-decoration-clone">
                        {value} 
                    </span>
                </div>
            </div>

            <textarea 
              ref={textareaRef}
              className="relative z-20 w-full h-full bg-transparent resize-none focus:outline-none text-ink transition-colors focus:bg-blue-50/10"
              style={typoStyles}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onScroll={handleScroll}
              placeholder={placeholder}
              spellCheck={false}
            />
        </div>
    );
};

export default NotebookInput;
