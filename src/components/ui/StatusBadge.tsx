import React from 'react';
import { VesselStatus } from '@/types/vessel';
import { GateStatus } from '@/types/vehicle';

interface StatusBadgeProps {
  status: VesselStatus | GateStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span className={`badge badge-${status}`}>
      <span className={`badge-dot badge-dot-${status}`}></span>
      {status?.replace(/_/g, ' ')}
    </span>
  );
};

export default StatusBadge;
