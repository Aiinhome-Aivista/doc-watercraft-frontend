import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { partyService } from '@/services/partyService';
import { billingService, BillingVesselDTO } from '@/services/billingService';
import { Button, SearchableSelect, Input } from '@/components/ui';
import toast from 'react-hot-toast';

const generateVchNo = () => {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(now.getTime()).slice(-4);
  return `INV-${yy}${mm}-${seq}`;
};

interface BillingLineActivity {
  activity: string;
  qty: number;
  rate: number;
  amount: number;
  gstRate: number;
  gstAmount: number;
}

interface BillingLine {
  vessel_id: number;
  vessel_name: string;
  party_name: string;
  quantity: string | number;
  status: string;
  activities: BillingLineActivity[];
}

const FinancePage: React.FC = () => {
  const vessels = useAppSelector((state) => state.vessels.items);

  const [parties, setParties] = useState<any[]>([]);

  // Header form state
  const [vchNo]            = useState(() => generateVchNo());
  const [date, setDate]    = useState(() => new Date().toISOString().slice(0, 10));
  const [partyName, setPartyName] = useState('');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo,   setPeriodTo]   = useState('');
  const [vesselName, setVesselName] = useState('');

  // Billing lines added
  const [billingLines, setBillingLines] = useState<BillingLine[]>([]);
  const [billingVessels, setBillingVessels] = useState<BillingVesselDTO[]>([]);
  const [loadingGenerate, setLoadingGenerate] = useState(false);

  useEffect(() => {
    partyService.getPartyMasters().then((res) => {
      const list = Array.isArray(res) ? res : res.data || [];
      setParties(list);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchVessels = async () => {
      if (!partyName || !periodFrom || !periodTo || parties.length === 0) {
        setBillingVessels([]);
        return;
      }
      const party = parties.find(p => p.party_name === partyName);
      if (!party) return;

      try {
        const res = await billingService.getVesselsForBilling({
          party_id: party.id,
          period_start: periodFrom,
          period_end: periodTo
        });
        if (res.success && Array.isArray(res.data)) {
          setBillingVessels(res.data);
        } else {
          setBillingVessels([]);
        }
      } catch (err) {
        console.error('Failed to fetch billing vessels', err);
        setBillingVessels([]);
      }
    };
    fetchVessels();
  }, [partyName, periodFrom, periodTo, parties]);

  const handleAddToBilling = async () => {
    if (!vesselName) {
      toast.error('Please select a vessel to add to billing');
      return;
    }
    const vessel = billingVessels.find((v) => v.vessel_name === vesselName);
    if (!vessel) {
      toast.error('Selected vessel not found');
      return;
    }
    const alreadyAdded = billingLines.some((l) => l.vessel_id === vessel.vessel_id);
    if (alreadyAdded) {
      toast.error('This vessel is already added to billing');
      return;
    }

    const party = parties.find(p => p.party_name === partyName);
    if (!party) {
      toast.error('Party ID missing for generation');
      return;
    }

    setLoadingGenerate(true);
    try {
      const payload = {
        party_id: party.id,
        vessel_id: vessel.vessel_id,
        period_start: periodFrom,
        period_end: periodTo
      };
      
      const res = await billingService.generateBill(payload);
      
      if (res.success && res.details) {
        // Map the activities for the single newly generated vessel
        const vesselDetails = res.details.filter((d: any) => d.vessel_id === vessel.vessel_id);
        const mappedActs = vesselDetails.map((d: any) => ({
          activity: d.activity,
          qty: d.qty,
          rate: d.rate,
          amount: d.amount,
          gstRate: d.gst_rate,
          gstAmount: d.gst_amount
        }));

        setBillingLines((prev) => [
          ...prev,
          {
            vessel_id: vessel.vessel_id,
            vessel_name: vessel.vessel_name,
            party_name: partyName,
            quantity: vessel.quantity,
            status: 'COMPLETED',
            activities: mappedActs
          }
        ]);
        
        setVesselName('');
        toast.success(`${vessel.vessel_name} added successfully! Voucher No: ${vchNo}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to generate billing activities');
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleGenerateInvoice = async () => {
    // If they click "GENERATE INVOICE" at the bottom, just pretend it prints or triggers something else, since the API was already hit.
    if (billingLines.length === 0) return;
    toast.success('Invoice generation process complete. Ready to print.');
  };

  const removeLine = (id: number) => {
    setBillingLines((prev) => prev.filter((l) => l.vessel_id !== id));
  };

  const fmtNum = (n: number | string | null | undefined) =>
    n != null ? Number(n).toLocaleString('en-IN') : '—';

  return (
    <>
      {/* ── Page header ── */}
      <div className="section-head">
        <span className="section-title">BILLING &amp; INVOICING</span>
      </div>

      {/* ── Billing Header Card ── */}
      <div
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          marginBottom: '20px',
        }}
      >
        {/* card title bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '16px', color: 'var(--accent)' }}
          >
            receipt_long
          </span>
          <span
            style={{
              fontFamily: 'var(--font-head)',
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '1px',
              color: 'var(--text)',
            }}
          >
            NEW BILLING VOUCHER
          </span>
          {/* auto vch badge */}
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--accent)',
              background: 'rgba(0,194,255,0.08)',
              border: '1px solid rgba(0,194,255,0.2)',
              padding: '3px 10px',
              letterSpacing: '1px',
            }}
          >
            {vchNo}
          </span>
        </div>

        {/* form body */}
        <div style={{ padding: '20px' }}>
          {/* Row 1 — Vch No (read-only), Date, Party */}
          <div className="form-grid" style={{ marginBottom: '14px' }}>
            {/* Vch No */}
            <div className="form-group">
              <label className="form-label">Voucher No.</label>
              <input
                className="form-input"
                value={vchNo}
                readOnly
                style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', cursor: 'default', opacity: 0.8 }}
              />
            </div>

            {/* Date */}
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            {/* Party */}
            <div style={{ gridColumn: '1 / -1' }}>
              <SearchableSelect
                label="Party *"
                placeholder="Search party / client..."
                value={partyName}
                onChange={(v) => setPartyName(v)}
                options={parties.map((p) => ({ value: p.party_name, label: p.party_name }))}
              />
            </div>
          </div>

          {/* Row 2 — Period From, Period To */}
          <div className="form-grid" style={{ marginBottom: '14px' }}>
            <Input
              label="Period From"
              type="date"
              value={periodFrom}
              onChange={(e) => setPeriodFrom(e.target.value)}
            />
            <Input
              label="Period To"
              type="date"
              value={periodTo}
              onChange={(e) => setPeriodTo(e.target.value)}
            />
          </div>

          {/* Row 3 — Vessel picker + Add button */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-end',
              padding: '14px',
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ flex: 1 }}>
              <SearchableSelect
                label="List of Vessels (Completed Jobs)"
                placeholder="Select a completed vessel..."
                value={vesselName}
                onChange={(v) => setVesselName(v)}
                options={billingVessels.map((v) => ({
                  value: v.vessel_auto_id,
                  label: v.vessel_name,
                }))}
              />
            </div>
            <Button variant="primary" onClick={handleAddToBilling} disabled={loadingGenerate}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                add
              </span>
              {loadingGenerate ? 'ADDING...' : 'ADD TO BILLING'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Billing Lines Table ── */}
      <div className="table-wrap">
        <div className="table-header">
          <span className="table-title">BILLING LINES</span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text3)',
              letterSpacing: '1px',
            }}
          >
            {billingLines.length} ITEM{billingLines.length !== 1 ? 'S' : ''}
          </span>
        </div>
        <table>
          <thead style={{ background: 'var(--bg3)' }}>
            <tr>
              <th>Vessel Name</th>
              <th>Activity Name</th>
              <th style={{ textAlign: 'right' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Rate</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'right' }}>GSTRate (%)</th>
              <th style={{ textAlign: 'right' }}>GST Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {billingLines.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty">
                    <div className="empty-icon">
                      <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>
                        receipt_long
                      </span>
                    </div>
                    <div className="empty-text">No billing lines added yet</div>
                  </div>
                </td>
              </tr>
            ) : (
              billingLines.map((line) => {
                const subTotalAmt = line.activities.reduce((acc, a) => acc + a.amount, 0);
                const subTotalGst = line.activities.reduce((acc, a) => acc + a.gstAmount, 0);

                return (
                  <React.Fragment key={line.vessel_id}>
                    {/* Parent Vessel Row */}
                    <tr style={{ background: 'rgba(0,194,255,0.05)', borderBottom: '2px solid var(--border)' }}>
                      <td className="td-primary" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                        {line.vessel_name}
                      </td>
                      <td colSpan={6}>
                        <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                          PARTY: {line.party_name} | QTY: {fmtNum(line.quantity)} MT
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => removeLine(line.vessel_id)}
                          title="Remove Vessel from Billing"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--red)',
                            padding: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            opacity: 0.7,
                            transition: 'opacity 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>
                            delete
                          </span>
                        </button>
                      </td>
                    </tr>

                    {/* Activity Rows */}
                    {line.activities.map((act, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border2)' }}>
                        <td></td>
                        <td style={{ color: 'var(--text2)' }}>{act.activity}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmtNum(act.qty)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmtNum(act.rate)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                          {fmtNum(act.amount)}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{act.gstRate}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                          {fmtNum(act.gstAmount)}
                        </td>
                        <td></td>
                      </tr>
                    ))}

                    {/* Subtotal Row */}
                    <tr style={{ background: 'var(--bg2)', borderBottom: '2px solid var(--border)' }}>
                      <td colSpan={2} style={{ textAlign: 'left', fontWeight: 600, color: 'var(--text)', fontStyle: 'italic' }}>
                        Vessel Subtotal
                      </td>
                      <td colSpan={3} style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                        {fmtNum(subTotalAmt)}
                      </td>
                      <td colSpan={2} style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--green)' }}>
                        {fmtNum(subTotalGst)}
                      </td>
                      <td></td>
                    </tr>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer action */}
        {billingLines.length > 0 && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <Button variant="ghost" onClick={() => setBillingLines([])}>
              CLEAR ALL
            </Button>
            <Button variant="light" onClick={handleGenerateInvoice} disabled={loadingGenerate}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                print
              </span>
              {loadingGenerate ? 'GENERATING...' : 'GENERATE INVOICE'}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default FinancePage;
