import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchGateEntries, recordWbinThunk, recordWboutThunk } from '@/store/slices/vehicleSlice';
import { fetchVessels } from '@/store/slices/vesselSlice';
import { GateEntry } from '@/types/vehicle';
import { Modal, Input, Button, StatusBadge } from '@/components/ui';
import { formatDateTimeIST, getCurrentISTDateTimeLocalValue } from '@/utils/dateTime';
import { useAccessRights } from '@/hooks/useAccessRights';
import toast from 'react-hot-toast';

const WeighbridgeTerminalPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const entries = useAppSelector((state) => state.vehicles.entries);
  const { canGateOp } = useAccessRights();

  useEffect(() => {
    dispatch(fetchGateEntries({ per_page: 100 }));
  }, [dispatch]);

  const [modal, setModal] = useState<'wbin' | 'wbout' | null>(null);
  const [selected, setSelected] = useState<GateEntry | null>(null);
  const [form, setForm] = useState<{
    datetime?: string;
    weighment_slip_no?: string;
    direction?: string;
    gross_weight?: string;
    tare_weight?: string;
    wbout_gross_weight?: string;
    wbout_tare_weight?: string;
  }>({});

  const nowDt = () => getCurrentISTDateTimeLocalValue();

  const openModal = (type: 'wbin' | 'wbout', entry: GateEntry) => {
    setSelected(entry);
    setForm({
      datetime: nowDt(),
      weighment_slip_no: entry.weighment_slip_no || '',
      direction: entry.direction,
      gross_weight: entry.gross_weight?.toString() || '',
      tare_weight: entry.tare_weight?.toString() || '',
      wbout_gross_weight: '',
      wbout_tare_weight: '',
    });
    setModal(type);
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setForm({});
  };

  const grossWeight = Number(form.gross_weight || 0);
  const tareWeight = Number(form.tare_weight || 0);
  const isImport = form.direction === 'IMPORT';
  const isExport = form.direction === 'EXPORT';
  const isWboutImport = selected?.direction === 'IMPORT';
  const isWboutExport = selected?.direction === 'EXPORT';

  const handleAction = async (status: 'WBIN_DONE' | 'COMPLETED') => {
    if (!selected || !form.datetime) {
      toast.error('Please provide weighbridge date and time');
      return;
    }

    try {
      if (status === 'WBIN_DONE') {
        if (!form.direction) {
          toast.error('Unable to determine vessel direction');
          return;
        }

        if (isImport && (!form.tare_weight || tareWeight <= 0)) {
          toast.error('Please provide Tare Wt for IMPORT WBIN');
          return;
        }

        if (isExport && (!form.gross_weight || grossWeight <= 0)) {
          toast.error('Please provide Gross Wt for EXPORT WBIN');
          return;
        }

        const payload = {
          gate_entry_id: selected.id,
          weighment_slip_no: form.weighment_slip_no || '',
          wbin_datetime: form.datetime + ':00',
          gross_weight: isExport ? grossWeight : undefined,
          tare_weight: isImport ? tareWeight : undefined,
        };

        await dispatch(recordWbinThunk(payload)).unwrap();
        closeModal();
        toast.success('WBIN recorded successfully');
        return;
      }

      if (status === 'COMPLETED') {
        if (!form.direction) {
          toast.error('Unable to determine vessel direction');
          return;
        }

        const wboutGross = Number(form.wbout_gross_weight || 0);
        const wboutTare = Number(form.wbout_tare_weight || 0);

        if (isWboutImport && (!form.wbout_gross_weight || wboutGross <= 0)) {
          toast.error('Please provide Gross Wt for IMPORT WBOUT');
          return;
        }

        if (isWboutExport && (!form.wbout_tare_weight || wboutTare <= 0)) {
          toast.error('Please provide Tare Wt for EXPORT WBOUT');
          return;
        }

        const payload = {
          gate_entry_id: selected.id,
          weighment_slip_no: form.weighment_slip_no || '',
          wbout_datetime: form.datetime + ':00',
          gross_weight: isWboutImport ? wboutGross : undefined,
          tare_weight: isWboutExport ? wboutTare : undefined
        };

        await dispatch(recordWboutThunk(payload)).unwrap();
        closeModal();
        toast.success('WBOUT recorded and gate-out completed');
        return;
      }
    } catch (err: any) {
      toast.error(err || 'Failed to record operation');
    }
  };

  // Only show rows where the user has access to that gate operation status
  const wbinQueue = entries.filter((e) => e.status === 'PENDING_WBIN' && canGateOp('PENDING_WBIN'));
  const wboutQueue = entries.filter((e) => {
    if (e.status === 'UNLOADING') return canGateOp('UNLOADING') || canGateOp('PENDING_WBOUT');
    if (e.status === 'PENDING_WBOUT') return canGateOp('PENDING_WBOUT');
    return false;
  });

  const fmt = (v: string | null) => (v ? formatDateTimeIST(v) : '-');

  return (
    <>
      <div className="section-head">
        <span className="section-title">WEIGHBRIDGE TERMINAL</span>
      </div>

      <div className="stat-grid">
        <div className="stat-card" style={{ '--accent-color': 'var(--amber)' } as React.CSSProperties}>
          <div className="stat-val">{wbinQueue.length}</div>
          <div className="stat-label">Pending WBIN</div>
          <div className="stat-badge">
            <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>scale</span>
          </div>
        </div>
        <div className="stat-card" style={{ '--accent-color': 'var(--accent)' } as React.CSSProperties}>
          <div className="stat-val">{wboutQueue.length}</div>
          <div className="stat-label">Pending WBOUT</div>
          <div className="stat-badge">
            <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>logout</span>
          </div>
        </div>
      </div>

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <div className="table-header">
          <span className="table-title">WEIGHBRIDGE QUEUE</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Gate-In No</th>
              <th>Vehicle</th>
              <th>Vessel</th>
              <th>Slip No</th>
              <th>Gate In</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {[...wbinQueue, ...wboutQueue].map((e) => (
              <tr key={e.id}>
                <td className="td-mono">{e.gate_in_no}</td>
                <td className="td-primary">{e.vehicle_no}</td>
                <td style={{ fontSize: 12 }}>{e.vessel_name}</td>
                <td className="font-mono" style={{ fontSize: 12 }}>{e.weighment_slip_no || '-'}</td>
                <td className="font-mono" style={{ fontSize: 11 }}>{fmt(e.gate_in_datetime)}</td>
                <td><StatusBadge status={e.status} /></td>
                <td>
                  <div className="action-group">
                    {e.status === 'PENDING_WBIN' && canGateOp('PENDING_WBIN') && (
                      <Button variant="amber" size="sm" onClick={() => openModal('wbin', e)}>WBIN</Button>
                    )}
                    {e.status === 'UNLOADING' && <span className="tag">Unloading</span>}
                    {e.status === 'PENDING_WBOUT' && canGateOp('PENDING_WBOUT') && (
                      <Button variant="green" size="sm" onClick={() => openModal('wbout', e)}>WBOUT</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {[...wbinQueue, ...wboutQueue].length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="empty">
                    <div className="empty-icon">
                      <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>balance</span>
                    </div>
                    <div className="empty-text">No weighbridge tasks pending</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        
      </div>

      {modal === 'wbin' && selected && (
        <Modal
          title={`WBIN - ${selected.vehicle_no}`}
          onClose={closeModal}
          footer={<Button variant="amber" onClick={() => handleAction('WBIN_DONE')}>RECORD WBIN</Button>}
        >
          <div className="form-grid">
            <Input
              label="Weighment Slip No"
              value={form.weighment_slip_no || ''}
              onChange={(e) => setForm({ ...form, weighment_slip_no: e.target.value })}
            />
            <Input
              label="Direction"
              value={form.direction || ''}
              readOnly
            />
            <Input
              label="WBIN Date & Time"
              type="datetime-local"
              value={form.datetime || ''}
              onChange={(e) => setForm({ ...form, datetime: e.target.value })}
            />
            {isImport && (
              <Input
                label="Tare Wt"
                type="number"
                min={0}
                value={form.tare_weight || ''}
                onChange={(e) => setForm({ ...form, tare_weight: e.target.value })}
              />
            )}
            {isExport && (
              <Input
                label="Gross Wt"
                type="number"
                min={0}
                value={form.gross_weight || ''}
                onChange={(e) => setForm({ ...form, gross_weight: e.target.value })}
              />
            )}
          </div>
        </Modal>
      )}

      {modal === 'wbout' && selected && (
        <Modal
          title={`WBOUT - ${selected.vehicle_no}`}
          onClose={closeModal}
          footer={<Button variant="green" onClick={() => handleAction('COMPLETED')}>RECORD WBOUT</Button>}
        >
          <div className="form-grid">
            <Input
              label="Weighment Slip No"
              value={form.weighment_slip_no || ''}
              onChange={(e) => setForm({ ...form, weighment_slip_no: e.target.value })}
            />
              <Input
                label="Direction"
                value={selected?.direction || ''}
                readOnly
              />
            <Input
              label="WBOUT Date & Time"
              type="datetime-local"
              value={form.datetime || ''}
              onChange={(e) => setForm({ ...form, datetime: e.target.value })}
            />
              {isWboutImport && (
                <Input
                  label="Gross Wt"
                  type="number"
                  min={0}
                  value={form.wbout_gross_weight || ''}
                  onChange={(e) => setForm({ ...form, wbout_gross_weight: e.target.value })}
                />
              )}
              {isWboutExport && (
                <Input
                  label="Tare Wt"
                  type="number"
                  min={0}
                  value={form.wbout_tare_weight || ''}
                  onChange={(e) => setForm({ ...form, wbout_tare_weight: e.target.value })}
                />
              )}
          </div>
        </Modal>
      )}
    </>
  );
};

export default WeighbridgeTerminalPage;
