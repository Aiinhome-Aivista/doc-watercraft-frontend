import React from 'react';

const GlobalLoader: React.FC = () => {
  return (
    <div className="global-loader-overlay" role="status" aria-live="polite" aria-label="Loading">
      <div className="global-loader-box">
        <span className="material-symbols-outlined global-loader-icon" aria-hidden="true">sync</span>
        <span className="global-loader-text">Loading data...</span>
      </div>
    </div>
  );
};

export default GlobalLoader;
