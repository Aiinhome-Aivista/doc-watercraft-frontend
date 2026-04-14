import React from 'react';

const GlobalLoader: React.FC = () => {
  return (
    <div className="global-loader-overlay">
      <div className="loader-viewport">
        <div className="porthole-frame">
          {/* Glass Reflection Overlay */}
          <div className="glass-glare" />
          
          <div className="marine-scene">
            <div className="ship-container">
              <span className="material-symbols-outlined boat-icon">directions_boat</span>
            </div>
            
            {/* Multi-layered dynamic waves */}
            <div className="wave wave-1" />
            <div className="wave wave-2" />
            <div className="wave wave-3" />
          </div>
        </div>
        
        <div className="loading-status">
          <span className="status-text">Synchronizing Fleet Data</span>
          <div className="progress-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalLoader;