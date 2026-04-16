import React, { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className, type, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const isPassword = type === 'password';
  const currentType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input 
          type={currentType}
          className={`form-input ${error ? 'input-error' : ''} ${className || ''}`} 
          style={isPassword ? { paddingRight: '45px', width: '100%' } : { width: '100%' }}
          {...props} 
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{ 
              position: 'absolute', 
              right: '12px', 
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-secondary)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}
      </div>
      {error && <span className="error-text" style={{ color: '#e63946', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
};

export default Input;
