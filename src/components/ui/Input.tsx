import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[10px] uppercase tracking-[0.15em] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">{label}</label>}
      <input
        className="w-full appearance-none border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-600"
        {...props}
      />
    </div>
  );
};

export default Input;
