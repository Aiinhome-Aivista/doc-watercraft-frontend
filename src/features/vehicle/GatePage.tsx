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

  const handleCreate = async () => {
    if (!form.vessel_id) {
        showAlert('Please select a vessel', 'error');
        return;
    }
    const ownWb = parseInt(form.own_weighbridge || '0') as 0 | 1;
    const payload = {
      vessel_id: parseInt(form.vessel_id),
      consignor_name: form.consignor_name || '',
      challan_invoice_no: form.challan_invoice_no || '',
      vehicle_no: form.vehicle_no || '',
      transporter_name: form.transporter_name || '',
      weighment_slip_no: form.weighment_slip_no || '',
      own_weighbridge: ownWb,
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
      {alert && (
        <div
          className={`mb-4 border-l-4 px-4 py-2.5 text-sm ${
            alert.type === 'success'
              ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-400 bg-rose-500/10 text-rose-300'
          }`}
        >
          {alert.msg}
        </div>
      )}
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-lg font-bold tracking-[0.08em] text-slate-100 [font-family:'Barlow_Condensed',sans-serif]">VEHICLE GATE MANAGEMENT</span>
        <Button variant="light" onClick={() => openModal('create')}>+ GATE IN</Button>
      </div>

      <div
        className="relative mb-4 overflow-hidden border border-slate-800 bg-slate-950 p-4 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-cyan-400"
      >
        <div className="text-[10px] uppercase tracking-[0.15em] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">
          Weighbridge operations are managed in the dedicated Weighbridge Terminal page.
        </div>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto whitespace-nowrap pb-1">
        {['ALL', 'PENDING_WBIN', 'WBIN_DONE', 'UNLOADING', 'PENDING_WBOUT', 'COMPLETED'].map((s) => (
          <button
            key={s}
            className={`border px-3.5 py-1.5 text-[11px] uppercase tracking-[0.1em] transition-colors [font-family:'IBM_Plex_Mono',monospace] ${
              filter === s
                ? 'border-cyan-600 bg-cyan-500/10 text-cyan-300'
                : 'border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
            }`}
            onClick={() => setFilter(s as any)}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border border-slate-800 bg-slate-950">
        <table className="w-full min-w-[980px] border-collapse [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-[10px] [&_th]:font-normal [&_th]:uppercase [&_th]:tracking-[0.15em] [&_th]:text-slate-500 [&_th]:[font-family:'IBM_Plex_Mono',monospace] [&_thead_tr]:border-b [&_thead_tr]:border-slate-800 [&_td]:border-b [&_td]:border-slate-800 [&_td]:px-4 [&_td]:py-2.5 [&_td]:text-[13px] [&_td]:text-slate-300 [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-white/[0.02]">
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
                  <div className="px-5 py-14 text-center text-slate-500">
                    <div className="mb-3 text-[40px] opacity-30"><span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>local_shipping</span></div>
                    <div className="text-xs uppercase tracking-[0.1em] [font-family:'IBM_Plex_Mono',monospace]">No entries found</div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id}>
                  <td className="text-cyan-300 [font-family:'IBM_Plex_Mono',monospace]">{e.gate_in_no}</td>
                  <td className="font-medium text-slate-100">{e.vehicle_no}</td>
                  <td className="text-xs">{e.vessel_name}</td>
                  <td className="text-xs">{e.consignor_name}</td>
                  <td className="text-xs [font-family:'IBM_Plex_Mono',monospace]">{e.challan_invoice_no}</td>
                  <td className="text-xs">{e.transporter_name || '—'}</td>
                  <td className="text-[11px] [font-family:'IBM_Plex_Mono',monospace]">{fmt(e.gate_in_datetime)}</td>
                  <td><StatusBadge status={e.status} /></td>
                  <td>
                    <div className="flex flex-wrap gap-1.5">
                      {e.status === 'WBIN_DONE' && (
                        <Button variant="primary" size="sm" onClick={() => openModal('operation', e)}>RECORD OP</Button>
                      )}
                      {e.status === 'PENDING_WBIN' && <span className="inline-block border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] tracking-[0.05em] text-cyan-300 [font-family:'IBM_Plex_Mono',monospace]">Awaiting WBIN</span>}
                      {(e.status === 'UNLOADING' || e.status === 'PENDING_WBOUT') && <span className="inline-block border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] tracking-[0.05em] text-cyan-300 [font-family:'IBM_Plex_Mono',monospace]">Awaiting WBOUT</span>}
                      {e.status === 'COMPLETED' && <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300"><span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span> Done</span>}
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Select label="Vessel (Moored/Berthed)" value={form.vessel_id || ''} onChange={(e) => setForm({ ...form, vessel_id: e.target.value })} 
              options={[{ value: '', label: 'Select Vessel' }, ...mooredVessels.map(v => ({ value: v.id, label: v.vessel_name }))]} />
            <Input label="Gate-In Date & Time" type="datetime-local" value={form.gate_in_datetime || ''} onChange={(e) => setForm({ ...form, gate_in_datetime: e.target.value })} />
            <Input label="Consignor Name" value={form.consignor_name || ''} onChange={(e) => setForm({ ...form, consignor_name: e.target.value })} />
            <Input label="Challan / Invoice No" value={form.challan_invoice_no || ''} onChange={(e) => setForm({ ...form, challan_invoice_no: e.target.value })} />
            <Input label="Vehicle No" value={form.vehicle_no || ''} onChange={(e) => setForm({ ...form, vehicle_no: e.target.value })} />
            <Input label="Transporter Name" value={form.transporter_name || ''} onChange={(e) => setForm({ ...form, transporter_name: e.target.value })} />
            <Input label="Weighment Slip No" value={form.weighment_slip_no || ''} onChange={(e) => setForm({ ...form, weighment_slip_no: e.target.value })} />
            <Select label="Own Weighbridge? (≥60T skips WBIN)" value={form.own_weighbridge || '0'} onChange={(e) => setForm({ ...form, own_weighbridge: e.target.value })}
              options={[{ value: '0', label: 'No — Needs WBIN' }, { value: '1', label: 'Yes — Skip to WBOUT' }]} />
          </div>
        </Modal>
      )}

      {modal === 'operation' && selected && (
        <Modal title={`CARGO OPERATION — ${selected.vehicle_no}`} onClose={closeModal} footer={<Button variant="primary" onClick={() => handleAction('PENDING_WBOUT')}>RECORD OPERATION</Button>}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
