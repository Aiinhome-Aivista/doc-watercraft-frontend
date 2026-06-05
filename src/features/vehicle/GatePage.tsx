import React, { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addGateEntry,
  updateGateStatus,
  fetchGateEntries,
  createGateEntryThunk,
  recordWbinThunk,
  recordWboutThunk,
  recordCargoOpThunk,
  recordGateOutThunk,
} from "@/store/slices/vehicleSlice";
import { fetchVessels } from "@/store/slices/vesselSlice";
import { GateEntry, GateStatus } from "@/types/vehicle";
import {
  Modal,
  Input,
  Select,
  Button,
  StatusBadge,
  SearchableSelect,
} from "@/components/ui";
import {
  formatDateTimeIST,
  getCurrentISTDateTimeLocalValue,
} from "@/utils/dateTime";
import { useAccessRights } from "@/hooks/useAccessRights";
import toast from "react-hot-toast";
import { vehicleMasterService } from "@/services/vehicleMasterService";
import { partyService } from "@/services/partyService";

const GatePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const entries = useAppSelector((state) => state.vehicles.entries);
  const pagination = useAppSelector((state) => state.vehicles.pagination);
  const vessels = useAppSelector((state) => state.vessels.items);
  const { canGateOp, gateOperations } = useAccessRights();

  const [filter, setFilter] = useState<
    GateStatus | "ALL" | "LOADING/UNLOADING"
  >("ALL");
  const [gateInSort, setGateInSort] = useState<"latest" | "oldest">("latest");

  const defaultStartDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const defaultEndDate = new Date().toISOString().split("T")[0];

  const [dateRange, setDateRange] = useState({
    start: defaultStartDate,
    end: defaultEndDate,
  });
  const [filterGateInNo, setFilterGateInNo] = useState<string>("");
  const [filterVehicleNo, setFilterVehicleNo] = useState<string>("");
  const [modal, setModal] = useState<
    "create" | "operation" | "detail" | "wbin" | "wbout" | "gateout" | null
  >(null);

  const [vehiclesList, setVehiclesList] = useState<any[]>([]);
  const [partiesList, setPartiesList] = useState<any[]>([]);
  const [operationMode, setOperationMode] = useState<"record" | "update">(
    "record",
  );
  const [selected, setSelected] = useState<GateEntry | null>(null);
  const [form, setForm] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const handleChange = (field: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handlePageChange = (newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= pagination.total_pages) {
      setCurrentPage(newPage);
    }
  };

  // Fetch from server — only page + per_page (backend does not support date/status filtering)
  useEffect(() => {
    dispatch(
      fetchGateEntries({
        page: currentPage,
        per_page: perPage,
      }),
    );
  }, [dispatch, currentPage, perPage]);

  useEffect(() => {
    dispatch(fetchVessels());
  }, [dispatch]);

  useEffect(() => {
    if (modal === "create") {
      vehicleMasterService
        .getVehicleMasters()
        .then((res) => {
          setVehiclesList(Array.isArray(res) ? res : res.data || []);
        })
        .catch(console.error);
      partyService
        .getPartyMasters()
        .then((res) => {
          setPartiesList(Array.isArray(res) ? res : res.data || []);
        })
        .catch(console.error);
    }
  }, [modal]);

  const getDateMs = (value: string | null | undefined) => {
    if (!value) return 0;
    const normalized = value.includes("T") ? value : value.replace(" ", "T");
    const withOffset = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)
      ? normalized
      : `${normalized}+05:30`;
    const parsed = new Date(withOffset).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const filtered = useMemo(() => {
    let base = entries.filter((entry) => {
      if (filter === "ALL") return true;
      if (filter === "LOADING/UNLOADING") {
        const status = String(entry.status || "").toUpperCase();
        return status === "LOADING" || status === "UNLOADING";
      }
      return entry.status === filter;
    });

    if (dateRange.start || dateRange.end) {
      base = base.filter((entry) => {
        const entryMs = getDateMs(entry.gate_in_datetime);
        const startMs = dateRange.start
          ? new Date(dateRange.start).getTime()
          : 0;
        const endMs = dateRange.end
          ? new Date(dateRange.end).getTime() + 86400000
          : Infinity;
        return entryMs >= startMs && entryMs <= endMs;
      });
    }

    if (filterGateInNo) {
      base = base.filter((entry) => entry.gate_in_no === filterGateInNo);
    }

    if (filterVehicleNo) {
      base = base.filter((entry) =>
        entry.vehicle_no.toLowerCase().includes(filterVehicleNo.toLowerCase()),
      );
    }

    return [...base].sort((a, b) => {
      const diff =
        getDateMs(a.gate_in_datetime) - getDateMs(b.gate_in_datetime);
      return gateInSort === "latest" ? -diff : diff;
    });
  }, [entries, filter, gateInSort, dateRange, filterGateInNo, filterVehicleNo]);

  const uniqueGateInNos = useMemo(() => {
    return Array.from(new Set(entries.map((entry) => entry.gate_in_no)));
  }, [entries]);
  const mooredVessels = vessels.filter((v) =>
    ["PLANNED", "MOORED", "BERTHED"].includes(v.status),
  );

  const nowDt = () => getCurrentISTDateTimeLocalValue();

  const getOperationTypeByDirection = (direction?: string) => {
    return String(direction || "").toUpperCase() === "EXPORT"
      ? "UNLOADING"
      : "LOADING";
  };

  const openModal = (
    type: any,
    entry: GateEntry | null = null,
    mode: "record" | "update" = "record",
  ) => {
    setSelected(entry);
    if (
      (type === "operation" ||
        type === "wbin" ||
        type === "wbout" ||
        type === "gateout") &&
      entry
    ) {
      const statusText = String(entry.status || "").toUpperCase();
      setOperationMode(mode);
      setForm({
        start_datetime: nowDt(),
        end_datetime: nowDt(),
        datetime: nowDt(),
        direction: entry.direction || "",
        compressor_no: entry.compressor_no || "",
        weighment_slip_no: entry.weighment_slip_no || "",
        gross_weight: entry.gross_weight?.toString() || "",
        tare_weight: entry.tare_weight?.toString() || "",
        wbout_gross_weight: "",
        wbout_tare_weight: "",
        vessel_id: entry.vessel_id ? String(entry.vessel_id) : "",
        op_type:
          statusText === "LOADING" || statusText === "UNLOADING"
            ? statusText
            : getOperationTypeByDirection(entry.direction),
      });
    } else {
      setForm({
        datetime: nowDt(),
        gate_in_datetime: nowDt(),
        direction: "IMPORT",
        own_weighbridge: "0",
      });
    }
    setModal(type);
    setErrors({});
  };

  const closeModal = () => {
    setModal(null);
    setOperationMode("record");
    setSelected(null);
    setForm({});
    setErrors({});
  };

  const handleVehicleChange = (vehicleNo: string) => {
    const v = vehiclesList.find((x) => x.vehicle_no === vehicleNo);
    setForm((prev: any) => ({
      ...prev,
      vehicle_no: vehicleNo,
      transporter_name: v ? v.transporter_name : prev.transporter_name,
    }));
    if (errors.vehicle_no) setErrors((prev) => ({ ...prev, vehicle_no: "" }));
  };

  const handleCreate = async () => {
    const newErrors: Record<string, string> = {};

    if (!form.direction) newErrors.direction = "Direction is required";
    if (!form.vehicle_no) newErrors.vehicle_no = "Vehicle No is required";
    if (!form.party_id) newErrors.party_id = "Consignor / Party is required";

    const ownWb = parseInt(form.own_weighbridge || "0") as 0 | 1;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const vehicle = vehiclesList.find((x) => x.vehicle_no === form.vehicle_no);
    const vehicleId = vehicle ? vehicle.id : 0;

    const outsideGross = form.outside_gross_weight
      ? Number(form.outside_gross_weight)
      : undefined;
    const outsideTare = form.outside_tare_weight
      ? Number(form.outside_tare_weight)
      : undefined;
    const outsideNet = form.outside_net_weight
      ? Number(form.outside_net_weight)
      : outsideGross !== undefined && outsideTare !== undefined
        ? Number((outsideGross - outsideTare).toFixed(2))
        : undefined;

    const payload = {
      party_id: Number(form.party_id),
      challan_invoice_no: form.challan_invoice_no || "",
      vehicle_id: vehicleId,
      gate_in_datetime:
        (form.gate_in_datetime || "").replace("T", " ") +
        ((form.gate_in_datetime || "").split(":").length === 2 ? ":00" : ""),
      weighment_slip_no: form.weighment_slip_no || null,
      outside_gross_weight: outsideGross,
      outside_tare_weight: outsideTare,
      outside_net_weight: outsideNet,
      outside_payment_slip: form.outside_payment_slip || null,
      own_weighbridge: ownWb,
      direction: form.direction,
    };

    try {
      const res = await dispatch(createGateEntryThunk(payload)).unwrap();

      dispatch(fetchGateEntries({ page: currentPage, per_page: perPage }));
      closeModal();
      toast.success("Gate-In recorded successfully");
    } catch (err: any) {
      setErrors({ global: err || "Failed to record Gate-In" });
    }
  };

  const handleAction = async (status: GateStatus) => {
    if (!selected) return;

    try {
      if (status === "UNLOADING" || status === "PENDING_WBOUT") {
        const operationDateTime =
          operationMode === "update" ? form.end_datetime : form.start_datetime;
        if (!operationDateTime) {
          toast.error(
            operationMode === "update"
              ? "Please provide End Date & Time"
              : "Please provide Start Date & Time",
          );
          return;
        }

        if (operationMode === "update") {
          const operationId = Number(selected.cargo_operation_id);
          if (!Number.isFinite(operationId) || operationId <= 0) {
            toast.error("Cargo Operation ID not found for update");
            return;
          }

          const payload = {
            operation_id: operationId,
            gate_entry_id: selected.id,
            operation_type:
              form.op_type || getOperationTypeByDirection(selected.direction),
            end_datetime:
              (operationDateTime || "").replace("T", " ") +
              ((operationDateTime || "").split(":").length === 2 ? ":00" : ""),
            compressor_no: form.compressor_no || "",
            remarks: form.remarks || "",
            vessel_id: form.vessel_id ? Number(form.vessel_id) : undefined,
          };

          await dispatch(recordCargoOpThunk(payload)).unwrap();
          dispatch(fetchGateEntries({ page: currentPage, per_page: perPage }));
          closeModal();
          toast.success("Cargo operation recorded successfully");
          return;
        }

        const payload = {
          gate_entry_id: selected.id,
          operation_type:
            form.op_type || getOperationTypeByDirection(selected.direction),
          start_datetime:
            (operationDateTime || "").replace("T", " ") +
            ((operationDateTime || "").split(":").length === 2 ? ":00" : ""),
          compressor_no: form.compressor_no || "",
          remarks: form.remarks || "",
          vessel_id: form.vessel_id ? Number(form.vessel_id) : undefined,
        };
        await dispatch(recordCargoOpThunk(payload)).unwrap();
        dispatch(fetchGateEntries({ page: currentPage, per_page: perPage }));
        closeModal();
        toast.success("Cargo operation recorded successfully");
        return;
      }
    } catch (err: any) {
      toast.error(err || "Failed to record operation");
    }
  };

  const handleWbin = async () => {
    if (!selected || !form.datetime) {
      toast.error("Please provide weighbridge date and time");
      return;
    }

    const isImport =
      String(form.direction || selected.direction || "").toUpperCase() ===
      "IMPORT";
    const isExport =
      String(form.direction || selected.direction || "").toUpperCase() ===
      "EXPORT";
    const grossWeight = Number(form.gross_weight || 0);
    const tareWeight = Number(form.tare_weight || 0);

    if (isImport && (!form.tare_weight || tareWeight <= 0)) {
      toast.error("Please provide Tare Wt for IMPORT WBIN");
      return;
    }

    if (isExport && (!form.gross_weight || grossWeight <= 0)) {
      toast.error("Please provide Gross Wt for EXPORT WBIN");
      return;
    }

    try {
      await dispatch(
        recordWbinThunk({
          gate_entry_id: selected.id,
          weighment_slip_no: form.weighment_slip_no || "",
          wbin_datetime: form.datetime + ":00",
          tare_weight: isImport ? tareWeight : undefined,
          gross_weight: isExport ? grossWeight : undefined,
        }),
      ).unwrap();
      closeModal();
      toast.success("WBIN recorded successfully");
    } catch (err: any) {
      toast.error(err || "Failed to record WBIN");
    }
  };

  const handleWbout = async () => {
    if (!selected || !form.datetime) {
      toast.error("Please provide weighbridge date and time");
      return;
    }

    const isImport =
      String(form.direction || selected.direction || "").toUpperCase() ===
      "IMPORT";
    const isExport =
      String(form.direction || selected.direction || "").toUpperCase() ===
      "EXPORT";
    const grossWeight = Number(form.wbout_gross_weight || 0);
    const tareWeight = Number(form.wbout_tare_weight || 0);

    if (isImport && (!form.wbout_gross_weight || grossWeight <= 0)) {
      toast.error("Please provide Gross Wt for IMPORT WBOUT");
      return;
    }

    if (isExport && (!form.wbout_tare_weight || tareWeight <= 0)) {
      toast.error("Please provide Tare Wt for EXPORT WBOUT");
      return;
    }

    try {
      await dispatch(
        recordWboutThunk({
          gate_entry_id: selected.id,
          weighment_slip_no: form.weighment_slip_no || "",
          wbout_datetime:
            (form.datetime || "").replace("T", " ") +
            ((form.datetime || "").split(":").length === 2 ? ":00" : ""),
          gross_weight: isImport ? grossWeight : undefined,
          tare_weight: isExport ? tareWeight : undefined,
        }),
      ).unwrap();
      closeModal();
      toast.success("WBOUT recorded successfully");
    } catch (err: any) {
      toast.error(err || "Failed to record WBOUT");
    }
  };

  const handleGateOut = async () => {
    if (!selected || !form.datetime) {
      toast.error("Please provide Gate-Out date and time");
      return;
    }

    try {
      await dispatch(
        recordGateOutThunk({
          gate_entry_id: selected.id,
          gate_out_datetime:
            (form.datetime || "").replace("T", " ") +
            ((form.datetime || "").split(":").length === 2 ? ":00" : ""),
        }),
      ).unwrap();
      closeModal();
      toast.success("Gate-out recorded successfully");
    } catch (err: any) {
      toast.error(err || "Failed to record Gate-Out");
    }
  };

  const fmt = (v: string | null | undefined) =>
    v ? formatDateTimeIST(v) : "—";

  const getWorkflowSteps = (entry: GateEntry) => {
    const statusOrder = [
      "PENDING_WBIN",
      "WBIN_DONE",
      "LOADING",
      "UNLOADING",
      "PENDING_WBOUT",
      "GATE_OUT",
      "COMPLETED",
    ];
    const currentIndex = statusOrder.indexOf(String(entry.status));

    return [
      {
        key: "PENDING_WBIN",
        label: "Gate-In / Awaiting WBIN",
        time: fmt(entry.gate_in_datetime),
        icon: "local_shipping",
      },
      {
        key: "WBIN_DONE",
        label: "WBIN Done",
        time: fmt(entry.wbin_datetime || null),
        icon: "scale",
      },
      {
        key: "LOADING/UNLOADING",
        label: "Cargo Operation",
        time: entry.compressor_no
          ? `Compressor: ${entry.compressor_no}`
          : "Pending",
        icon: "construction",
      },
      {
        key: "PENDING_WBOUT",
        label: "Awaiting WBOUT",
        time: "-",
        icon: "receipt_long",
      },
      {
        key: "GATE_OUT",
        label: "Awaiting Gate-Out",
        time: "-",
        icon: "directions_car",
      },
      {
        key: "COMPLETED",
        label: "Gate-Out Completed",
        time: fmt(entry.gate_out_datetime),
        icon: "check_circle",
      },
    ].map((step) => {
      const isCargoStep = step.key === "LOADING/UNLOADING";
      const isActive = isCargoStep
        ? entry.status === "LOADING" || entry.status === "UNLOADING"
        : entry.status === step.key;
      const done = isCargoStep
        ? currentIndex >= 2
        : currentIndex >= statusOrder.indexOf(step.key);
      return { ...step, done, active: isActive };
    });
  };

  return (
    <>
      <div className="section-head">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="section-title">VEHICLE GATE MANAGEMENT</span>
          <span className="tag">
            {pagination ? pagination.total : entries.length}{" "}
            {(pagination ? pagination.total : entries.length) === 1
              ? "ENTRY"
              : "ENTRIES"}
          </span>
        </div>
        <Button variant="light" onClick={() => openModal("create")}>
          + GATE IN
        </Button>
      </div>

      <div
        className="stat-card"
        style={
          {
            marginBottom: 16,
            "--accent-color": "var(--accent)",
          } as React.CSSProperties
        }
      >
        <div className="stat-label">
          Weighbridge operations are managed in the dedicated Weighbridge
          Terminal page.
        </div>
      </div>

      <div className="filter-bar">
        {[
          "ALL",
          "PENDING_WBIN",
          "WBIN_DONE",
          "LOADING/UNLOADING",
          "PENDING_WBOUT",
          "GATE_OUT",
          "COMPLETED",
        ]
          .filter((s) => {
            if (s === "ALL") return true;
            // Map display keys to API keys
            const apiKey = s === "LOADING/UNLOADING" ? "UNLOADING" : s;
            return gateOperations.includes(apiKey);
          })
          .map((s) => (
            <button
              key={s}
              className={`filter-tab ${filter === s ? "active" : ""}`}
              onClick={() => setFilter(s as any)}
            >
              {s.replace(/_/g, " ")}
            </button>
          ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: "16px",
          alignItems: "flex-end",
          marginBottom: "4px",
          background: "var(--bg2)",
          padding: "16px",
          border: "1px solid var(--border)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: "150px", maxWidth: "200px" }}>
          <Input
            label="Start Date"
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, start: e.target.value }))
            }
          />
        </div>
        <div style={{ flex: 1, minWidth: "150px", maxWidth: "200px" }}>
          <Input
            label="End Date"
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, end: e.target.value }))
            }
          />
        </div>
        <div style={{ flex: 1, minWidth: "200px", maxWidth: "300px" }}>
          <SearchableSelect
            label="Gate-In No"
            placeholder="All Gate-In Nos"
            options={[
              { value: "", label: "All Gate-In Nos" },
              ...uniqueGateInNos.map((no) => ({ value: no, label: no })),
            ]}
            value={filterGateInNo}
            onChange={(val) => setFilterGateInNo(val)}
          />
        </div>
        <div style={{ flex: 1, minWidth: "150px", maxWidth: "250px" }}>
          <Input
            label="Vehicle No"
            placeholder="Search Vehicle No"
            value={filterVehicleNo}
            onChange={(e) => setFilterVehicleNo(e.target.value)}
          />
        </div>
        <div>
          <Button
            variant="ghost"
            onClick={() => {
              setDateRange({ start: defaultStartDate, end: defaultEndDate });
              setFilterGateInNo("");
              setFilterVehicleNo("");
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
              <th>Gate-In No</th>
              <th>Vehicle</th>
              <th>Vessel</th>
              <th>Party</th>
              <th>Challan</th>
              <th>Transporter</th>
              <th>
                <button
                  type="button"
                  onClick={() =>
                    setGateInSort((current) =>
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
                  <span>GATE IN</span>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 13, marginLeft: 2 }}
                  >
                    {gateInSort === "latest" ? "south" : "north"}
                  </span>
                </button>
              </th>
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
                        local_shipping
                      </span>
                    </div>
                    <div className="empty-text">No entries found</div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id}>
                  <td className="td-mono">{e.gate_in_no}</td>
                  <td className="td-primary">{e.vehicle_no}</td>
                  <td style={{ fontSize: 12 }}>{e.vessel_name || "—"}</td>
                  <td style={{ fontSize: 12 }}>
                    {e.party_name || e.consignor_name || "—"}
                  </td>
                  <td className="font-mono" style={{ fontSize: 12 }}>
                    {e.challan_invoice_no}
                  </td>
                  <td style={{ fontSize: 12 }}>{e.transporter_name || "—"}</td>
                  <td className="font-mono" style={{ fontSize: 11 }}>
                    {fmt(e.gate_in_datetime)}
                  </td>
                  <td>
                    <StatusBadge status={e.status} />
                  </td>
                  <td>
                    <div className="action-group">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal("detail", e)}
                      >
                        VIEW
                      </Button>
                      {e.status === "WBIN_DONE" && canGateOp("WBIN_DONE") && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openModal("operation", e, "record")}
                        >
                          RECORD OP
                        </Button>
                      )}
                      {(e.status === "LOADING" || e.status === "UNLOADING") &&
                        canGateOp("UNLOADING") && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openModal("operation", e, "update")}
                          >
                            UPDATE OP
                          </Button>
                        )}
                      {e.status === "PENDING_WBIN" &&
                        canGateOp("PENDING_WBIN") && (
                          <Button
                            variant="amber"
                            size="sm"
                            onClick={() => openModal("wbin", e)}
                          >
                            WBIN
                          </Button>
                        )}
                      {e.status === "PENDING_WBOUT" &&
                        canGateOp("PENDING_WBOUT") && (
                          <Button
                            variant="green"
                            size="sm"
                            onClick={() => openModal("wbout", e)}
                          >
                            WBOUT
                          </Button>
                        )}
                      {e.status === "GATE_OUT" && canGateOp("GATE_OUT") && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openModal("gateout", e)}
                        >
                          GATE OUT
                        </Button>
                      )}
                      {e.status === "COMPLETED" && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--green)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14 }}
                          >
                            check_circle
                          </span>{" "}
                          Done
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {pagination && pagination.total > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 20px",
              borderTop: "1px solid var(--border)",
              background: "var(--bg2)",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ color: "var(--text2)", fontSize: "13px" }}>
                Showing page{" "}
                <strong style={{ color: "var(--text)" }}>
                  {pagination.page}
                </strong>{" "}
                of{" "}
                <strong style={{ color: "var(--text)" }}>
                  {pagination.total_pages}
                </strong>{" "}
                ({pagination.total} total items)
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span style={{ fontSize: "12px", color: "var(--text3)" }}>
                  Per Page:
                </span>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    background: "var(--bg3)",
                    border: "1px solid var(--border2)",
                    color: "var(--text)",
                    padding: "2px 8px",
                    fontSize: "12px",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  {[5, 10, 20, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Button
                variant="ghost"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                PREVIOUS
              </Button>
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === pagination.total_pages ||
                    Math.abs(p - pagination.page) <= 1,
                )
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && (
                        <span
                          style={{ padding: "4px 8px", color: "var(--text3)" }}
                        >
                          ...
                        </span>
                      )}
                      <Button
                        variant={pagination.page === p ? "primary" : "ghost"}
                        className="flex justify-center items-center"
                        size="sm"
                        style={{ minWidth: "32px", padding: "4px" }}
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
      </div>

      {modal === "create" && (
        <Modal
          title="NEW GATE ENTRY"
          onClose={closeModal}
          footer={
            <>
              <Button variant="ghost" onClick={closeModal}>
                CANCEL
              </Button>
              <Button onClick={handleCreate}>CONFIRM GATE-IN</Button>
            </>
          }
        >
          <div className="form-grid">
            {errors.global && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: "12px",
                  backgroundColor: "rgba(230, 57, 70, 0.1)",
                  border: "1px solid #e63946",
                  borderRadius: "8px",
                  color: "#e63946",
                  fontSize: "14px",
                  textAlign: "center",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  width: "100%",
                }}
              >
                {errors.global}
              </div>
            )}

            <SearchableSelect
              label="Vehicle No *"
              value={form.vehicle_no || ""}
              onChange={handleVehicleChange}
              error={errors.vehicle_no}
              options={[
                { value: "", label: "Select Vehicle No" },
                ...vehiclesList
                  .filter((v) => v.active === 1)
                  .map((v) => ({ value: v.vehicle_no, label: v.vehicle_no })),
              ]}
              placeholder="Select Vehicle No"
            />
            <Input
              label="Transporter Name"
              value={form.transporter_name || ""}
              onChange={(e) => handleChange("transporter_name", e.target.value)}
            />
            <Select
              label="Direction *"
              value={form.direction || "IMPORT"}
              onChange={(e) => handleChange("direction", e.target.value)}
              error={errors.direction}
              options={[
                { value: "IMPORT", label: "IMPORT" },
                { value: "EXPORT", label: "EXPORT" },
              ]}
            />
            <Input
              label="Gate-In Date & Time"
              type="datetime-local"
              value={form.gate_in_datetime || ""}
              onChange={(e) => handleChange("gate_in_datetime", e.target.value)}
            />
            <SearchableSelect
              label="Consignor Name *"
              placeholder="Select Consignor / Party"
              value={form.party_id ? String(form.party_id) : ""}
              onChange={(value) => handleChange("party_id", value)}
              error={errors.party_id}
              options={[
                { value: "", label: "Select Consignor / Party" },
                ...partiesList.map((p) => ({
                  value: String(p.id),
                  label: p.party_name,
                })),
              ]}
            />
            <Input
              label="Challan / Invoice No"
              value={form.challan_invoice_no || ""}
              onChange={(e) =>
                handleChange("challan_invoice_no", e.target.value)
              }
            />

            <Input
              label="Outside Weighment Slip No"
              value={form.outside_payment_slip || ""}
              onChange={(e) =>
                handleChange("outside_payment_slip", e.target.value)
              }
            />
            <Input
              label="Outside Gross Weight"
              type="number"
              value={form.outside_gross_weight || ""}
              onChange={(e) => {
                const value = e.target.value;
                const gross = Number(value || 0);
                const tare = Number(form.outside_tare_weight || 0);
                setForm((prev: any) => ({
                  ...prev,
                  outside_gross_weight: value,
                  outside_net_weight:
                    gross && tare ? (gross - tare).toFixed(2) : "",
                }));
              }}
            />
            <Input
              label="Outside Tare Weight"
              type="number"
              value={form.outside_tare_weight || ""}
              onChange={(e) => {
                const value = e.target.value;
                const gross = Number(form.outside_gross_weight || 0);
                const tare = Number(value || 0);
                setForm((prev: any) => ({
                  ...prev,
                  outside_tare_weight: value,
                  outside_net_weight:
                    gross && tare ? (gross - tare).toFixed(2) : "",
                }));
              }}
            />
            <Input
              label="Outside Net Weight"
              type="number"
              value={form.outside_net_weight || ""}
              readOnly
            />

            <Select
              label="Own Weighbridge? (≥60T skips WBIN)"
              value={
                form.direction === "IMPORT" ? "0" : form.own_weighbridge || "0"
              }
              disabled={form.direction === "IMPORT"}
              onChange={(e) => handleChange("own_weighbridge", e.target.value)}
              options={[
                { value: "0", label: "No — Needs WBIN" },
                { value: "1", label: "Yes — Skip to WBOUT" },
              ]}
            />
          </div>
        </Modal>
      )}

      {modal === "operation" && selected && (
        <Modal
          title={`CARGO OPERATION — ${selected.vehicle_no}`}
          onClose={closeModal}
          footer={
            <Button
              variant="primary"
              onClick={() => handleAction("PENDING_WBOUT")}
            >
              {operationMode === "update"
                ? "UPDATE OPERATION"
                : "RECORD OPERATION"}
            </Button>
          }
        >
          <div className="form-grid">
            <SearchableSelect
              label="Vessel"
              value={form.vessel_id || ""}
              onChange={(val) => {
                const selectedVessel = vessels.find(
                  (v) => v.id.toString() === val,
                );
                const newDir = selectedVessel
                  ? selectedVessel.direction
                  : form.direction || selected.direction || "";
                setForm({
                  ...form,
                  vessel_id: val,
                  direction: newDir,
                  op_type: getOperationTypeByDirection(newDir),
                });
              }}
              options={[
                { value: "", label: "Select Vessel" },
                ...vessels
                  .filter(
                    (v) =>
                      String(v.direction).toUpperCase() ===
                      String(selected.direction).toUpperCase(),
                  )
                  .map((v) => ({
                    value: v.id.toString(),
                    label: `${v.vessel_name} | ${v.party_name} | ${v.direction}`,
                  })),
              ]}
              placeholder="Select Vessel"
            />
            <Input
              label="Direction"
              value={form.direction || selected.direction || ""}
              readOnly
            />
            <Input
              label="Operation Type"
              value={
                form.op_type ||
                getOperationTypeByDirection(
                  form.direction || selected.direction || "",
                )
              }
              readOnly
            />
            {operationMode === "record" && (
              <Input
                label="Start Date & Time"
                type="datetime-local"
                value={form.start_datetime || ""}
                onChange={(e) =>
                  setForm({ ...form, start_datetime: e.target.value })
                }
              />
            )}
            {operationMode === "update" && (
              <Input
                label="End Date & Time"
                type="datetime-local"
                value={form.end_datetime || ""}
                onChange={(e) =>
                  setForm({ ...form, end_datetime: e.target.value })
                }
              />
            )}
            <Input
              label="Compressor No"
              value={form.compressor_no || ""}
              onChange={(e) =>
                setForm({ ...form, compressor_no: e.target.value })
              }
            />
            <Input
              label="Remarks (Optional)"
              value={form.remarks || ""}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            />
          </div>
        </Modal>
      )}

      {modal === "gateout" && selected && (
        <Modal
          title={`GATE OUT — ${selected.vehicle_no}`}
          onClose={closeModal}
          footer={
            <Button variant="primary" onClick={handleGateOut}>
              RECORD GATE OUT
            </Button>
          }
        >
          <div className="form-grid">
            <Input
              label="Gate-Out Date & Time"
              type="datetime-local"
              value={form.datetime || ""}
              onChange={(e) => setForm({ ...form, datetime: e.target.value })}
            />
          </div>
        </Modal>
      )}

      {modal === "detail" && selected && (
        <Modal
          title={`VEHICLE DETAILS — ${selected.gate_in_no}`}
          onClose={closeModal}
          footer={
            <Button variant="ghost" onClick={closeModal}>
              CLOSE
            </Button>
          }
        >
          <div className="detail-grid">
            {[
              ["Gate-In No", selected.gate_in_no, true],
              ["Vehicle No", selected.vehicle_no],
              ["Vessel", selected.vessel_name || "—"],
              ["Direction", selected.direction],
              ["Party", selected.party_name || selected.consignor_name || "—"],
              ["Challan / Invoice", selected.challan_invoice_no, true],
              ["Transporter", selected.transporter_name || "—"],
              ["Weighment Slip", selected.weighment_slip_no || "—", true],
              ["Compressor No", selected.compressor_no || "—"],
              ["Gate-In Time", fmt(selected.gate_in_datetime), true],
              ["Gate-Out Time", fmt(selected.gate_out_datetime), true],
              ["Current Status", null, false, selected.status],
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
              VEHICLE WORKFLOW
            </div>
            <div className="timeline">
              {getWorkflowSteps(selected).map((step) => (
                <div className="timeline-step" key={step.key}>
                  <div
                    className={`timeline-dot ${
                      step.done
                        ? "dot-done"
                        : step.active
                          ? "dot-active"
                          : "dot-pending"
                    }`}
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
                    <div className="timeline-time">{step.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {modal === "wbin" && selected && (
        <Modal
          title={`WBIN — ${selected.vehicle_no}`}
          onClose={closeModal}
          footer={
            <Button variant="amber" onClick={handleWbin}>
              RECORD WBIN
            </Button>
          }
        >
          <div className="form-grid">
            <Input
              label="Weighment Slip No"
              value={form.weighment_slip_no || ""}
              onChange={(e) =>
                setForm({ ...form, weighment_slip_no: e.target.value })
              }
            />
            <Input
              label="Direction"
              value={form.direction || selected.direction || ""}
              readOnly
            />
            <Input
              label="WBIN Date & Time"
              type="datetime-local"
              value={form.datetime || ""}
              onChange={(e) => setForm({ ...form, datetime: e.target.value })}
            />
            {String(
              form.direction || selected.direction || "",
            ).toUpperCase() === "IMPORT" && (
              <Input
                label="Tare Wt *"
                type="number"
                min={0}
                value={form.tare_weight || ""}
                onChange={(e) =>
                  setForm({ ...form, tare_weight: e.target.value })
                }
              />
            )}
            {String(
              form.direction || selected.direction || "",
            ).toUpperCase() === "EXPORT" && (
              <Input
                label="Gross Wt *"
                type="number"
                min={0}
                value={form.gross_weight || ""}
                onChange={(e) =>
                  setForm({ ...form, gross_weight: e.target.value })
                }
              />
            )}
          </div>
        </Modal>
      )}

      {modal === "wbout" && selected && (
        <Modal
          title={`WBOUT — ${selected.vehicle_no}`}
          onClose={closeModal}
          footer={
            <Button variant="green" onClick={handleWbout}>
              RECORD WBOUT
            </Button>
          }
        >
          <div className="form-grid">
            <Input
              label="Weighment Slip No"
              value={form.weighment_slip_no || ""}
              onChange={(e) =>
                setForm({ ...form, weighment_slip_no: e.target.value })
              }
            />
            <Input
              label="Direction"
              value={form.direction || selected.direction || ""}
              readOnly
            />
            <Input
              label="WBOUT Date & Time"
              type="datetime-local"
              value={form.datetime || ""}
              onChange={(e) => setForm({ ...form, datetime: e.target.value })}
            />
            {String(
              form.direction || selected.direction || "",
            ).toUpperCase() === "IMPORT" && (
              <Input
                label="Gross Wt *"
                type="number"
                min={0}
                value={form.wbout_gross_weight || ""}
                onChange={(e) =>
                  setForm({ ...form, wbout_gross_weight: e.target.value })
                }
              />
            )}
            {String(
              form.direction || selected.direction || "",
            ).toUpperCase() === "EXPORT" && (
              <Input
                label="Tare Wt *"
                type="number"
                min={0}
                value={form.wbout_tare_weight || ""}
                onChange={(e) =>
                  setForm({ ...form, wbout_tare_weight: e.target.value })
                }
              />
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

export default GatePage;
