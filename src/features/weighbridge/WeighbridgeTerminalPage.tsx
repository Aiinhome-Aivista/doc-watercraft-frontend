import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchGateEntries, recordWbinThunk, recordWboutThunk } from '@/store/slices/vehicleSlice';
import { fetchVessels } from '@/store/slices/vesselSlice';
import { GateEntry } from '@/types/vehicle';
import { Modal, Input, Button, StatusBadge } from '@/components/ui';
import { formatDateTimeIST, getCurrentISTDateTimeLocalValue } from '@/utils/dateTime';

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

  const nowDt = () => getCurrentISTDateTimeLocalValue();

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

  const fmt = (v: string | null) => (v ? formatDateTimeIST(v) : '-');

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
        <span className="text-lg font-bold tracking-[0.08em] text-slate-100 [font-family:'Barlow_Condensed',sans-serif]">WEIGHBRIDGE TERMINAL</span>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="relative overflow-hidden border border-slate-800 bg-slate-950 p-4 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-amber-400">
          <div className="text-[32px] font-bold leading-none text-slate-100 [font-family:'Barlow_Condensed',sans-serif]">{wbinQueue.length}</div>
          <div className="mt-1.5 text-[10px] uppercase tracking-[0.15em] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">Pending WBIN</div>
          <div className="absolute right-3 top-3 text-xl opacity-20">
            <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>scale</span>
          </div>
        </div>
        <div className="relative overflow-hidden border border-slate-800 bg-slate-950 p-4 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-cyan-400">
          <div className="text-[32px] font-bold leading-none text-slate-100 [font-family:'Barlow_Condensed',sans-serif]">{wboutQueue.length}</div>
          <div className="mt-1.5 text-[10px] uppercase tracking-[0.15em] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">Pending WBOUT</div>
          <div className="absolute right-3 top-3 text-xl opacity-20">
            <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>logout</span>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto border border-slate-800 bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
          <span className="text-base font-bold tracking-[0.08em] text-slate-100 [font-family:'Barlow_Condensed',sans-serif]">WEIGHBRIDGE QUEUE</span>
        </div>
        <table className="w-full min-w-[840px] border-collapse [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-[10px] [&_th]:font-normal [&_th]:uppercase [&_th]:tracking-[0.15em] [&_th]:text-slate-500 [&_th]:[font-family:'IBM_Plex_Mono',monospace] [&_thead_tr]:border-b [&_thead_tr]:border-slate-800 [&_td]:border-b [&_td]:border-slate-800 [&_td]:px-4 [&_td]:py-2.5 [&_td]:text-[13px] [&_td]:text-slate-300 [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-white/[0.02]">
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
                <td className="text-cyan-300 [font-family:'IBM_Plex_Mono',monospace]">{e.gate_in_no}</td>
                <td className="font-medium text-slate-100">{e.vehicle_no}</td>
                <td className="text-xs">{e.vessel_name}</td>
                <td className="text-xs [font-family:'IBM_Plex_Mono',monospace]">{e.weighment_slip_no || '-'}</td>
                <td className="text-[11px] [font-family:'IBM_Plex_Mono',monospace]">{fmt(e.gate_in_datetime)}</td>
                <td><StatusBadge status={e.status} /></td>
                <td>
                  <div className="flex flex-wrap gap-1.5">
                    {e.status === 'PENDING_WBIN' && (
                      <Button variant="amber" size="sm" onClick={() => openModal('wbin', e)}>WBIN</Button>
                    )}
                    {e.status === 'UNLOADING' && <span className="inline-block border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] tracking-[0.05em] text-cyan-300 [font-family:'IBM_Plex_Mono',monospace]">Unloading</span>}
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
                  <div className="px-5 py-14 text-center text-slate-500">
                    <div className="mb-3 text-[40px] opacity-30">
                      <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>balance</span>
                    </div>
                    <div className="text-xs uppercase tracking-[0.1em] [font-family:'IBM_Plex_Mono',monospace]">No weighbridge tasks pending</div>
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
