import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { StatusBadge } from '@/components/ui';
import { fetchVessels } from '@/store/slices/vesselSlice';
import { formatDateTimeIST } from '@/utils/dateTime';

const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const vessels = useAppSelector((state) => state.vessels.items);
  const loading = useAppSelector((state) => state.vessels.loading);

  useEffect(() => {
    dispatch(fetchVessels());
  }, [dispatch]);

  const stats = {
    total: vessels.length,
    planned: vessels.filter((v) => v.status === 'PLANNED').length,
    active: vessels.filter((v) => ['BERTHED', 'MOORED'].includes(v.status)).length,
    completed: vessels.filter((v) => v.status === 'COMPLETED').length,
    totalQty: vessels.reduce(
      (s, v) => s + parseFloat((v.survey_quantity || v.quantity || 0).toString()),
      0
    ),
  };

  const fmt = (v: string | null) => (v ? formatDateTimeIST(v) : '—');

  const fmtNum = (n: number | string | null | undefined) => 
    n != null ? Number(n).toLocaleString('en-IN') : '—';

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Total Vessels', val: stats.total, color: '#00c2ff', icon: 'directions_boat' },
          { label: 'Planned', val: stats.planned, color: '#6b8090', icon: 'assignment' },
          { label: 'Active (Berthed/Moored)', val: stats.active, color: '#ffb020', icon: 'sailing' },
          { label: 'Completed', val: stats.completed, color: '#00e09e', icon: 'check_circle' },
          { label: 'Total Cargo (MT)', val: fmtNum(Math.round(stats.totalQty)), color: '#9b6dff', icon: 'scale' },
        ].map((s) => (
          <div
            className="relative overflow-hidden border border-slate-800 bg-slate-950 p-4 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-[var(--accent-color)]"
            key={s.label}
            style={{ '--accent-color': s.color } as React.CSSProperties}
          >
            <div className="text-[32px] font-bold leading-none text-slate-100 [font-family:'Barlow_Condensed',sans-serif]">{s.val}</div>
            <div className="mt-1.5 text-[10px] uppercase tracking-[0.15em] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">{s.label}</div>
            <div className="absolute right-3 top-3 text-xl opacity-20">
              <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto border border-slate-800 bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
          <span className="text-base font-bold tracking-[0.08em] text-slate-100 [font-family:'Barlow_Condensed',sans-serif]">VESSEL STATUS OVERVIEW</span>
        </div>
        <table className="w-full min-w-[860px] border-collapse [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-[10px] [&_th]:font-normal [&_th]:uppercase [&_th]:tracking-[0.15em] [&_th]:text-slate-500 [&_th]:[font-family:'IBM_Plex_Mono',monospace] [&_thead_tr]:border-b [&_thead_tr]:border-slate-800 [&_td]:border-b [&_td]:border-slate-800 [&_td]:px-4 [&_td]:py-2.5 [&_td]:text-[13px] [&_td]:text-slate-300 [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-white/[0.02]">
          <thead>
            <tr>
              <th>Vessel ID</th>
              <th>Vessel Name</th>
              <th>Cargo</th>
              <th>Direction</th>
              <th>Qty (MT)</th>
              <th>Berthing</th>
              <th>Sailing</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {vessels.map((v) => (
              <tr key={v.id}>
                <td className="text-cyan-300 [font-family:'IBM_Plex_Mono',monospace]">{v.vessel_auto_id}</td>
                <td className="font-medium text-slate-100">{v.vessel_name}</td>
                <td><span className="inline-block border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] tracking-[0.05em] text-cyan-300 [font-family:'IBM_Plex_Mono',monospace]">{v.cargo_type}</span></td>
                <td>{v.direction}</td>
                <td className="[font-family:'IBM_Plex_Mono',monospace]">{fmtNum(v.survey_quantity || v.quantity)}</td>
                <td className="text-xs">{fmt(v.berthing_datetime)}</td>
                <td className="text-xs">{fmt(v.sailing_datetime)}</td>
                <td><StatusBadge status={v.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default DashboardPage;
