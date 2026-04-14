import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { StatusBadge } from '@/components/ui';
import { fetchVessels } from '@/store/slices/vesselSlice';

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

  const fmt = (v: string | null) =>
    v ? new Date(v).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) : '—';

  const fmtNum = (n: number | string | null | undefined) => 
    n != null ? Number(n).toLocaleString('en-IN') : '—';

  return (
    <>
      <div className="stat-grid">
        {[
          { label: 'Total Vessels', val: stats.total, color: 'var(--accent)', icon: 'directions_boat' },
          { label: 'Planned', val: stats.planned, color: 'var(--text2)', icon: 'assignment' },
          { label: 'Active (Berthed/Moored)', val: stats.active, color: 'var(--amber)', icon: 'sailing' },
          { label: 'Completed', val: stats.completed, color: 'var(--green)', icon: 'check_circle' },
          { label: 'Total Cargo (MT)', val: fmtNum(Math.round(stats.totalQty)), color: 'var(--purple)', icon: 'scale' },
        ].map((s) => (
          <div className="stat-card" key={s.label} style={{ "--accent-color": s.color } as React.CSSProperties}>
            <div className="stat-val">{s.val}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-badge"><span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>{s.icon}</span></div>
          </div>
        ))}
      </div>

      <div className="table-wrap">
        <div className="table-header">
          <span className="table-title">VESSEL STATUS OVERVIEW</span>
        </div>
        <table>
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
                <td className="td-mono">{v.vessel_auto_id}</td>
                <td className="td-primary">{v.vessel_name}</td>
                <td><span className="tag">{v.cargo_type}</span></td>
                <td>{v.direction}</td>
                <td className="font-mono">{fmtNum(v.survey_quantity || v.quantity)}</td>
                <td style={{ fontSize: 12 }}>{fmt(v.berthing_datetime)}</td>
                <td style={{ fontSize: 12 }}>{fmt(v.sailing_datetime)}</td>
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
