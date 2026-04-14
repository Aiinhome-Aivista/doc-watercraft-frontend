import React from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
}

const Select: React.FC<SelectProps> = ({ label, options, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[10px] uppercase tracking-[0.15em] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">{label}</label>}
      <select
        className="w-full appearance-none border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-cyan-600"
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
