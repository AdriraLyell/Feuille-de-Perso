
import React from 'react';

export const SectionHeader: React.FC<{ title: React.ReactNode }> = ({ title }) => (
  <div className="bg-slate-200 text-slate-800 flex items-center justify-center text-center font-bold text-xs border-t border-b border-stone-800 uppercase py-0.5 tracking-wide shadow-sm min-h-[1.5rem] shrink-0">
    {title}
  </div>
);

export const HeaderInput: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  className?: string;
  readOnly?: boolean;
  title?: string;
  children?: React.ReactNode;
}> = ({ label, value, onChange, className = '', readOnly, title, children }) => (
  <div className={`flex items-center px-2 py-0.5 h-full relative ${className}`} title={title}>
    <span className="text-[10px] font-bold mr-1 whitespace-nowrap uppercase text-stone-500 tracking-wider shrink-0 leading-none">{label} :</span>
    <div className="flex-grow flex items-center relative h-full">
      <input
        className={`sheet-input text-sm w-full min-w-0 ${readOnly ? 'cursor-default focus:ring-0' : ''}`}
        value={value}
        onChange={(e) => !readOnly && onChange(e.target.value)}
        readOnly={readOnly}
      />
      {children}
    </div>
  </div>
);
