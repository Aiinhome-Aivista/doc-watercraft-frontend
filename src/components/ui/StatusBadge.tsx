import React from 'react';
import { VesselStatus } from '@/types/vessel';
import { GateStatus } from '@/types/vehicle';

interface StatusBadgeProps {
  status: string;
  children?: React.ReactNode;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children }) => {
  return (
    <span className={`badge badge-${status}`}>
      <span className={`badge-dot badge-dot-${status}`}></span>
      {children || status?.replace(/_/g, ' ')}
    </span>
  );
};

export default StatusBadge;
