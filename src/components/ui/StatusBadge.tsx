import React from 'react';
import { VesselStatus } from '@/types/vessel';
import { GateStatus } from '@/types/vehicle';

interface StatusBadgeProps {
  status: VesselStatus | GateStatus;
}

const statusStyles: Record<string, { badge: string; dot: string }> = {
  PLANNED: {
    badge: 'border-slate-700 text-slate-300',
    dot: 'bg-slate-500',
  },
  BERTHED: {
    badge: 'border-amber-500/40 text-amber-300',
    dot: 'bg-amber-400',
  },
  MOORED: {
    badge: 'border-cyan-500/40 text-cyan-300',
    dot: 'bg-cyan-400 animate-pulse',
  },
  COMPLETED: {
    badge: 'border-emerald-500/40 text-emerald-300',
    dot: 'bg-emerald-400',
  },
  PENDING_WBIN: {
    badge: 'border-amber-500/40 text-amber-300',
    dot: 'bg-amber-400',
  },
  WBIN_DONE: {
    badge: 'border-cyan-500/40 text-cyan-300',
    dot: 'bg-cyan-400',
  },
  UNLOADING: {
    badge: 'border-violet-500/40 text-violet-300',
    dot: 'bg-violet-400',
  },
  PENDING_WBOUT: {
    badge: 'border-amber-500/40 text-amber-300',
    dot: 'bg-amber-400',
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const style = statusStyles[status] ?? statusStyles.PLANNED;

  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] [font-family:'IBM_Plex_Mono',monospace] ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`}></span>
      {status?.replace(/_/g, ' ')}
    </span>
  );
};

export default StatusBadge;
