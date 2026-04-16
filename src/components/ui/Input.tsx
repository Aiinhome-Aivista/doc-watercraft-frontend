import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input className={`form-input ${error ? 'input-error' : ''} ${className || ''}`} {...props} />
      {error && <span className="error-text" style={{ color: '#e63946', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
};

export default Input;
