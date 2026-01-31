
import React from 'react';

export const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="bg-slate-200 text-slate-800 text-center font-bold text-xs border-y border-stone-400 uppercase py-0.5 tracking-wide shadow-sm">
    {title}
  </div>
);

export const HeaderInput: React.FC<{ 
  label: string; 
  value: string; 
  onChange: (val: string) => void; 
  className?: string;
}> = ({ label, value, onChange, className = '' }) => (
  <div className={`flex items-baseline px-2 py-0.5 h-full ${className}`}>
    <span className="text-[10px] font-bold mr-1 whitespace-nowrap uppercase text-stone-500 tracking-wider shrink-0 leading-none">{label} :</span>
    <input 
      className="sheet-input text-sm w-full min-w-0" // min-w-0 allows flex shrink
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
    />
  </div>
);
