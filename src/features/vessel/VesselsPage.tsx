import React, { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addVessel,
  updateVesselStatus,
  updateSurveyReport,
  fetchVessels,
  createVesselThunk,
  updateVesselThunk,
  berthVesselThunk,
  moorVesselThunk,
  surveyVesselThunk,
  unberthVesselThunk,
} from "@/store/slices/vesselSlice";
import { Vessel, VesselStatus } from "@/types/vessel";
import { partyService } from "@/services/partyService";
import {
  Modal,
  Input,
  Select,
  Button,
  StatusBadge,
  SearchableSelect,
  ConfirmDialog,
} from "@/components/ui";
import {
  formatDateTimeIST,
  getCurrentISTDateTimeLocalValue,
  getCurrentISTDateValue,
} from "@/utils/dateTime";
import { useAccessRights } from "@/hooks/useAccessRights";
import toast from "react-hot-toast";

const defaultChargeLines = [
  {
    activity: "Terminal Services",
    formula: "Logic1",
    rate: 46,
    gst_rate: 18,
    min_qty: 0,
    max_qty: 0,
  },
  {
    activity: "Handling service",
    formula: "Logic1",
    rate: 170,
    gst_rate: 18,
    min_qty: 0,
    max_qty: 0,
  },
  {
    activity: "Berthing charges",
    formula: "Logic3",
    rate: 3000,
    gst_rate: 18,
    min_qty: 0,
    max_qty: 0,
  },
  {
    activity: "Mooring charges",
    formula: "Logic4",
    rate: 4000,
    gst_rate: 12,
    min_qty: 0,
    max_qty: 0,
  },
  {
    activity: "Truck entry charges",
    formula: "Logic2",
    rate: 100,
    gst_rate: 18,
    min_qty: 0,
    max_qty: 0,
  },
  {
    activity: "Weighment charges",
    formula: "Logic6",
    rate: 250,
    gst_rate: 18,
    min_qty: 0,
    max_qty: 0,
  },
  {
    activity: "Parking charges",
    formula: "Logic7",
    rate: 100,
    gst_rate: 5,
    min_qty: 0,
    max_qty: 0,
  },
  {
    activity: "Berthing Assistance",
    formula: "Logic5",
    rate: 2000,
    gst_rate: 18,
    min_qty: 1,
    max_qty: 1400,
  },
  {
    activity: "Berthing Assistance",
    formula: "Logic5",
    rate: 4000,
    gst_rate: 18,
    min_qty: 1401,
    max_qty: 2100,
  },
  {
    activity: "Berthing Assistance",
    formula: "Logic5",
    rate: 5500,
    gst_rate: 18,
    min_qty: 2101,
    max_qty: 10000,
  },
];

const VesselsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const vessels = useAppSelector((state) => state.vessels.items);
  const pagination = useAppSelector((state) => state.vessels.pagination);
  const loading = useAppSelector((state) => state.vessels.loading);
  const [parties, setParties] = useState<any[]>([]);
  const { canVesselStatus, vesselStatuses } = useAccessRights();

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Fetch page from server whenever page or perPage changes
  useEffect(() => {
    dispatch(fetchVessels({ page: currentPage, per_page: perPage }));
  }, [dispatch, currentPage, perPage]);

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const res = await partyService.getPartyMasters();
        const list = Array.isArray(res) ? res : res.data || [];
        setParties(list);
      } catch (err) {
        console.error("Failed to fetch parties", err);
      }
    };
    fetchParties();
  }, []);

  const [filter, setFilter] = useState<VesselStatus | "ALL">("ALL");
  const [createdAtSort, setCreatedAtSort] = useState<"latest" | "oldest">(
    "latest",
  );

  const defaultStartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const defaultEndDate = new Date().toISOString().split("T")[0];

  const [dateRange, setDateRange] = useState({
    start: defaultStartDate,
    end: defaultEndDate,
  });
  const [filterVesselName, setFilterVesselName] = useState<string>("");
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    idx: number | null;
  }>({ isOpen: false, idx: null });
  const [modal, setModal] = useState<
    | "create"
    | "edit"
    | "berth"
    | "moor"
    | "survey"
    | "unberth"
    | "detail"
    | null
  >(null);
  const [selected, setSelected] = useState<Vessel | null>(null);
  const [form, setForm] = useState<any>({});
  const [chargeLines, setChargeLines] = useState<any[]>([]);

  const handlePageChange = (newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= pagination.total_pages) {
      setCurrentPage(newPage);
    }
  };

  const fmtDateOnly = (v: string | null | undefined) => {
    if (!v) return "—";
    const formatted = formatDateTimeIST(v);
    return formatted.includes(",") ? formatted.split(",")[0] : formatted;
  };

  const getDateMs = (v: string | null | undefined) =>
    v ? new Date(v.includes("T") ? v : v.replace(" ", "T")).getTime() : 0;

  const uniqueVesselNames = useMemo(() => {
    return Array.from(new Set(vessels.map((v) => v.vessel_name)));
  }, [vessels]);

  // Client-side filtering/sorting on the server-returned page
  const filtered = useMemo(() => {
    let result =
      filter === "ALL" ? vessels : vessels.filter((v) => v.status === filter);

    if (dateRange.start || dateRange.end) {
      result = result.filter((v) => {
        const createdMs = getDateMs(v.created_at);
        const berthingMs = getDateMs(v.berthing_datetime);
        const startMs = dateRange.start
          ? new Date(dateRange.start).getTime()
          : 0;
        const endMs = dateRange.end
          ? new Date(dateRange.end).getTime() + 86400000
          : Infinity;

        const createdInRange = createdMs >= startMs && createdMs <= endMs;
        const berthingInRange = berthingMs >= startMs && berthingMs <= endMs;

        return createdInRange || berthingInRange;
      });
    }

    if (filterVesselName) {
      result = result.filter((v) => v.vessel_name === filterVesselName);
    }

    return result.sort((a, b) => {
      const diff = getDateMs(a.created_at) - getDateMs(b.created_at);
      return createdAtSort === "latest" ? -diff : diff;
    });
  }, [vessels, filter, createdAtSort, dateRange, filterVesselName]);

  const nowDt = () => getCurrentISTDateTimeLocalValue();

  const openModal = (type: any, vessel: Vessel | null = null) => {
    setSelected(vessel);
    if (type === "edit" && vessel) {
      setForm({
        vessel_name: vessel.vessel_name,
        party_name: vessel.party_name,
        cargo_type: vessel.cargo_type,
        quantity: vessel.quantity,
        direction: vessel.direction,
        expected_date: vessel.expected_date,
        status: vessel.status,
      });
    } else {
      setForm({ datetime: nowDt() });
    }
    setModal(type);
    if (type === "create") {
      setChargeLines([...defaultChargeLines]);
    }
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setForm({});
    setChargeLines([]);
  };

  const updateChargeLine = (idx: number, field: string, value: any) => {
    const newLine = [...chargeLines];
    newLine[idx] = { ...newLine[idx], [field]: value };
    setChargeLines(newLine);
  };

  const confirmRemoveChargeLine = (idx: number) => {
    setDeleteDialog({ isOpen: true, idx });
  };

  const handleRemoveChargeLine = () => {
    if (deleteDialog.idx !== null) {
      setChargeLines(chargeLines.filter((_, i) => i !== deleteDialog.idx));
    }
    setDeleteDialog({ isOpen: false, idx: null });
  };

  const handleCreate = async () => {
    if (!form.vessel_name || !form.party_name) {
      toast.error("Vessel name and Party are required");
      return;
    }

    let party_id: number | null = null;
    const numericVal = parseInt(form.party_name, 10);
    if (!isNaN(numericVal) && parties.some((p) => p.id === numericVal)) {
      party_id = numericVal;
    } else {
      const party = parties.find((p) => p.party_name === form.party_name);
      party_id = party ? party.id : null;
    }

    if (!party_id) {
      toast.error("Please select a valid party from the list");
      return;
    }

    const rates = chargeLines.map((line: any) => ({
      activity: line.activity,
      formula: line.formula,
      rate: parseFloat(line.rate) || 0,
      gst_rate: parseFloat(line.gst_rate) || 0,
      min_qty: parseFloat(line.min_qty) || 0,
      max_qty: parseFloat(line.max_qty) || 0,
    }));

    const payload = {
      vessel_name: form.vessel_name,
      party_id,
      cargo_type: form.cargo_type || "FLYASH",
      quantity: parseFloat(form.quantity) || 0,
      direction: (form.direction as any) || "IMPORT",
      expected_date: form.expected_date || getCurrentISTDateValue(),
      rates,
    };

    try {
      await dispatch(createVesselThunk(payload)).unwrap();
      await dispatch(fetchVessels({ page: currentPage, per_page: perPage }));
      closeModal();
      toast.success(`Vessel ${payload.vessel_name} created successfully`);
    } catch (err: any) {
      toast.error(err || "Failed to create vessel");
    }
  };

  const handleEditVessel = async () => {
    if (!selected) return;
    if (!form.vessel_name || !form.party_name) {
      toast.error("Vessel name and Party are required");
      return;
    }

    let party_id: number | null = null;
    const numericVal = parseInt(form.party_name, 10);
    if (!isNaN(numericVal) && parties.some((p) => p.id === numericVal)) {
      party_id = numericVal;
    } else {
      const party = parties.find((p) => p.party_name === form.party_name);
      party_id = party ? party.id : null;
    }

    if (!party_id) {
      toast.error("Please select a valid party from the list");
      return;
    }

    const payload = {
      vessel_name: form.vessel_name,
      party_id,
      cargo_type: form.cargo_type || "FLYASH",
      quantity: parseFloat(form.quantity) || 0,
      direction: form.direction || "IMPORT",
      expected_date: form.expected_date || getCurrentISTDateValue(),
      status: form.status || selected.status,
    };

    try {
      await dispatch(updateVesselThunk({ id: selected.id, payload })).unwrap();
      await dispatch(fetchVessels({ page: currentPage, per_page: perPage }));
      closeModal();
      toast.success(`Vessel ${form.vessel_name} updated successfully`);
    } catch (err: any) {
      toast.error(err || "Failed to update vessel");
    }
  };

  const handleAction = async (action: string) => {
    if (!selected) return;

    try {
      if (action === "berth") {
        const datetime = form.datetime + ":00";
        await dispatch(
          berthVesselThunk({
            id: selected.id,
            payload: { berthing_datetime: datetime },
          }),
        ).unwrap();
        await dispatch(fetchVessels({ page: currentPage, per_page: perPage }));
        toast.success("Berthing operation recorded successfully");
      } else if (action === "moor") {
        const datetime = form.datetime + ":00";
        await dispatch(
          moorVesselThunk({
            id: selected.id,
            payload: { mooring_datetime: datetime },
          }),
        ).unwrap();
        await dispatch(fetchVessels({ page: currentPage, per_page: perPage }));
        toast.success("Mooring operation recorded successfully");
      } else if (action === "survey") {
        const datetime = form.datetime + ":00";
        const qty = parseFloat(form.survey_quantity) || 0;
        await dispatch(
          surveyVesselThunk({
            id: selected.id,
            payload: { survey_datetime: datetime, survey_quantity: qty },
          }),
        ).unwrap();
        await dispatch(fetchVessels({ page: currentPage, per_page: perPage }));
        toast.success("Survey operation recorded successfully");
      } else if (action === "unberth") {
        const datetime = form.datetime + ":00";
        await dispatch(
          unberthVesselThunk({
            id: selected.id,
            payload: { sailing_datetime: datetime },
          }),
        ).unwrap();
        await dispatch(fetchVessels({ page: currentPage, per_page: perPage }));
        toast.success("Unberthing operation recorded successfully");
      }

      closeModal();
    } catch (err: any) {
      toast.error(err || "Operation failed");
    }
  };

  const fmt = (v: string | null | undefined) =>
    v ? formatDateTimeIST(v) : "—";

  const fmtNum = (n: number | string | null | undefined) =>
    n != null ? Number(n).toLocaleString("en-IN") : "—";

  return (
    <>
      <div className="section-head">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="section-title">VESSEL MANAGEMENT</span>
          <span className="tag">
            {pagination ? pagination.total : vessels.length} {(pagination ? pagination.total : vessels.length) === 1 ? "VESSEL" : "VESSELS"}
          </span>
        </div>
        <Button variant="light" onClick={() => openModal("create")}>
          + NEW VESSEL
        </Button>
      </div>

      <div className="filter-bar">
        {["ALL", "PLANNED", "BERTHED", "MOORED", "COMPLETED"]
          .filter((s) => s === "ALL" || vesselStatuses.includes(s))
          .map((s) => (
            <button
              key={s}
              className={`filter-tab ${filter === s ? "active" : ""}`}
              onClick={() => setFilter(s as any)}
            >
              {s}
            </button>
          ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "4px",
          alignItems: "flex-end",
          background: "var(--bg2)",
          padding: "16px",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ flex: 1, maxWidth: 200 }}>
          <Input
            label="Start Date"
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, start: e.target.value }))
            }
          />
        </div>
        <div style={{ flex: 1, maxWidth: 200 }}>
          <Input
            label="End Date"
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, end: e.target.value }))
            }
          />
        </div>
        <div style={{ flex: 1, maxWidth: 300 }}>
          <SearchableSelect
            label="Vessel Name"
            placeholder="All Vessels"
            options={[
              { value: "", label: "All Vessels" },
              ...uniqueVesselNames.map((name) => ({
                value: name,
                label: name,
              })),
            ]}
            value={filterVesselName}
            onChange={(val) => setFilterVesselName(val)}
          />
        </div>
        <div>
          <Button
            variant="ghost"
            onClick={() => {
              setDateRange({ start: defaultStartDate, end: defaultEndDate });
              setFilterVesselName("");
            }}
          >
            CLEAR
          </Button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Vessel Name</th>
              <th>Party</th>
              <th>Cargo</th>
              <th>Qty (MT)</th>
              <th>Direction</th>
              <th>
                <button
                  type="button"
                  onClick={() =>
                    setCreatedAtSort((current) =>
                      current === "latest" ? "oldest" : "latest",
                    )
                  }
                  style={{
                    background: "transparent",
                    border: 0,
                    padding: 0,
                    color: "inherit",
                    font: "inherit",
                    cursor: "pointer",
                    marginBottom: 2,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span>CREATED</span>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 13, marginLeft: 2 }}
                  >
                    {createdAtSort === "latest" ? "south" : "north"}
                  </span>
                </button>
              </th>
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
                    <div className="empty-icon">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "inherit" }}
                      >
                        anchor
                      </span>
                    </div>
                    <div className="empty-text">No vessels found</div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.id}>
                  <td className="td-primary">{v.vessel_name}</td>
                  <td
                    style={{
                      maxWidth: 150,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {v.party_name}
                  </td>
                  <td>
                    <span className="tag">{v.cargo_type}</span>
                  </td>
                  <td className="font-mono">
                    {fmtNum(v.survey_quantity || v.quantity)}
                  </td>
                  <td>{v.direction}</td>
                  <td className="font-mono" style={{ fontSize: 12 }}>
                    {fmtDateOnly(v.created_at)}
                  </td>
                  <td className="font-mono" style={{ fontSize: 12 }}>
                    {v.expected_date}
                  </td>
                  <td>
                    <StatusBadge status={v.status} />
                  </td>
                  <td>
                    <div className="action-group">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal("detail", v)}
                      >
                        VIEW
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal("edit", v)}
                      >
                        EDIT
                      </Button>
                      {v.status === "PLANNED" && canVesselStatus("PLANNED") && (
                        <Button
                          variant="amber"
                          size="sm"
                          onClick={() => openModal("berth", v)}
                        >
                          BERTH
                        </Button>
                      )}
                      {v.status === "BERTHED" && canVesselStatus("BERTHED") && (
                        <Button
                          variant="light"
                          size="sm"
                          onClick={() => openModal("moor", v)}
                        >
                          MOOR
                        </Button>
                      )}
                      {v.status === "MOORED" && canVesselStatus("MOORED") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openModal("survey", v)}
                        >
                          SURVEY
                        </Button>
                      )}
                      {["BERTHED", "MOORED"].includes(v.status) &&
                        (canVesselStatus("BERTHED") ||
                          canVesselStatus("MOORED")) && (
                          <Button
                            variant="green"
                            size="sm"
                            onClick={() => openModal("unberth", v)}
                          >
                            UNBERTH
                          </Button>
                        )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg2)', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ color: 'var(--text2)', fontSize: '13px' }}>
              Showing page <strong style={{ color: 'var(--text)' }}>{pagination.page}</strong> of <strong style={{ color: 'var(--text)' }}>{pagination.total_pages}</strong> ({pagination.total} total items)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text3)' }}>Per Page:</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  background: 'var(--bg3)',
                  border: '1px solid var(--border2)',
                  color: 'var(--text)',
                  padding: '2px 8px',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              PREVIOUS
            </Button>
            {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === pagination.total_pages || Math.abs(p - pagination.page) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span style={{ padding: '4px 8px', color: 'var(--text3)' }}>...</span>}
                    <Button
                      variant={pagination.page === p ? "primary" : "ghost"}
                      size="sm"
                      style={{ minWidth: '32px', padding: '4px' }}
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </Button>
                  </React.Fragment>
                );
              })}
            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              NEXT
            </Button>
          </div>
        </div>
      )}

      {modal === "create" && (
        <Modal
          title="REGISTER NEW VESSEL"
          onClose={closeModal}
          width="850px"
          footer={
            <>
              <Button variant="ghost" onClick={closeModal}>
                CANCEL
              </Button>
              <Button onClick={handleCreate}>CREATE VESSEL</Button>
            </>
          }
        >
          <div className="form-grid">
            <Input
              label="Vessel Name"
              placeholder="M.V. Example"
              value={form.vessel_name || ""}
              onChange={(e) =>
                setForm({ ...form, vessel_name: e.target.value })
              }
            />
            <SearchableSelect
              label="Party Name *"
              placeholder="Party / Client Name"
              value={form.party_name || ""}
              onChange={(value) => setForm({ ...form, party_name: value })}
              options={parties.map((p) => ({
                value: String(p.id),
                label: p.party_name,
              }))}
            />
            <Input
              label="Cargo Type"
              placeholder="FLYASH / COAL / etc."
              value={form.cargo_type || ""}
              onChange={(e) => setForm({ ...form, cargo_type: e.target.value })}
            />
            <Input
              label="Expected Quantity (MT)"
              type="number"
              placeholder="0.00"
              value={form.quantity || ""}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <Select
              label="Direction"
              value={form.direction || "IMPORT"}
              onChange={(e) => setForm({ ...form, direction: e.target.value })}
              options={[
                { value: "IMPORT", label: "Import" },
                { value: "EXPORT", label: "Export" },
              ]}
            />
            <Input
              label="Expected Date"
              type="date"
              value={form.expected_date || ""}
              onChange={(e) =>
                setForm({ ...form, expected_date: e.target.value })
              }
            />
          </div>

          <div style={{ marginTop: "24px" }}>
            {/* <div style={{ color: '#e63946', fontSize: '0.85rem', marginBottom: '8px' }}>
              This section To appear as default in Vessel INFO ( with editable info) user may chang any SLAB QTY/RATE/ GST RATE or remove a row if desired
            </div> */}
            <div
              className="table-wrap"
              style={{ maxHeight: "250px", overflowY: "auto" }}
            >
              <table style={{ margin: 0, width: "100%" }}>
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    backgroundColor: "var(--bg2)",
                  }}
                >
                  <tr>
                    <th>Activity</th>
                    <th>Formula</th>
                    <th>Rate</th>
                    <th>GST %</th>
                    <th>Min Qty</th>
                    <th>Max Qty</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {chargeLines.map((line: any, idx: number) => (
                    <tr key={idx}>
                      <td>{line.activity}</td>
                      <td>{line.formula}</td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: "4px 8px", height: "32px" }}
                          value={line.rate}
                          onChange={(e) =>
                            updateChargeLine(
                              idx,
                              "rate",
                              e.target.value !== ""
                                ? parseFloat(e.target.value)
                                : "",
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: "4px 8px", height: "32px" }}
                          value={line.gst_rate}
                          onChange={(e) =>
                            updateChargeLine(
                              idx,
                              "gst_rate",
                              e.target.value !== ""
                                ? parseFloat(e.target.value)
                                : "",
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: "4px 8px", height: "32px" }}
                          value={line.min_qty}
                          onChange={(e) =>
                            updateChargeLine(
                              idx,
                              "min_qty",
                              e.target.value !== ""
                                ? parseFloat(e.target.value)
                                : "",
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: "4px 8px", height: "32px" }}
                          value={line.max_qty}
                          onChange={(e) =>
                            updateChargeLine(
                              idx,
                              "max_qty",
                              e.target.value !== ""
                                ? parseFloat(e.target.value)
                                : "",
                            )
                          }
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => confirmRemoveChargeLine(idx)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#e63946",
                            padding: "4px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "18px" }}
                          >
                            delete
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {chargeLines.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign: "center",
                          padding: "16px",
                          color: "#666",
                        }}
                      >
                        No charges available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {modal === "edit" && selected && (
        <Modal
          title={`EDIT VESSEL — ${selected.vessel_auto_id}`}
          onClose={closeModal}
          width="600px"
          footer={
            <>
              <Button variant="ghost" onClick={closeModal}>
                CANCEL
              </Button>
              <Button onClick={handleEditVessel}>SAVE CHANGES</Button>
            </>
          }
        >
          <div className="form-grid">
            <Input
              label="Vessel Name"
              placeholder="M.V. Example"
              value={form.vessel_name || ""}
              onChange={(e) =>
                setForm({ ...form, vessel_name: e.target.value })
              }
            />
            <SearchableSelect
              label="Party Name *"
              placeholder="Party / Client Name"
              value={form.party_name || ""}
              onChange={(value) => setForm({ ...form, party_name: value })}
              options={parties.map((p) => ({
                value: String(p.id),
                label: p.party_name,
              }))}
            />
            <Input
              label="Cargo Type"
              placeholder="FLYASH / COAL / etc."
              value={form.cargo_type || ""}
              onChange={(e) => setForm({ ...form, cargo_type: e.target.value })}
            />
            <Input
              label="Expected Quantity (MT)"
              type="number"
              placeholder="0.00"
              value={form.quantity || ""}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <Select
              label="Direction"
              value={form.direction || "IMPORT"}
              onChange={(e) => setForm({ ...form, direction: e.target.value })}
              options={[
                { value: "IMPORT", label: "Import" },
                { value: "EXPORT", label: "Export" },
              ]}
            />

            <Select
              label="Status"
              value={form.status || ""}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={vesselStatuses.map((s: string) => ({
                value: s,
                label: s,
              }))}
            />
          </div>
        </Modal>
      )}

      {modal === "berth" && selected && (
        <Modal
          title={`BERTH — ${selected.vessel_name}`}
          onClose={closeModal}
          footer={
            <>
              <Button variant="ghost" onClick={closeModal}>
                CANCEL
              </Button>
              <Button variant="amber" onClick={() => handleAction("berth")}>
                CONFIRM BERTHING
              </Button>
            </>
          }
        >
          <Input
            label="Date & Time of Berthing"
            type="datetime-local"
            value={form.datetime || ""}
            onChange={(e) => setForm({ ...form, datetime: e.target.value })}
          />
        </Modal>
      )}

      {modal === "moor" && selected && (
        <Modal
          title={`MOOR — ${selected.vessel_name}`}
          onClose={closeModal}
          footer={
            <>
              <Button variant="ghost" onClick={closeModal}>
                CANCEL
              </Button>
              <Button variant="primary" onClick={() => handleAction("moor")}>
                CONFIRM MOORING
              </Button>
            </>
          }
        >
          <Input
            label="Date & Time of Mooring"
            type="datetime-local"
            value={form.datetime || ""}
            onChange={(e) => setForm({ ...form, datetime: e.target.value })}
          />
        </Modal>
      )}

      {modal === "survey" && selected && (
        <Modal
          title={`SURVEY REPORT — ${selected.vessel_name}`}
          onClose={closeModal}
          footer={
            <>
              <Button variant="ghost" onClick={closeModal}>
                CANCEL
              </Button>
              <Button variant="primary" onClick={() => handleAction("survey")}>
                SAVE SURVEY
              </Button>
            </>
          }
        >
          <div className="form-grid">
            <Input
              label="Survey Quantity (MT)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.survey_quantity || ""}
              onChange={(e) =>
                setForm({ ...form, survey_quantity: e.target.value })
              }
            />
            <Input
              label="Survey Date & Time"
              type="datetime-local"
              value={form.datetime || ""}
              onChange={(e) => setForm({ ...form, datetime: e.target.value })}
            />
          </div>
        </Modal>
      )}

      {modal === "unberth" && selected && (
        <Modal
          title={`UNBERTH — ${selected.vessel_name}`}
          onClose={closeModal}
          footer={
            <>
              <Button variant="ghost" onClick={closeModal}>
                CANCEL
              </Button>
              <Button variant="green" onClick={() => handleAction("unberth")}>
                CONFIRM UNBERTHING
              </Button>
            </>
          }
        >
          <Input
            label="Date & Time of Sailing / Unberthing"
            type="datetime-local"
            value={form.datetime || ""}
            onChange={(e) => setForm({ ...form, datetime: e.target.value })}
          />
        </Modal>
      )}

      {modal === "detail" && selected && (
        <Modal
          title={`VESSEL DETAILS — ${selected.vessel_auto_id}`}
          onClose={closeModal}
          footer={
            <Button variant="ghost" onClick={closeModal}>
              CLOSE
            </Button>
          }
        >
          <div className="detail-grid">
            {[
              ["Vessel Name", selected.vessel_name],
              ["Auto ID", selected.vessel_auto_id, true],
              ["Party", selected.party_name],
              ["Cargo Type", selected.cargo_type],
              ["Direction", selected.direction],
              ["Expected Qty", `${fmtNum(selected.quantity)} MT`],
              [
                "Survey Qty",
                selected.survey_quantity
                  ? `${fmtNum(selected.survey_quantity)} MT`
                  : "—",
              ],
              ["Status", null, false, selected.status],
              ["Expected Date", selected.expected_date, true],
              ["Berthing", fmt(selected.berthing_datetime), true],
              ["Mooring", fmt(selected.mooring_datetime), true],
              ["Sailing", fmt(selected.sailing_datetime), true],
            ].map(([k, v, mono, status]: any) => (
              <div className="detail-cell" key={k}>
                <div className="detail-key">{k}</div>
                {status ? (
                  <StatusBadge status={status} />
                ) : (
                  <div className={`detail-val ${mono ? "mono" : ""}`}>{v}</div>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <div className="detail-key" style={{ marginBottom: 10 }}>
              WORKFLOW TIMELINE
            </div>
            <div className="timeline">
              {[
                {
                  label: "Vessel Planned",
                  time: selected.expected_date,
                  done: true,
                  icon: "assignment",
                },
                {
                  label: "Berthed",
                  time: fmt(selected.berthing_datetime),
                  done: !!selected.berthing_datetime,
                  active: selected.status === "BERTHED",
                  icon: "anchor",
                },
                {
                  label: "Moored",
                  time: fmt(selected.mooring_datetime),
                  done: !!selected.mooring_datetime,
                  active: selected.status === "MOORED",
                  icon: "link",
                },
                {
                  label: "Survey Complete",
                  time: fmt(selected.survey_datetime),
                  done: !!selected.survey_datetime,
                  icon: "analytics",
                },
                {
                  label: "Unberthed / Completed",
                  time: fmt(selected.sailing_datetime),
                  done: !!selected.sailing_datetime,
                  icon: "sailing",
                },
              ].map((step) => (
                <div className="timeline-step" key={step.label}>
                  <div
                    className={`timeline-dot ${step.done ? "dot-done" : step.active ? "dot-active" : "dot-pending"}`}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "inherit" }}
                    >
                      {step.icon}
                    </span>
                  </div>
                  <div className="timeline-info">
                    <div className="timeline-label">{step.label}</div>
                    <div className="timeline-time">
                      {step.time || "Pending"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="CONFIRM DELETE"
        message="Do you want to Delete this item? This action cannot be undone."
        type="confirm"
        confirmText="YES, DELETE"
        cancelText="NO, CANCEL"
        onConfirm={handleRemoveChargeLine}
        onCancel={() => setDeleteDialog({ isOpen: false, idx: null })}
      />
    </>
  );
};

export default VesselsPage;
