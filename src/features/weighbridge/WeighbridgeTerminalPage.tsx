import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchGateEntries, recordWbinThunk, recordWboutThunk } from '@/store/slices/vehicleSlice';
import { fetchVessels } from '@/store/slices/vesselSlice';
import { GateEntry } from '@/types/vehicle';
import { Modal, Input, Button, StatusBadge } from '@/components/ui';

const WeighbridgeTerminalPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const entries = useAppSelector((state) => state.vehicles.entries);

  useEffect(() => {
    dispatch(fetchGateEntries());
    dispatch(fetchVessels());
  }, [dispatch]);

  const [modal, setModal] = useState<'wbin' | 'wbout' | null>(null);
  const [selected, setSelected] = useState<GateEntry | null>(null);
  const [form, setForm] = useState<{
    datetime?: string;
    weighment_slip_no?: string;
    gross_weight?: string;
    tare_weight?: string;
    wbout_gross_weight?: string;
    wbout_tare_weight?: string;
  }>({});
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const nowDt = () => new Date().toISOString().slice(0, 16);

  const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const openModal = (type: 'wbin' | 'wbout', entry: GateEntry) => {
    setSelected(entry);
    setForm({
      datetime: nowDt(),
      weighment_slip_no: entry.weighment_slip_no || '',
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
  const netWeight = grossWeight - tareWeight;

  const handleAction = async (status: 'WBIN_DONE' | 'COMPLETED') => {
    if (!selected || !form.datetime) {
      showAlert('Please provide weighbridge date and time', 'error');
      return;
    }

    try {
      if (status === 'WBIN_DONE') {
        if (!form.gross_weight || !form.tare_weight) {
          showAlert('Please provide Gross Wt and Tare Wt for WBIN', 'error');
          return;
        }

        if (netWeight <= 0) {
          showAlert('Gross Wt must be greater than Tare Wt', 'error');
          return;
        }

        const payload = {
          gate_entry_id: selected.id,
          weighment_slip_no: form.weighment_slip_no || '',
          wbin_datetime: form.datetime + ':00',
          gross_weight: grossWeight,
          tare_weight: tareWeight
        };

        await dispatch(recordWbinThunk(payload)).unwrap();
        closeModal();
        showAlert('WBIN recorded successfully');
        return;
      }

      if (status === 'COMPLETED') {

        const wboutGross = Number(form.wbout_gross_weight || 0);
        const wboutTare = Number(form.wbout_tare_weight || 0);

        if (!form.wbout_gross_weight || wboutGross <= 0) {
          showAlert('Please provide Gross Weight for WBOUT', 'error');
          return;
        }
        if (!form.wbout_tare_weight || wboutTare <= 0) {
          showAlert('Please provide Tare Weight for WBOUT', 'error');
          return;
        }

        const payload = {
          gate_entry_id: selected.id,
          weighment_slip_no: form.weighment_slip_no || '',
          wbout_datetime: form.datetime + ':00',
          gross_weight: wboutGross,
          tare_weight: wboutTare
        };

        await dispatch(recordWboutThunk(payload)).unwrap();
        closeModal();
        showAlert('WBOUT recorded and gate-out completed');
        return;
      }
    } catch (err: any) {
      showAlert(err || 'Failed to record operation', 'error');
    }
  };

  const wbinQueue = entries.filter((e) => e.status === 'PENDING_WBIN');
  const wboutQueue = entries.filter((e) => e.status === 'UNLOADING' || e.status === 'PENDING_WBOUT');

  const fmt = (v: string | null) => (v ? new Date(v).toLocaleString('en-IN') : '-');

  return (
    <>
      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

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
                    {e.status === 'PENDING_WBIN' && (
                      <Button variant="amber" size="sm" onClick={() => openModal('wbin', e)}>WBIN</Button>
                    )}
                    {e.status === 'UNLOADING' && <span className="tag">Unloading</span>}
                    {e.status === 'PENDING_WBOUT' && (
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
              label="WBIN Date & Time"
              type="datetime-local"
              value={form.datetime || ''}
              onChange={(e) => setForm({ ...form, datetime: e.target.value })}
            />
            <Input
              label="Gross Wt"
              type="number"
              min={0}
              value={form.gross_weight || ''}
              onChange={(e) => setForm({ ...form, gross_weight: e.target.value })}
            />
            <Input
              label="Tare Wt"
              type="number"
              min={0}
              value={form.tare_weight || ''}
              onChange={(e) => setForm({ ...form, tare_weight: e.target.value })}
            />
            <Input
              label="Net Wt"
              type="number"
              value={Number.isFinite(netWeight) && netWeight > 0 ? netWeight : 0}
              readOnly
            />
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
              label="WBOUT Date & Time"
              type="datetime-local"
              value={form.datetime || ''}
              onChange={(e) => setForm({ ...form, datetime: e.target.value })}
            />
            <Input
              label="Gross Weight (kg)"
              type="number"
              min={0}
              value={form.wbout_gross_weight || ''}
              onChange={(e) => setForm({ ...form, wbout_gross_weight: e.target.value })}
            />
            <Input
              label="Tare Weight (kg)"
              type="number"
              min={0}
              value={form.wbout_tare_weight || ''}
              onChange={(e) => setForm({ ...form, wbout_tare_weight: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </>
  );
};

export default WeighbridgeTerminalPage;
