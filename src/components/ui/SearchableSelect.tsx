import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  error?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  placeholder = "Search and select...",
  value,
  onChange,
  options,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selectedOpt = options.find(o => String(o.value) === String(value));
    if (selectedOpt && selectedOpt.value !== "") {
      setSearch(selectedOpt.label);
    } else {
      setSearch(value);
    }
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter(option => {
    const selectedOpt = options.find(o => String(o.value) === String(value));
    if (selectedOpt && search === selectedOpt.label) {
      return true;
    }
    return option.label.toLowerCase().includes(search.toLowerCase()) ||
           option.value.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="form-group" ref={dropdownRef} style={{ position: 'relative' }}>
      {label && <label className="form-label">{label}</label>}
      <div style={{ position: 'relative' }}>
        <input
          className={`form-input w-full ${error ? 'input-error' : ''}`}
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={(e) => {
            setIsOpen(true);
            e.target.select();
          }}
          style={{ width: '100%', paddingRight: '36px' }}
        />
        <div style={{ 
          position: 'absolute', 
          right: '12px', 
          top: '50%', 
          transform: 'translateY(-50%)', 
          pointerEvents: 'none', 
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_drop_down</span>
        </div>
      </div>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '6px',
          backgroundColor: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
          maxHeight: '220px',
          overflowY: 'auto',
          zIndex: 100,
        }}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  borderBottom: idx === filteredOptions.length - 1 ? 'none' : '1px solid var(--border)',
                  transition: 'background-color 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={() => {
                  setSearch(opt.label);
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{opt.label}</div>
                {opt.value && opt.value !== opt.label && (
                   <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{opt.value}</div>
                )}
              </div>
            ))
          ) : (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic' }}>
              No matches found
            </div>
          )}
        </div>
      )}
      {error && <span className="error-text" style={{ color: '#e63946', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
};

export default SearchableSelect;
