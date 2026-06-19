import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/api/axios.client';
import { useAppSelector } from '@/store/hooks';
import { partyService } from '@/services/partyService';
import { billingService, BillingVesselDTO } from '@/services/billingService';
import { Button, SearchableSelect, Input, ConfirmDialog } from '@/components/ui';
import { getCurrentISTDateValue } from '@/utils/dateTime';
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

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'generate' | 'all' | 'vessel'>('generate');

  // Tab 1: Header form state
  const [vchNo]            = useState(() => generateVchNo());
  const [date, setDate]    = useState(() => getCurrentISTDateValue());
  const [partyName, setPartyName] = useState('');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo,   setPeriodTo]   = useState('');
  const [vesselName, setVesselName] = useState('');

  // Billing lines added
  const [billingLines, setBillingLines] = useState<BillingLine[]>([]);
  const [billingVessels, setBillingVessels] = useState<BillingVesselDTO[]>([]);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  // Tab 2: All Bills states
  const [allBills, setAllBills] = useState<any[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [searchBillQuery, setSearchBillQuery] = useState('');
  const [billDateRange, setBillDateRange] = useState(() => {
    const today = getCurrentISTDateValue();
    return { start: today, end: today };
  });
  const [expandedBillId, setExpandedBillId] = useState<number | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    billId: number | null;
  }>({ isOpen: false, billId: null });
  const [exportingBills, setExportingBills] = useState(false);
  const [downloadingBillId, setDownloadingBillId] = useState<{ id: number; type: 'excel' | 'pdf' } | null>(null);

  // Tab 3: Daily Vehicle Movement Report states
  const [vehicleReport, setVehicleReport] = useState<any[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [allVessels, setAllVessels] = useState<any[]>([]);
  const [selectedVesselId, setSelectedVesselId] = useState<string>('');
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [reportStartDate, setReportStartDate] = useState<string>(() => getCurrentISTDateValue());
  const [reportEndDate, setReportEndDate] = useState<string>(() => getCurrentISTDateValue());
  const [exportingReport, setExportingReport] = useState(false);

  const filteredVesselsForDropdown = useMemo(() => {
    if (!selectedPartyId) return allVessels;
    return allVessels.filter((v: any) => v.party_id?.toString() === selectedPartyId);
  }, [allVessels, selectedPartyId]);

  const groupedVehicleReport = useMemo(() => {
    const groups: { [key: string]: {
      vessel_name: string;
      berthing_datetime?: string | null;
      sailing_datetime?: string | null;
      survey_quantity?: string | number | null;
      rows: any[];
    } } = {};

    vehicleReport.forEach((item) => {
      const vName = item.vessel_name || 'Unassociated';
      if (!groups[vName]) {
        groups[vName] = {
          vessel_name: vName,
          berthing_datetime: item.berthing_datetime,
          sailing_datetime: item.sailing_datetime,
          survey_quantity: item.survey_quantity,
          rows: []
        };
      }
      groups[vName].rows.push(item);
    });

    return Object.values(groups);
  }, [vehicleReport]);

  const formatDateString = (dtStr: string) => {
    if (!dtStr) return '—';
    try {
      const parts = dtStr.split(' ');
      if (parts[0]) {
        const dateParts = parts[0].split('-');
        if (dateParts.length === 3) {
          return `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;
        }
      }
    } catch (e) {}
    return dtStr;
  };

  const vesselHeaderStyle: React.CSSProperties = {
    background: 'rgba(76, 175, 80, 0.08)',
    color: 'var(--text)',
    fontWeight: 'bold',
    border: '1px solid var(--border)',
    padding: '8px 12px',
    fontSize: '13px',
  };

  const vesselHeaderValueStyle: React.CSSProperties = {
    background: 'rgba(76, 175, 80, 0.08)',
    color: 'var(--accent)',
    fontWeight: 'bold',
    border: '1px solid var(--border)',
    padding: '8px 12px',
    fontSize: '13px',
    textAlign: 'center' as const,
  };

  const tableHeaderSubStyle: React.CSSProperties = {
    padding: '10px 8px',
    fontWeight: 'bold',
    fontSize: '12px',
    color: 'var(--text2)',
    textTransform: 'uppercase',
    borderBottom: '1px solid var(--border)',
  };

  useEffect(() => {
    if (selectedPartyId && selectedVesselId) {
      const vessel = allVessels.find(v => v.id.toString() === selectedVesselId);
      if (vessel && vessel.party_id?.toString() !== selectedPartyId) {
        setSelectedVesselId('');
      }
    }
  }, [selectedPartyId, selectedVesselId, allVessels]);

  const fetchAllBills = async (queryVal?: string, startDate?: string, endDate?: string) => {
    setLoadingBills(true);
    try {
      const params: any = {};
      const activeQuery = queryVal !== undefined ? queryVal : searchBillQuery;
      const activeStart = startDate !== undefined ? startDate : billDateRange.start;
      const activeEnd = endDate !== undefined ? endDate : billDateRange.end;

      if (activeQuery) params.query = activeQuery;
      if (activeStart) params.start_date = activeStart;
      if (activeEnd) params.end_date = activeEnd;

      const res = await apiClient.get('/all_bills', { params });
      if (res.data && res.data.success) {
        setAllBills(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch bills', err);
    } finally {
      setLoadingBills(false);
    }
  };

  const openDeleteConfirm = (billId: number) => {
    setDeleteDialog({ isOpen: true, billId });
  };

  const handleConfirmDeleteBill = async () => {
    if (deleteDialog.billId === null) return;
    const billId = deleteDialog.billId;

    // Close dialog first
    setDeleteDialog({ isOpen: false, billId: null });

    try {
      const res = await apiClient.delete(`/all_bills/${billId}`);
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Bill deleted successfully');
        fetchAllBills();
      } else {
        toast.error(res.data.message || 'Failed to delete bill');
      }
    } catch (err: any) {
      console.error('Failed to delete bill', err);
      toast.error(err?.response?.data?.message || 'Failed to delete bill');
    }
  };

  const fetchVehicleReport = async (vId?: string, pId?: string, sDate?: string, eDate?: string) => {
    setLoadingReport(true);
    try {
      const params: any = {};
      const activeVesselId = vId !== undefined ? vId : selectedVesselId;
      const activePartyId = pId !== undefined ? pId : selectedPartyId;
      const activeStartDate = sDate !== undefined ? sDate : reportStartDate;
      const activeEndDate = eDate !== undefined ? eDate : reportEndDate;

      if (activeVesselId) params.vessel_id = activeVesselId;
      if (activePartyId) params.party_id = activePartyId;
      if (activeStartDate) params.start_date = activeStartDate;
      if (activeEndDate) params.end_date = activeEndDate;

      const res = await apiClient.get('/reports/vehicle-movement', { params });
      if (res.data && res.data.success) {
        setVehicleReport(res.data.data || []);
      } else {
        setVehicleReport([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch vehicle movement report', err);
      toast.error(err?.response?.data?.message || 'Failed to fetch report');
      setVehicleReport([]);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleDownloadExcel = async () => {
    setExportingReport(true);
    try {
      const params = new URLSearchParams();
      if (selectedVesselId) params.append('vessel_id', selectedVesselId);
      if (selectedPartyId) params.append('party_id', selectedPartyId);
      if (reportStartDate) params.append('start_date', reportStartDate);
      if (reportEndDate) params.append('end_date', reportEndDate);

      const res = await apiClient.get(`/export/vehicle-movement?${params.toString()}`);
      
      if (res.data && res.data.success) {
        if (res.data.download_url) {
          let downloadUrlPath = res.data.download_url;
          if (downloadUrlPath.startsWith('/api/v1')) {
            downloadUrlPath = downloadUrlPath.substring(7);
          }

          const fileResponse = await apiClient.get(downloadUrlPath, {
            responseType: 'blob',
          });

          if (!fileResponse.data) {
            throw new Error('Failed to download generated report');
          }

          const fileBlob = fileResponse.data as Blob;
          const downloadUrl = window.URL.createObjectURL(fileBlob);
          const downloadLink = document.createElement('a');
          downloadLink.href = downloadUrl;
          
          const fileName = res.data.download_url.split('/').pop() || 'Vehicle_Movement_Report.xlsx';
          downloadLink.download = fileName;
          
          document.body.appendChild(downloadLink);
          downloadLink.click();
          downloadLink.remove();
          window.URL.revokeObjectURL(downloadUrl);
        }

        toast.success(res.data.message || 'Report exported successfully');
      } else {
        toast.error(res.data.message || 'Failed to export report');
      }
    } catch (err: any) {
      console.error('Failed to export vehicle report', err);
      toast.error(err?.response?.data?.message || 'Failed to export report');
    } finally {
      setExportingReport(false);
    }
  };

  const handleDownloadBillsExcel = async () => {
    setExportingBills(true);
    try {
      const params = new URLSearchParams();
      if (searchBillQuery) params.append('query', searchBillQuery);
      if (billDateRange.start) params.append('start_date', billDateRange.start);
      if (billDateRange.end) params.append('end_date', billDateRange.end);

      const res = await apiClient.get(`/export/bills?${params.toString()}`);
      
      if (res.data && res.data.success) {
        if (res.data.download_url) {
          let downloadUrlPath = res.data.download_url;
          if (downloadUrlPath.startsWith('/api/v1')) {
            downloadUrlPath = downloadUrlPath.substring(7);
          }

          const fileResponse = await apiClient.get(downloadUrlPath, {
            responseType: 'blob',
          });

          if (!fileResponse.data) {
            throw new Error('Failed to download generated report');
          }

          const fileBlob = fileResponse.data as Blob;
          const downloadUrl = window.URL.createObjectURL(fileBlob);
          const downloadLink = document.createElement('a');
          downloadLink.href = downloadUrl;
          
          const fileName = res.data.download_url.split('/').pop() || 'Bills_Report.xlsx';
          downloadLink.download = fileName;
          
          document.body.appendChild(downloadLink);
          downloadLink.click();
          downloadLink.remove();
          window.URL.revokeObjectURL(downloadUrl);
        }

        toast.success(res.data.message || 'Bills report exported successfully');
      } else {
        toast.error(res.data.message || 'Failed to export report');
      }
    } catch (err: any) {
      console.error('Failed to export bills report', err);
      toast.error(err?.response?.data?.message || 'Failed to export report');
    } finally {
      setExportingBills(false);
    }
  };

  const handleDownloadSingleBill = async (billId: number, type: 'excel' | 'pdf', voucherNumber: string) => {
    setDownloadingBillId({ id: billId, type });
    try {
      const endpoint = type === 'excel' 
        ? `/export/bills?bill_id=${billId}`
        : `/all_bills/${billId}/pdf`;

      const res = await apiClient.get(endpoint);
      
      if (res.data && res.data.success) {
        if (res.data.download_url) {
          let downloadUrlPath = res.data.download_url;
          if (downloadUrlPath.startsWith('/api/v1')) {
            downloadUrlPath = downloadUrlPath.substring(7);
          }

          const fileResponse = await apiClient.get(downloadUrlPath, {
            responseType: 'blob',
          });

          if (!fileResponse.data) {
            throw new Error('Failed to download file');
          }

          const fileBlob = fileResponse.data as Blob;
          const downloadUrl = window.URL.createObjectURL(fileBlob);
          const downloadLink = document.createElement('a');
          downloadLink.href = downloadUrl;
          
          const safeVch = voucherNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
          const fileName = type === 'excel' ? `BILL_${safeVch}.xlsx` : `${safeVch}.pdf`;
          downloadLink.download = fileName;
          
          document.body.appendChild(downloadLink);
          downloadLink.click();
          downloadLink.remove();
          window.URL.revokeObjectURL(downloadUrl);
        }
        toast.success(res.data.message || `${type.toUpperCase()} downloaded successfully`);
      } else {
        toast.error(res.data.message || `Failed to download ${type}`);
      }
    } catch (err: any) {
      console.error(`Failed to download single bill ${type}`, err);
      toast.error(err?.response?.data?.message || `Failed to download ${type}`);
    } finally {
      setDownloadingBillId(null);
    }
  };

  const filteredBills = useMemo(() => {
    return allBills;
  }, [allBills]);

  useEffect(() => {
    partyService.getPartyMasters().then((res) => {
      const list = Array.isArray(res) ? res : res.data || [];
      setParties(list);
    }).catch(() => {});

    apiClient.get('/vessels', { params: { per_page: 9999 } }).then((res) => {
      if (res.data && res.data.success) {
        setAllVessels(res.data.data || []);
      }
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

  // Reset selected vessel when party or period changes
  useEffect(() => {
    setVesselName('');
  }, [partyName, periodFrom, periodTo]);

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
        const vesselDetails = res.details.filter((d: any) => d.vessel_id === vessel.vessel_id);
        const mappedActs = vesselDetails.map((d: any) => ({
          activity: d.activity ?? d.activity_name,
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
    if (billingLines.length === 0) {
      toast.error('Add at least one billing line before generating the invoice');
      return;
    }

    const party = parties.find((p) => p.party_name === partyName);
    if (!party?.id) {
      toast.error('Party ID is missing. Please select a valid party.');
      return;
    }

    if (!periodFrom || !periodTo) {
      toast.error('Billing period is missing. Please select Period From and Period To.');
      return;
    }

    const vesselIds = billingLines.map((line) => line.vessel_id);
    if (vesselIds.length === 0) {
      toast.error('No vessel IDs found for invoice generation.');
      return;
    }

    setLoadingPdf(true);
    try {
      const params = new URLSearchParams();
      params.append('party_id', party.id.toString());
      vesselIds.forEach((id) => params.append('vessel_id', id.toString()));
      params.append('period_start', periodFrom);
      params.append('period_end', periodTo);

      const res = await apiClient.get(`/export/full-report?${params.toString()}`);
      
      if (res.data && res.data.success) {
        if (res.data.download_url) {
          let downloadUrlPath = res.data.download_url;
          if (downloadUrlPath.startsWith('/api/v1')) {
            downloadUrlPath = downloadUrlPath.substring(7);
          }

          const fileResponse = await apiClient.get(downloadUrlPath, {
            responseType: 'blob',
          });

          if (!fileResponse.data) {
            throw new Error('Failed to download generated report');
          }

          const fileBlob = fileResponse.data as Blob;
          const downloadUrl = window.URL.createObjectURL(fileBlob);
          const downloadLink = document.createElement('a');
          downloadLink.href = downloadUrl;
          
          const fileName = res.data.download_url.split('/').pop() || 'Full_Report.xlsx';
          downloadLink.download = fileName;
          
          document.body.appendChild(downloadLink);
          downloadLink.click();
          downloadLink.remove();
          window.URL.revokeObjectURL(downloadUrl);
        }

        toast.success(res.data.message || 'Report generated successfully');
      } else {
        toast.error(res.data.message || 'Failed to generate report');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoadingPdf(false);
    }
  };

  const removeLine = (id: number) => {
    setBillingLines((prev) => prev.filter((l) => l.vessel_id !== id));
  };

  const fmtNum = (n: number | string | null | undefined) =>
    n != null ? Number(n).toLocaleString('en-IN') : '—';

  const grandTotalAmt = billingLines.reduce(
    (acc, line) => acc + line.activities.reduce((sum, a) => sum + (a.amount || 0), 0),
    0
  );
  const grandTotalGst = billingLines.reduce(
    (acc, line) => acc + line.activities.reduce((sum, a) => sum + (a.gstAmount || 0), 0),
    0
  );

  return (
    <>
      {/* ── Page header ── */}
      <div className="section-head">
        <span className="section-title">BILLING &amp; INVOICING</span>
      </div>

      {/* ── Tabs ── */}
      <div className="filter-bar" style={{ marginBottom: '16px' }}>
        <button
          className={`filter-tab ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          Generate Bill
        </button>
        <button
          className={`filter-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('all');
            fetchAllBills();
          }}
        >
          All Bill
        </button>
        <button
          className={`filter-tab ${activeTab === 'vessel' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('vessel');
            fetchVehicleReport();
          }}
        >
          Vessel Report
        </button>
      </div>

      {/* ── Tab 1: Generate Bill ── */}
      {activeTab === 'generate' && (
        <>
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
                    options={billingVessels
                      .filter((v) => !billingLines.some((l) => l.vessel_id === v.vessel_id))
                      .map((v) => ({
                        value: v.vessel_name,
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

                {/* Service Total / Grand Total */}
                {billingLines.length > 0 && (
                  <>
                    <tr style={{ background: 'var(--bg)', borderTop: '3px double var(--border)' }}>
                      <td colSpan={2} style={{ textAlign: 'left', fontSize: '15px', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', padding: '12px 10px' }}>
                        Service Total
                      </td>
                      <td colSpan={3} style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 800, color: 'var(--text)', padding: '12px 10px' }}>
                        {fmtNum(grandTotalAmt)}
                      </td>
                      <td colSpan={2} style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 800, color: 'var(--green)', padding: '12px 10px' }}>
                        {fmtNum(grandTotalGst)}
                      </td>
                      <td></td>
                    </tr>
                    <tr style={{ background: 'rgba(0,194,255,0.05)', borderBottom: '2px solid var(--border)' }}>
                      <td colSpan={5} style={{ textAlign: 'start', fontSize: '16px', fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', padding: '12px 10px' }}>
                        Nett Total (Amt + GST)
                      </td>
                      <td colSpan={2} style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 900, color: 'var(--accent)', padding: '12px 10px' }}>
                        {fmtNum(grandTotalAmt + grandTotalGst)}
                      </td>
                      <td></td>
                    </tr>
                  </>
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
                <Button variant="light" onClick={handleGenerateInvoice} disabled={loadingGenerate || loadingPdf}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    print
                  </span>
                  {loadingPdf ? 'GENERATING...' : 'GENERATE INVOICE'}
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Tab 2: All Bill ── */}
      {activeTab === 'all' && (
        <>
          {/* Search & Filter Bar */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-end',
              marginBottom: '12px',
              background: 'var(--bg2)',
              padding: '16px',
              border: '1px solid var(--border)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: '200px', maxWidth: '300px' }}>
              <Input
                label="Search Bill"
                placeholder="Voucher No, Party Name..."
                value={searchBillQuery}
                onChange={(e) => setSearchBillQuery(e.target.value)}
              />
            </div>
            <div style={{ flex: 1, minWidth: '150px', maxWidth: '200px' }}>
              <Input
                label="Date From"
                type="date"
                value={billDateRange.start}
                onChange={(e) => setBillDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div style={{ flex: 1, minWidth: '150px', maxWidth: '200px' }}>
              <Input
                label="Date To"
                type="date"
                value={billDateRange.end}
                onChange={(e) => setBillDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="primary" onClick={() => fetchAllBills()} disabled={loadingBills}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  search
                </span>
                SEARCH
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchBillQuery('');
                  const today = getCurrentISTDateValue();
                  setBillDateRange({ start: today, end: today });
                  fetchAllBills('', today, today);
                }}
              >
                CLEAR
              </Button>
            </div>
          </div>

          {/* Bills List Table */}
          <div className="table-wrap">
            <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="table-title">ALL GENERATED BILLS</span>
                <span className="tag">
                  {filteredBills.length} BILL{filteredBills.length !== 1 ? 'S' : ''}
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadBillsExcel}
                disabled={exportingBills || filteredBills.length === 0}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  download
                </span>
                {exportingBills ? 'EXPORTING...' : 'DOWNLOAD EXCEL'}
              </Button>
            </div>
            {loadingBills ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
                LOADING BILLS...
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Voucher No</th>
                    <th>Bill Date</th>
                    <th>Party Name</th>
                    <th>Period Range</th>
                    <th style={{ textAlign: 'right' }}>Base Value</th>
                    <th style={{ textAlign: 'right' }}>Tax Value</th>
                    <th style={{ textAlign: 'right' }}>Round Off</th>
                    <th style={{ textAlign: 'right' }}>Total Value</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <div className="empty">
                          <div className="empty-icon">
                            <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>
                              receipt_long
                            </span>
                          </div>
                          <div className="empty-text">No bills found</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredBills.map((bill) => (
                      <React.Fragment key={bill.id}>
                        <tr style={{ borderBottom: '1px solid var(--border2)' }}>
                          <td className="td-mono" style={{ fontWeight: 600, color: 'var(--accent)' }}>{bill.voucher_number}</td>
                          <td className="font-mono">{bill.bill_date}</td>
                          <td className="td-primary">{bill.party_name}</td>
                          <td style={{ fontSize: '12px' }}>
                            {bill.period_start} to {bill.period_end}
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmtNum(bill.bill_base_value)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                            CGST: {fmtNum(bill.cgst)}<br />
                            SGST: {fmtNum(bill.sgst)}
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmtNum(bill.round_off)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--green)', fontSize: '14px' }}>
                            {fmtNum(bill.total_bill_value)}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedBillId(expandedBillId === bill.id ? null : bill.id)}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                  {expandedBillId === bill.id ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                                </span>
                                {expandedBillId === bill.id ? 'HIDE' : 'VIEW DETAILS'}
                              </Button>
                              <Button
                                variant="light"
                                size="sm"
                                onClick={() => handleDownloadSingleBill(bill.id, 'pdf', bill.voucher_number)}
                                disabled={downloadingBillId !== null}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                  picture_as_pdf
                                </span>
                                {downloadingBillId?.id === bill.id && downloadingBillId?.type === 'pdf' ? 'PDF...' : 'PDF'}
                              </Button>
                              <Button
                                variant="red"
                                size="sm"
                                onClick={() => openDeleteConfirm(bill.id)}
                                disabled={downloadingBillId !== null}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                  delete
                                </span>
                                DELETE
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {expandedBillId === bill.id && (
                          <tr>
                            <td colSpan={9} style={{ padding: '16px 20px', background: 'var(--bg3)', borderBottom: '2px solid var(--border)' }}>
                              <div style={{ padding: '14px', borderLeft: '3px solid var(--accent)', background: 'var(--bg2)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                <h4 style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--accent)', fontFamily: 'var(--font-head)', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>
                                  BILL DETAILS / ITEMIZED ACTIVITIES
                                </h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
                                      <th style={{ padding: '6px 12px' }}>Vessel Name</th>
                                      <th style={{ padding: '6px 12px' }}>Activity</th>
                                      <th style={{ padding: '6px 12px', textAlign: 'right' }}>Qty</th>
                                      <th style={{ padding: '6px 12px', textAlign: 'right' }}>Rate</th>
                                      <th style={{ padding: '6px 12px', textAlign: 'right' }}>Base Amount</th>
                                      <th style={{ padding: '6px 12px', textAlign: 'right' }}>GST Rate (%)</th>
                                      <th style={{ padding: '6px 12px', textAlign: 'right' }}>GST Amount</th>
                                      <th style={{ padding: '6px 12px', textAlign: 'right' }}>Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {!bill.details || bill.details.length === 0 ? (
                                      <tr>
                                        <td colSpan={8} style={{ textAlign: 'center', padding: '12px', color: 'var(--text3)' }}>
                                          No details available for this bill.
                                        </td>
                                      </tr>
                                    ) : (
                                      bill.details.map((det: any, idx: number) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--border2)' }}>
                                          <td style={{ padding: '6px 12px', fontWeight: 'bold', color: 'var(--text)' }}>
                                            {det.vessel_name || `Vessel ID: ${det.vessel_id}`}
                                          </td>
                                          <td style={{ padding: '6px 12px' }}>{det.activity}</td>
                                          <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmtNum(det.qty)}</td>
                                          <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmtNum(det.rate)}</td>
                                          <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmtNum(det.amount)}</td>
                                          <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{det.gst_rate}%</td>
                                          <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmtNum(det.gst_amount)}</td>
                                          <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--text)' }}>
                                            {fmtNum((det.amount || 0) + (det.gst_amount || 0))}
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                                {bill.narration && (
                                  <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text2)', padding: '6px 10px', background: 'var(--bg3)', borderLeft: '2px solid var(--text3)' }}>
                                    <strong>Narration:</strong> {bill.narration}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── Tab 3: Vessel Report ── */}
      {activeTab === 'vessel' && (
        <>
          {/* Search filter for vehicle movement report */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-end',
              marginBottom: '12px',
              background: 'var(--bg2)',
              padding: '16px',
              border: '1px solid var(--border)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: '200px', maxWidth: '280px' }}>
              <SearchableSelect
                label="Filter by Exporter (Party)"
                placeholder="All Exporters"
                value={selectedPartyId ? parties.find(p => p.id.toString() === selectedPartyId)?.party_name || '' : ''}
                onChange={(name) => {
                  const party = parties.find(p => p.party_name === name);
                  setSelectedPartyId(party ? party.id.toString() : '');
                }}
                options={[
                  { value: '', label: 'All Exporters' },
                  ...parties.map((p) => ({
                    value: p.party_name,
                    label: p.party_name,
                  }))
                ]}
              />
            </div>
            <div style={{ flex: 1, minWidth: '200px', maxWidth: '280px' }}>
              <SearchableSelect
                label="Filter by Vessel"
                placeholder="All Vessels"
                value={allVessels.find(v => v.id.toString() === selectedVesselId)?.vessel_name || ''}
                onChange={(name) => {
                  const vessel = allVessels.find(v => v.vessel_name === name);
                  setSelectedVesselId(vessel ? vessel.id.toString() : '');
                }}
                options={[
                  { value: '', label: 'All Vessels' },
                  ...filteredVesselsForDropdown.map((v) => ({
                    value: v.vessel_name,
                    label: v.vessel_name,
                  }))
                ]}
              />
            </div>
            <div style={{ flex: 1, minWidth: '150px', maxWidth: '180px' }}>
              <Input
                label="Date From"
                type="date"
                value={reportStartDate}
                onChange={(e) => setReportStartDate(e.target.value)}
              />
            </div>
            <div style={{ flex: 1, minWidth: '150px', maxWidth: '180px' }}>
              <Input
                label="Date To"
                type="date"
                value={reportEndDate}
                onChange={(e) => setReportEndDate(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="primary" onClick={() => fetchVehicleReport()} disabled={loadingReport}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  search
                </span>
                SEARCH
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedVesselId('');
                  setSelectedPartyId('');
                  const today = getCurrentISTDateValue();
                  setReportStartDate(today);
                  setReportEndDate(today);
                  fetchVehicleReport('', '', today, today);
                }}
              >
                CLEAR
              </Button>
            </div>
          </div>

          {/* Dynamic Vehicle Movement Report Table */}
          <div className="table-wrap">
            <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="table-title">DAILY VEHICLE MOVEMENT REPORT</span>
                <span className="tag">
                  {vehicleReport.length} VEHICLE{vehicleReport.length !== 1 ? 'S' : ''}
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadExcel}
                disabled={exportingReport || vehicleReport.length === 0}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  download
                </span>
                {exportingReport ? 'EXPORTING...' : 'DOWNLOAD EXCEL'}
              </Button>
            </div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {loadingReport ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
                  LOADING VEHICLE REPORT...
                </div>
              ) : (
                <table style={{ minWidth: '2400px' }}>
                <tbody>
                  {groupedVehicleReport.length === 0 ? (
                    <tr>
                      <td colSpan={22}>
                        <div className="empty">
                          <div className="empty-icon">
                            <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>
                              local_shipping
                            </span>
                          </div>
                          <div className="empty-text">No vehicle movements found</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    groupedVehicleReport.map((group, gIdx) => {
                      const totalNetWeight = group.rows.reduce(
                        (sum, item) => sum + (item.net_weight != null ? Number(item.net_weight) : 0),
                        0
                      );

                      return (
                        <React.Fragment key={gIdx}>
                          {/* Vessel Metadata Block */}
                          <tr style={{ background: 'transparent' }}>
                            <td style={{ ...vesselHeaderStyle, borderBottom: 'none' }}>Name of vessel</td>
                            <td style={{ ...vesselHeaderValueStyle, borderBottom: 'none' }}>{group.vessel_name}</td>
                            <td style={{ ...vesselHeaderStyle, borderBottom: 'none' }}>Vessel berthing date/time</td>
                            <td style={{ ...vesselHeaderValueStyle, borderBottom: 'none' }}>
                              {group.berthing_datetime ? formatDateString(group.berthing_datetime) : '—'}
                            </td>
                            <td colSpan={18} style={{ border: 'none', background: 'transparent' }}></td>
                          </tr>
                          <tr style={{ background: 'transparent' }}>
                            <td style={vesselHeaderStyle}>Survey Qty</td>
                            <td style={vesselHeaderValueStyle}>
                              {group.survey_quantity != null ? Number(group.survey_quantity).toFixed(2) : '—'}
                            </td>
                            <td style={vesselHeaderStyle}>Vessel UNberthing date/time</td>
                            <td style={vesselHeaderValueStyle}>
                              {group.sailing_datetime ? formatDateString(group.sailing_datetime) : '—'}
                            </td>
                            <td colSpan={18} style={{ border: 'none', background: 'transparent' }}></td>
                          </tr>

                          {/* Blank spacer row */}
                          <tr style={{ height: '12px', border: 'none', background: 'transparent' }}>
                            <td colSpan={22} style={{ border: 'none', background: 'transparent', height: '12px' }}></td>
                          </tr>

                          {/* Table Section Headers */}
                          <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '60px' }}>SL. No.</td>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '220px' }}>Consignor - (Party Name)</td>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '160px' }}>(GATE) Entry Date & Time</td>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '150px' }}>CHALLAN & INV. NO</td>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '130px' }}>VEHICLE NO.</td>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '180px' }}>Transporter Name</td>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '140px' }}>Driver name</td>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '120px' }}>Driver number</td>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '140px' }}>Out Weighment Slip no</td>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '100px', textAlign: 'right' }}>Out Gross Wt</td>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '100px', textAlign: 'right'}}>Out Tare Wt</td>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '100px', textAlign: 'right' }}>Out Nett Wt</td>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '160px' }}>IN Weighment DATE & Time</td>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '110px', textAlign: 'right' }}>Gross Weight</td>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '160px' }}>OUT Weighment DATE & Time</td>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '110px', textAlign: 'right' }}>Tare Weight</td>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '160px' }}>(GATE) Out Date & Time</td>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '120px', textAlign: 'right' }}>Net Material Qty</td>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '100px', textAlign: 'right' }}>Waiting Hour 24</td>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '200px' }}>BULKER Unloading Start Date & Time Start to VESSEL</td>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '140px' }}>COMPRESSOR OR NO.</td>
                            <td style={{ ...tableHeaderSubStyle, minWidth: '200px' }}>BULKER Unloading Complete Date & Time Start to VESSEL</td>
                          </tr>

                          {/* Data rows */}
                          {group.rows.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border2)' }}>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>{idx + 1}</td>
                              <td className="td-primary" style={{ fontWeight: 600 }}>{item.party_name || '—'}</td>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>{item.gate_in_datetime || '—'}</td>
                              <td className="td-mono">{item.challan_invoice_no || '—'}</td>
                              <td className="td-mono" style={{ fontWeight: 600, color: 'var(--accent)' }}>{item.vehicle_no || '—'}</td>
                              <td>{item.transporter_name || '—'}</td>
                              <td>{item.driver_name || '—'}</td>
                              <td className="td-mono">{item.driver_mob_no || '—'}</td>
                              <td className="td-mono">{item.outside_payment_slip || '—'}</td>
                              <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                                {item.outside_gross_weight != null ? Number(item.outside_gross_weight).toFixed(2) : '—'}
                              </td>
                              <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                                {item.outside_tare_weight != null ? Number(item.outside_tare_weight).toFixed(2) : '—'}
                              </td>
                              <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                {item.outside_net_weight != null ? Number(item.outside_net_weight).toFixed(2) : '—'}
                              </td>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>{item.wbin_datetime || '—'}</td>
                              <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                                {item.gross_weight != null ? Number(item.gross_weight).toFixed(2) : '—'}
                              </td>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>{item.wbout_datetime || '—'}</td>
                              <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                                {item.tare_weight != null ? Number(item.tare_weight).toFixed(2) : '—'}
                              </td>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>{item.gate_out_datetime || '—'}</td>
                              <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>
                                {item.net_weight != null ? Number(item.net_weight).toFixed(2) : '—'}
                              </td>
                              <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                                {item.waiting_hours != null ? item.waiting_hours : '—'}
                              </td>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>{item.cargo_start_datetime || '—'}</td>
                              <td className="td-mono">{item.compressor_no || '—'}</td>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>{item.cargo_end_datetime || '—'}</td>
                            </tr>
                          ))}

                          {/* Vessel Total Row */}
                          <tr style={{ background: 'var(--bg2)', borderTop: '2px solid var(--border)', fontWeight: 'bold' }}>
                            <td colSpan={17} style={{ textTransform: 'uppercase', padding: '12px 10px', fontSize: '13px' }}>
                              Total
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--accent)', padding: '12px 10px' }}>
                              {totalNetWeight.toFixed(2)}
                            </td>
                            <td colSpan={4}></td>
                          </tr>

                          {/* Section Separation Row */}
                          <tr style={{ height: '36px', border: 'none', background: 'transparent' }}>
                            <td colSpan={22} style={{ border: 'none', background: 'transparent', height: '36px' }}></td>
                          </tr>
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
            </div>
          </div>
        </>
      )}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="CONFIRM DELETE"
        message="Do you want to Delete this bill? This action cannot be undone."
        type="confirm"
        confirmText="YES, DELETE"
        cancelText="NO, CANCEL"
        onConfirm={handleConfirmDeleteBill}
        onCancel={() => setDeleteDialog({ isOpen: false, billId: null })}
      />
    </>
  );
};

export default FinancePage;
