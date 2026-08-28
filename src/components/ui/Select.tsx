import React from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
}

const Select: React.FC<SelectProps> = ({ label, error, options, ...props }) => {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-start' }}>
          {label.replace(/\s*\*\s*$/, '')}
          {label.trim().endsWith('*') && <span>*</span>}
        </label>
      )}
      <select className={`form-select ${error ? 'input-error' : ''}`} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <span className="error-text" style={{ color: '#e63946', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
};

export default Select;
