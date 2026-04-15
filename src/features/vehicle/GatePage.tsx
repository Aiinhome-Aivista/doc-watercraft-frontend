import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addGateEntry, updateGateStatus, fetchGateEntries, createGateEntryThunk, recordCargoOpThunk } from '@/store/slices/vehicleSlice';
import { fetchVessels } from '@/store/slices/vesselSlice';
import { GateEntry, GateStatus } from '@/types/vehicle';
import { Modal, Input, Select, Button, StatusBadge } from '@/components/ui';
import { formatDateTimeIST, getCurrentISTDateTimeLocalValue } from '@/utils/dateTime';

const GatePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const entries = useAppSelector((state) => state.vehicles.entries);
  const vessels = useAppSelector((state) => state.vessels.items);

  useEffect(() => {
    dispatch(fetchGateEntries());
    dispatch(fetchVessels());
  }, [dispatch]);

  const [filter, setFilter] = useState<GateStatus | 'ALL'>('ALL');
  const [modal, setModal] = useState<'create' | 'operation' | null>(null);
  const [selected, setSelected] = useState<GateEntry | null>(null);
  const [form, setForm] = useState<any>({});
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const filtered = filter === 'ALL' ? entries : entries.filter((e) => e.status === filter);
  const mooredVessels = vessels.filter((v) => ['MOORED', 'BERTHED'].includes(v.status));

  const nowDt = () => getCurrentISTDateTimeLocalValue();

  const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const openModal = (type: any, entry: GateEntry | null = null) => {
    setSelected(entry);
    setForm({ datetime: nowDt(), gate_in_datetime: nowDt() });
    setModal(type);
    setAlert(null);
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setForm({});
  };

  const handleVesselChange = (vesselId: string) => {
    const selectedVessel = vessels.find((v) => v.id === Number(vesselId));
    setForm({
      ...form,
      vessel_id: vesselId,
      direction: selectedVessel?.direction || '',
      consignor_name: selectedVessel?.party_name || 'Poddar Imports',
    });
  };

  const handleCreate = async () => {
    if (!form.vessel_id) {
        showAlert('Please select a vessel', 'error');
        return;
    }
    const ownWb = parseInt(form.own_weighbridge || '0') as 0 | 1;
    const grossWeight = Number(form.gross_weight || 0);

    if (ownWb === 1 && grossWeight <= 0) {
      showAlert('Please enter gross weight for own weighbridge gate-in', 'error');
      return;
    }

    const payload = {
      vessel_id: parseInt(form.vessel_id),
      consignor_name: form.consignor_name || '',
      challan_invoice_no: form.challan_invoice_no || '',
      vehicle_no: form.vehicle_no || '',
      transporter_name: form.transporter_name || '',
      weighment_slip_no: form.weighment_slip_no || '',
      own_weighbridge: ownWb,
      gross_weight: ownWb === 1 ? grossWeight : undefined,
      gate_in_datetime: form.gate_in_datetime + ':00',
    };

    try {
      await dispatch(createGateEntryThunk(payload)).unwrap();
      closeModal();
      showAlert('Gate-In recorded successfully');
    } catch (err: any) {
      showAlert(err || 'Failed to record Gate-In', 'error');
    }
  };

  const handleAction = async (status: GateStatus) => {
    if (!selected) return;
    
    try {
      if (status === 'UNLOADING' || status === 'PENDING_WBOUT') {
        const payload = {
          gate_entry_id: selected.id,
          operation_type: form.op_type || 'UNLOADING',
          start_datetime: form.datetime ? form.datetime + ':00' : '',
          end_datetime: form.end_datetime ? form.end_datetime + ':00' : '',
          compressor_no: form.compressor_no || '',
          remarks: form.remarks || ''
        };
        await dispatch(recordCargoOpThunk(payload)).unwrap();
        closeModal();
        showAlert('Cargo operation recorded successfully');
        return;
      }
    } catch (err: any) {
      showAlert(err || 'Failed to record operation', 'error');
    }
  };

  const fmt = (v: string | null) => (v ? formatDateTimeIST(v) : '—');

  return (
    <>
      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}
      <div className="section-head">
        <span className="section-title">VEHICLE GATE MANAGEMENT</span>
        <Button variant="light" onClick={() => openModal('create')}>+ GATE IN</Button>
      </div>

      <div className="stat-card" style={{ marginBottom: 16, "--accent-color": "var(--accent)" } as React.CSSProperties}>
        <div className="stat-label">Weighbridge operations are managed in the dedicated Weighbridge Terminal page.</div>
      </div>

      <div className="filter-bar">
        {['ALL', 'PENDING_WBIN', 'WBIN_DONE', 'LOADING/UNLOADING', 'PENDING_WBOUT', 'COMPLETED'].map((s) => (
          <button
            key={s}
            className={`filter-tab ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s as any)}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Gate-In No</th>
              <th>Vehicle</th>
              <th>Vessel</th>
              <th>Consignor</th>
              <th>Challan</th>
              <th>Transporter</th>
              <th>Gate In</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty">
                    <div className="empty-icon"><span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>local_shipping</span></div>
                    <div className="empty-text">No entries found</div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id}>
                  <td className="td-mono">{e.gate_in_no}</td>
                  <td className="td-primary">{e.vehicle_no}</td>
                  <td style={{ fontSize: 12 }}>{e.vessel_name}</td>
                  <td style={{ fontSize: 12 }}>{e.consignor_name}</td>
                  <td className="font-mono" style={{ fontSize: 12 }}>{e.challan_invoice_no}</td>
                  <td style={{ fontSize: 12 }}>{e.transporter_name || '—'}</td>
                  <td className="font-mono" style={{ fontSize: 11 }}>{fmt(e.gate_in_datetime)}</td>
                  <td><StatusBadge status={e.status} /></td>
                  <td>
                    <div className="action-group">
                      {e.status === 'WBIN_DONE' && (
                        <Button variant="primary" size="sm" onClick={() => openModal('operation', e)}>RECORD OP</Button>
                      )}
                      {e.status === 'PENDING_WBIN' && <span className="tag">Awaiting WBIN</span>}
                      {(e.status === 'UNLOADING' || e.status === 'PENDING_WBOUT') && <span className="tag">Awaiting WBOUT</span>}
                      {e.status === 'COMPLETED' && <span style={{ fontSize: 11, color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span> Done</span>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal === 'create' && (
        <Modal
          title="NEW GATE ENTRY"
          onClose={closeModal}
          footer={
            <>
              <Button variant="ghost" onClick={closeModal}>CANCEL</Button>
              <Button onClick={handleCreate}>CONFIRM GATE-IN</Button>
            </>
          }
        >
          <div className="form-grid">
            <Select label="Vessel (Moored/Berthed)" value={form.vessel_id || ''} onChange={(e) => handleVesselChange(e.target.value)} 
              options={[{ value: '', label: 'Select Vessel' }, ...mooredVessels.map(v => ({ value: v.id, label: v.vessel_name }))]} />
            <Input label="Direction" value={form.direction || ''} readOnly />
            <Input label="Gate-In Date & Time" type="datetime-local" value={form.gate_in_datetime || ''} onChange={(e) => setForm({ ...form, gate_in_datetime: e.target.value })} />
            <Input label="Consignor Name" value={form.consignor_name || ''} onChange={(e) => setForm({ ...form, consignor_name: e.target.value })} />
            <Input label="Challan / Invoice No" value={form.challan_invoice_no || ''} onChange={(e) => setForm({ ...form, challan_invoice_no: e.target.value })} />
            <Input label="Vehicle No" value={form.vehicle_no || ''} onChange={(e) => setForm({ ...form, vehicle_no: e.target.value })} />
            <Input label="Transporter Name" value={form.transporter_name || ''} onChange={(e) => setForm({ ...form, transporter_name: e.target.value })} />
            <Input label="Weighment Slip No" value={form.weighment_slip_no || ''} onChange={(e) => setForm({ ...form, weighment_slip_no: e.target.value })} />
            <Select label="Own Weighbridge? (≥60T skips WBIN)" value={form.own_weighbridge || '0'} onChange={(e) => setForm({ ...form, own_weighbridge: e.target.value })}
              options={[{ value: '0', label: 'No — Needs WBIN' }, { value: '1', label: 'Yes — Skip to WBOUT' }]} />
            {form.own_weighbridge === '1' && (
              <Input
                label="Gross Weight"
                type="number"
                value={form.gross_weight || ''}
                onChange={(e) => setForm({ ...form, gross_weight: e.target.value })}
              />
            )}
          </div>
        </Modal>
      )}

      {modal === 'operation' && selected && (
        <Modal title={`CARGO OPERATION — ${selected.vehicle_no}`} onClose={closeModal} footer={<Button variant="primary" onClick={() => handleAction('PENDING_WBOUT')}>RECORD OPERATION</Button>}>
          <div className="form-grid">
            <Select label="Operation Type" value={form.op_type || 'UNLOADING'} onChange={(e) => setForm({ ...form, op_type: e.target.value })} options={[{ value: 'UNLOADING', label: 'Unloading' }, { value: 'LOADING', label: 'Loading' }]} />
            <Input label="Start Date & Time" type="datetime-local" value={form.datetime || ''} onChange={(e) => setForm({ ...form, datetime: e.target.value })} />
            <Input label="End Date & Time" type="datetime-local" value={form.end_datetime || ''} onChange={(e) => setForm({ ...form, end_datetime: e.target.value })} />
            <Input label="Compressor No" value={form.compressor_no || ''} onChange={(e) => setForm({ ...form, compressor_no: e.target.value })} />
            <Input label="Remarks" value={form.remarks || ''} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
          </div>
        </Modal>
      )}
    </>
  );
};

export default GatePage;
