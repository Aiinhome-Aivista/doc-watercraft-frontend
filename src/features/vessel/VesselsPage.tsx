import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addVessel, updateVesselStatus, updateSurveyReport, fetchVessels, createVesselThunk, berthVesselThunk, moorVesselThunk, surveyVesselThunk, unberthVesselThunk } from '@/store/slices/vesselSlice';
import { Vessel, VesselStatus } from '@/types/vessel';
import { Modal, Input, Select, Button, StatusBadge } from '@/components/ui';
import { formatDateTimeIST, getCurrentISTDateTimeLocalValue, getCurrentISTDateValue } from '@/utils/dateTime';

const VesselsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const vessels = useAppSelector((state) => state.vessels.items);
  const loading = useAppSelector((state) => state.vessels.loading);

  useEffect(() => {
    dispatch(fetchVessels());
  }, [dispatch]);

  const [filter, setFilter] = useState<VesselStatus | 'ALL'>('ALL');
  const [modal, setModal] = useState<'create' | 'berth' | 'moor' | 'survey' | 'unberth' | 'detail' | null>(null);
  const [selected, setSelected] = useState<Vessel | null>(null);
  const [form, setForm] = useState<any>({});
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const filtered = filter === 'ALL' ? vessels : vessels.filter((v) => v.status === filter);

  const nowDt = () => getCurrentISTDateTimeLocalValue();

  const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const openModal = (type: any, vessel: Vessel | null = null) => {
    setSelected(vessel);
    setForm({ datetime: nowDt() });
    setModal(type);
    setAlert(null);
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setForm({});
  };

  const handleCreate = async () => {
    if (!form.vessel_name || !form.party_name) {
      showAlert('Vessel name and Party name are required', 'error');
      return;
    }
    
    const payload = {
      vessel_name: form.vessel_name,
      party_name: form.party_name,
      cargo_type: form.cargo_type || 'FLYASH',
      quantity: parseFloat(form.quantity) || 0,
      direction: form.direction as any || 'IMPORT',
      expected_date: form.expected_date || getCurrentISTDateValue(),
    };

    try {
      await dispatch(createVesselThunk(payload)).unwrap();
      closeModal();
      showAlert(`Vessel ${payload.vessel_name} created successfully`);
    } catch (err: any) {
      showAlert(err || 'Failed to create vessel', 'error');
    }
  };

  const handleAction = async (action: string) => {
    if (!selected) return;

    try {
      if (action === 'berth') {
        const datetime = form.datetime + ':00';
        await dispatch(berthVesselThunk({ id: selected.id, payload: { berthing_datetime: datetime } })).unwrap();
        showAlert('Berthing operation recorded successfully');
      } else if (action === 'moor') {
        const datetime = form.datetime + ':00';
        await dispatch(moorVesselThunk({ id: selected.id, payload: { mooring_datetime: datetime } })).unwrap();
        showAlert('Mooring operation recorded successfully');
      } else if (action === 'survey') {
        const datetime = form.datetime + ':00';
        const qty = parseFloat(form.survey_quantity) || 0;
        await dispatch(surveyVesselThunk({ id: selected.id, payload: { survey_datetime: datetime, survey_quantity: qty } })).unwrap();
        showAlert('Survey operation recorded successfully');
      } else if (action === 'unberth') {
        const datetime = form.datetime + ':00';
        await dispatch(unberthVesselThunk({ id: selected.id, payload: { sailing_datetime: datetime } })).unwrap();
        showAlert('Unberthing operation recorded successfully');
      }

      closeModal();
    } catch (err: any) {
      showAlert(err || 'Operation failed', 'error');
    }
  };

  const fmt = (v: string | null | undefined) => (v ? formatDateTimeIST(v) : '—');
  
  const fmtNum = (n: number | string | null | undefined) => n != null ? Number(n).toLocaleString('en-IN') : '—';

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
        <span className="text-lg font-bold tracking-[0.08em] text-slate-100 [font-family:'Barlow_Condensed',sans-serif]">VESSEL MANAGEMENT</span>
        <Button variant="light" onClick={() => openModal('create')}>+ NEW VESSEL</Button>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto whitespace-nowrap pb-1">
        {['ALL', 'PLANNED', 'BERTHED', 'MOORED', 'COMPLETED'].map((s) => (
          <button
            key={s}
            className={`border px-3.5 py-1.5 text-[11px] uppercase tracking-[0.1em] transition-colors [font-family:'IBM_Plex_Mono',monospace] ${
              filter === s
                ? 'border-cyan-600 bg-cyan-500/10 text-cyan-300'
                : 'border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
            }`}
            onClick={() => setFilter(s as any)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border border-slate-800 bg-slate-950">
        <table className="w-full min-w-[900px] border-collapse [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-[10px] [&_th]:font-normal [&_th]:uppercase [&_th]:tracking-[0.15em] [&_th]:text-slate-500 [&_th]:[font-family:'IBM_Plex_Mono',monospace] [&_thead_tr]:border-b [&_thead_tr]:border-slate-800 [&_td]:border-b [&_td]:border-slate-800 [&_td]:px-4 [&_td]:py-2.5 [&_td]:text-[13px] [&_td]:text-slate-300 [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-white/[0.02]">
          <thead>
            <tr>
              <th>Auto ID</th>
              <th>Vessel Name</th>
              <th>Party</th>
              <th>Cargo</th>
              <th>Qty (MT)</th>
              <th>Direction</th>
              <th>Expected</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="px-5 py-14 text-center text-slate-500">
                    <div className="mb-3 text-[40px] opacity-30"><span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>anchor</span></div>
                    <div className="text-xs uppercase tracking-[0.1em] [font-family:'IBM_Plex_Mono',monospace]">No vessels found</div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.id}>
                  <td className="text-cyan-300 [font-family:'IBM_Plex_Mono',monospace]">{v.vessel_auto_id}</td>
                  <td className="font-medium text-slate-100">{v.vessel_name}</td>
                  <td className="max-w-[150px] truncate">{v.party_name}</td>
                  <td><span className="inline-block border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] tracking-[0.05em] text-cyan-300 [font-family:'IBM_Plex_Mono',monospace]">{v.cargo_type}</span></td>
                  <td className="[font-family:'IBM_Plex_Mono',monospace]">{fmtNum(v.survey_quantity || v.quantity)}</td>
                  <td>{v.direction}</td>
                  <td className="text-xs [font-family:'IBM_Plex_Mono',monospace]">{v.expected_date}</td>
                  <td><StatusBadge status={v.status} /></td>
                  <td>
                    <div className="flex flex-wrap gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => openModal('detail', v)}>VIEW</Button>
                      {v.status === 'PLANNED' && (
                        <Button variant="amber" size="sm" onClick={() => openModal('berth', v)}>BERTH</Button>
                      )}
                      {v.status === 'BERTHED' && (
                        <Button variant="light" size="sm" onClick={() => openModal('moor', v)}>MOOR</Button>
                      )}
                      {v.status === 'MOORED' && (
                        <Button variant="ghost" size="sm" onClick={() => openModal('survey', v)}>SURVEY</Button>
                      )}
                      {['BERTHED', 'MOORED'].includes(v.status) && (
                        <Button variant="green" size="sm" onClick={() => openModal('unberth', v)}>UNBERTH</Button>
                      )}
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
          title="REGISTER NEW VESSEL"
          onClose={closeModal}
          footer={
            <>
              <Button variant="ghost" onClick={closeModal}>CANCEL</Button>
              <Button onClick={handleCreate}>CREATE VESSEL</Button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input label="Vessel Name" placeholder="M.V. Example" value={form.vessel_name || ''} onChange={(e) => setForm({ ...form, vessel_name: e.target.value })} />
            <Input label="Party Name" placeholder="Party / Client Name" value={form.party_name || ''} onChange={(e) => setForm({ ...form, party_name: e.target.value })} />
            <Input label="Cargo Type" placeholder="FLYASH / COAL / etc." value={form.cargo_type || ''} onChange={(e) => setForm({ ...form, cargo_type: e.target.value })} />
            <Input label="Expected Quantity (MT)" type="number" placeholder="0.00" value={form.quantity || ''} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <Select label="Direction" value={form.direction || 'IMPORT'} onChange={(e) => setForm({ ...form, direction: e.target.value })} options={[{ value: 'IMPORT', label: 'Import' }, { value: 'EXPORT', label: 'Export' }]} />
            <Input label="Expected Date" type="date" value={form.expected_date || ''} onChange={(e) => setForm({ ...form, expected_date: e.target.value })} />
          </div>
        </Modal>
      )}

      {modal === 'berth' && selected && (
        <Modal
          title={`BERTH — ${selected.vessel_name}`}
          onClose={closeModal}
          footer={
            <>
              <Button variant="ghost" onClick={closeModal}>CANCEL</Button>
              <Button variant="amber" onClick={() => handleAction('berth')}>CONFIRM BERTHING</Button>
            </>
          }
        >
          <Input label="Date & Time of Berthing" type="datetime-local" value={form.datetime || ''} onChange={(e) => setForm({ ...form, datetime: e.target.value })} />
        </Modal>
      )}

      {modal === 'moor' && selected && (
        <Modal
          title={`MOOR — ${selected.vessel_name}`}
          onClose={closeModal}
          footer={
            <>
              <Button variant="ghost" onClick={closeModal}>CANCEL</Button>
              <Button variant="primary" onClick={() => handleAction('moor')}>CONFIRM MOORING</Button>
            </>
          }
        >
          <Input label="Date & Time of Mooring" type="datetime-local" value={form.datetime || ''} onChange={(e) => setForm({ ...form, datetime: e.target.value })} />
        </Modal>
      )}

      {modal === 'survey' && selected && (
        <Modal
          title={`SURVEY REPORT — ${selected.vessel_name}`}
          onClose={closeModal}
          footer={
            <>
              <Button variant="ghost" onClick={closeModal}>CANCEL</Button>
              <Button variant="primary" onClick={() => handleAction('survey')}>SAVE SURVEY</Button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input label="Survey Quantity (MT)" type="number" step="0.01" placeholder="0.00" value={form.survey_quantity || ''} onChange={(e) => setForm({ ...form, survey_quantity: e.target.value })} />
            <Input label="Survey Date & Time" type="datetime-local" value={form.datetime || ''} onChange={(e) => setForm({ ...form, datetime: e.target.value })} />
          </div>
        </Modal>
      )}

      {modal === 'unberth' && selected && (
        <Modal
          title={`UNBERTH — ${selected.vessel_name}`}
          onClose={closeModal}
          footer={
            <>
              <Button variant="ghost" onClick={closeModal}>CANCEL</Button>
              <Button variant="green" onClick={() => handleAction('unberth')}>CONFIRM UNBERTHING</Button>
            </>
          }
        >
          <Input label="Date & Time of Sailing / Unberthing" type="datetime-local" value={form.datetime || ''} onChange={(e) => setForm({ ...form, datetime: e.target.value })} />
        </Modal>
      )}

      {modal === 'detail' && selected && (
        <Modal
          title={`VESSEL DETAILS — ${selected.vessel_auto_id}`}
          onClose={closeModal}
          footer={<Button variant="ghost" onClick={closeModal}>CLOSE</Button>}
        >
          <div className="mb-5 grid grid-cols-1 gap-px bg-slate-800 md:grid-cols-2">
            {[
              ['Vessel Name', selected.vessel_name],
              ['Auto ID', selected.vessel_auto_id, true],
              ['Party', selected.party_name],
              ['Cargo Type', selected.cargo_type],
              ['Direction', selected.direction],
              ['Expected Qty', `${fmtNum(selected.quantity)} MT`],
              ['Survey Qty', selected.survey_quantity ? `${fmtNum(selected.survey_quantity)} MT` : '—'],
              ['Status', null, false, selected.status],
              ['Expected Date', selected.expected_date, true],
              ['Berthing', fmt(selected.berthing_datetime), true],
              ['Mooring', fmt(selected.mooring_datetime), true],
              ['Sailing', fmt(selected.sailing_datetime), true],
            ].map(([k, v, mono, status]: any) => (
              <div className="bg-slate-950 px-4 py-3" key={k}>
                <div className="mb-1 text-[10px] uppercase tracking-[0.1em] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">{k}</div>
                {status ? (
                  <StatusBadge status={status} />
                ) : (
                  <div className={`text-[13px] font-medium ${mono ? "text-cyan-300 [font-family:'IBM_Plex_Mono',monospace]" : 'text-slate-100'}`}>{v}</div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-5">
            <div className="mb-2.5 text-[10px] uppercase tracking-[0.1em] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">WORKFLOW TIMELINE</div>
            <div className="flex flex-col">
              {[
                { label: 'Vessel Planned', time: selected.expected_date, done: true, icon: 'assignment' },
                { label: 'Berthed', time: fmt(selected.berthing_datetime), done: !!selected.berthing_datetime, active: selected.status === 'BERTHED', icon: 'anchor' },
                { label: 'Moored', time: fmt(selected.mooring_datetime), done: !!selected.mooring_datetime, active: selected.status === 'MOORED', icon: 'link' },
                { label: 'Survey Complete', time: fmt(selected.survey_datetime), done: !!selected.survey_datetime, icon: 'analytics' },
                { label: 'Unberthed / Completed', time: fmt(selected.sailing_datetime), done: !!selected.sailing_datetime, icon: 'sailing' },
              ].map((step) => (
                <div className="flex items-start gap-3.5 border-b border-slate-800 py-3.5 last:border-b-0" key={step.label}>
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm ${
                      step.done
                        ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300'
                        : step.active
                          ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300 animate-pulse'
                          : 'border-slate-700 bg-slate-900 text-slate-500'
                    }`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>{step.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-[15px] font-semibold tracking-[0.03em] text-slate-100 [font-family:'Barlow_Condensed',sans-serif]">{step.label}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">{step.time || 'Pending'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default VesselsPage;
