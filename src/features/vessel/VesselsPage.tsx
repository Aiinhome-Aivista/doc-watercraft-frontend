import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addVessel, updateVesselStatus, updateSurveyReport } from '@/store/slices/vesselSlice';
import { Vessel, VesselStatus } from '@/types/vessel';
import { Modal, Input, Select, Button, StatusBadge } from '@/components/ui';

const VesselsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const vessels = useAppSelector((state) => state.vessels.items);

  const [filter, setFilter] = useState<VesselStatus | 'ALL'>('ALL');
  const [modal, setModal] = useState<'create' | 'berth' | 'moor' | 'survey' | 'unberth' | 'detail' | null>(null);
  const [selected, setSelected] = useState<Vessel | null>(null);
  const [form, setForm] = useState<any>({});
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const filtered = filter === 'ALL' ? vessels : vessels.filter((v) => v.status === filter);

  const nowDt = () => new Date().toISOString().slice(0, 16);

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

  const handleCreate = () => {
    if (!form.vessel_name || !form.party_name) {
      showAlert('Vessel name and Party name are required', 'error');
      return;
    }
    const newVessel: Vessel = {
      id: vessels.length + 1,
      vessel_auto_id: `VSL-2026-${String(vessels.length + 1).padStart(4, '0')}`,
      vessel_name: form.vessel_name,
      party_name: form.party_name,
      cargo_type: form.cargo_type || 'FLYASH',
      quantity: parseFloat(form.quantity) || 0,
      direction: form.direction as any || 'IMPORT',
      status: 'PLANNED',
      expected_date: form.expected_date || new Date().toISOString().slice(0, 10),
      berthing_datetime: null,
      mooring_datetime: null,
      sailing_datetime: null,
    };
    dispatch(addVessel(newVessel));
    closeModal();
    showAlert(`Vessel ${newVessel.vessel_name} created successfully`);
  };

  const handleAction = (action: string) => {
    if (!selected) return;

    if (action === 'berth') {
      dispatch(updateVesselStatus({ id: selected.id, status: 'BERTHED', datetime: form.datetime + ':00' }));
    } else if (action === 'moor') {
      dispatch(updateVesselStatus({ id: selected.id, status: 'MOORED', datetime: form.datetime + ':00' }));
    } else if (action === 'survey') {
      dispatch(updateSurveyReport({ id: selected.id, surveyQty: parseFloat(form.survey_quantity), datetime: form.datetime + ':00' }));
    } else if (action === 'unberth') {
      dispatch(updateVesselStatus({ id: selected.id, status: 'COMPLETED', datetime: form.datetime + ':00' }));
    }

    closeModal();
    showAlert(`${action.charAt(0).toUpperCase() + action.slice(1)} operation recorded`);
  };

  const fmt = (v: string | null | undefined) => v ? new Date(v).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '—';
  
  const fmtNum = (n: number | null | undefined) => n != null ? Number(n).toLocaleString('en-IN') : '—';

  return (
    <>
      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div className="section-head">
        <span className="section-title">VESSEL MANAGEMENT</span>
        <Button variant="light" onClick={() => openModal('create')}>+ NEW VESSEL</Button>
      </div>

      <div className="filter-bar">
        {['ALL', 'PLANNED', 'BERTHED', 'MOORED', 'COMPLETED'].map((s) => (
          <button
            key={s}
            className={`filter-tab ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s as any)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table>
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
                  <div className="empty">
                    <div className="empty-icon"><span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>anchor</span></div>
                    <div className="empty-text">No vessels found</div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.id}>
                  <td className="td-mono">{v.vessel_auto_id}</td>
                  <td className="td-primary">{v.vessel_name}</td>
                  <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.party_name}</td>
                  <td><span className="tag">{v.cargo_type}</span></td>
                  <td className="font-mono">{fmtNum(v.survey_quantity || v.quantity)}</td>
                  <td>{v.direction}</td>
                  <td className="font-mono" style={{ fontSize: 12 }}>{v.expected_date}</td>
                  <td><StatusBadge status={v.status} /></td>
                  <td>
                    <div className="action-group">
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
          <div className="form-grid">
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
          <div className="form-grid">
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
          <div className="detail-grid">
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
              <div className="detail-cell" key={k}>
                <div className="detail-key">{k}</div>
                {status ? <StatusBadge status={status} /> : <div className={`detail-val ${mono ? 'mono' : ''}`}>{v}</div>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <div className="detail-key" style={{ marginBottom: 10 }}>WORKFLOW TIMELINE</div>
            <div className="timeline">
              {[
                { label: 'Vessel Planned', time: selected.expected_date, done: true, icon: 'assignment' },
                { label: 'Berthed', time: fmt(selected.berthing_datetime), done: !!selected.berthing_datetime, active: selected.status === 'BERTHED', icon: 'anchor' },
                { label: 'Moored', time: fmt(selected.mooring_datetime), done: !!selected.mooring_datetime, active: selected.status === 'MOORED', icon: 'link' },
                { label: 'Survey Complete', time: fmt(selected.survey_datetime), done: !!selected.survey_datetime, icon: 'analytics' },
                { label: 'Unberthed / Completed', time: fmt(selected.sailing_datetime), done: !!selected.sailing_datetime, icon: 'sailing' },
              ].map((step) => (
                <div className="timeline-step" key={step.label}>
                  <div className={`timeline-dot ${step.done ? 'dot-done' : step.active ? 'dot-active' : 'dot-pending'}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>{step.icon}</span>
                  </div>
                  <div className="timeline-info">
                    <div className="timeline-label">{step.label}</div>
                    <div className="timeline-time">{step.time || 'Pending'}</div>
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
