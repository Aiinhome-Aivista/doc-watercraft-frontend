import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Button, Input, Modal, ConfirmDialog, Select, StatusBadge } from "@/components/ui";
import { vehicleMasterService } from "@/services/vehicleMasterService";
import toast from "react-hot-toast";

const VehicleMasterPage: React.FC = () => {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<number | string | null>(null);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const fetchVehicles = async () => {
    dispatch({ type: 'vehicleMaster/fetch/pending' });
    try {
      const res = await vehicleMasterService.getVehicleMasters();
      const list = Array.isArray(res) ? res : res.data || [];
      setVehicles(list);
      dispatch({ type: 'vehicleMaster/fetch/fulfilled' });
    } catch (err) {
      console.error("Failed to fetch vehicle masters", err);
      dispatch({ type: 'vehicleMaster/fetch/rejected' });
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const [form, setForm] = useState({
    vehicleNo: "",
    transporterName: "",
    status: "active",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const openAddModal = () => {
    setEditId(null);
    setForm({
      vehicleNo: "",
      transporterName: "",
      status: "active",
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (v: any) => {
    setEditId(v.id);
    setForm({
      vehicleNo: v.vehicle_no || "",
      transporterName: v.transporter_name || "",
      status: v.active === 1 ? "active" : "inactive",
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const confirmDelete = (id: number | string) => {
    setDeleteDialog(id);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    dispatch({ type: 'vehicleMaster/delete/pending' });
    try {
      await vehicleMasterService.deleteVehicleMaster(deleteDialog);
      dispatch({ type: 'vehicleMaster/delete/fulfilled' });
      toast.success("Vehicle Master deleted successfully");
      fetchVehicles();
    } catch (error: any) {
      dispatch({ type: 'vehicleMaster/delete/rejected' });
      console.error("Failed to delete Vehicle Master:", error);
      toast.error(error?.response?.data?.message || "Failed to delete Vehicle Master");
    } finally {
      setDeleteDialog(null);
    }
  };

  const handleToggleStatus = async (id: number | string) => {
    dispatch({ type: 'vehicleMaster/toggle/pending' });
    try {
      await vehicleMasterService.toggleVehicleStatus(id);
      dispatch({ type: 'vehicleMaster/toggle/fulfilled' });
      toast.success("Vehicle status toggled successfully");
      fetchVehicles();
    } catch (error: any) {
      dispatch({ type: 'vehicleMaster/toggle/rejected' });
      console.error("Failed to toggle vehicle status:", error);
      toast.error(error?.response?.data?.message || "Failed to toggle vehicle status");
    }
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    if (!form.vehicleNo.trim()) newErrors.vehicleNo = "Vehicle No is required";
    if (!form.transporterName.trim()) newErrors.transporterName = "Transporter Name is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the validation errors");
      return;
    }

    const payload = {
      vehicle_no: form.vehicleNo,
      transporter_name: form.transporterName,
      active: form.status === 'active' ? 1 : 0,
    };

    dispatch({ type: 'vehicleMaster/save/pending' });
    try {
      if (editId) {
        await vehicleMasterService.updateVehicleMaster(editId, payload);
        toast.success("Vehicle Master updated successfully");
      } else {
        await vehicleMasterService.createVehicleMaster(payload);
        toast.success("Vehicle Master saved successfully");
      }
      dispatch({ type: 'vehicleMaster/save/fulfilled' });

      setForm({
        vehicleNo: "",
        transporterName: "",
        status: "active",
      });
      setErrors({});
      setIsModalOpen(false);
      fetchVehicles();
    } catch (error: any) {
      dispatch({ type: 'vehicleMaster/save/rejected' });
      console.error("Failed to save Vehicle Master:", error);
      toast.error(error?.response?.data?.message || "Failed to save Vehicle Master");
    }
  };

  return (
    <>
      <div className="section-head">
        <span className="section-title">VEHICLE MASTER</span>
        <Button variant="light" onClick={openAddModal}>
          + ADD VEHICLE
        </Button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Vehicle No</th>
              <th>Transporter Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="empty">
                    <div className="empty-icon">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "inherit" }}
                      >
                        local_shipping
                      </span>
                    </div>
                    <div className="empty-text">
                      No vehicles found. Click + ADD VEHICLE to create one.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              vehicles.map((v: any) => (
                <tr key={v.id || v.vehicle_no}>
                  <td className="td-primary font-mono" style={{ fontSize: 13 }}>{v.vehicle_no}</td>
                  <td>{v.transporter_name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StatusBadge status={v.active === 1 ? "active" : "inactive"} />
                    </div>
                  </td>
                  <td>
                    <div className="action-group">
                      <label style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '36px', height: '20px', cursor: 'pointer', margin: 0 }}>
                        <input 
                          type="checkbox" 
                          checked={v.active === 1} 
                          onChange={() => handleToggleStatus(v.id)} 
                          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} 
                        />
                        <div style={{ 
                          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                          backgroundColor: v.active === 1 ? 'var(--green)' : 'var(--border2)', 
                          transition: '.3s', borderRadius: '20px' 
                        }}>
                          <div style={{
                            position: 'absolute', height: '14px', width: '14px', left: '3px', bottom: '3px',
                            backgroundColor: '#fff', transition: '.3s', borderRadius: '50%',
                            transform: v.active === 1 ? 'translateX(16px)' : 'translateX(0)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                          }} />
                        </div>
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(v)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                          edit
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmDelete(v.id)}
                        className="text-[#e63946]"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                          delete
                        </span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <Modal
          title={editId ? "EDIT VEHICLE MASTER" : "ADD VEHICLE MASTER"}
          onClose={() => setIsModalOpen(false)}
          width="500px"
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                CANCEL
              </Button>
              <Button variant="primary" onClick={handleSave}>
                {editId ? "UPDATE VEHICLE MASTER" : "SAVE VEHICLE MASTER"}
              </Button>
            </>
          }
        >
          <div className="form-grid p-2">
            <Input
              label="Vehicle No *"
              placeholder="Enter vehicle number"
              value={form.vehicleNo}
              onChange={(e) => handleChange("vehicleNo", e.target.value)}
              error={errors.vehicleNo}
            />
            <Input
              label="Transporter Name *"
              placeholder="Enter transporter name"
              value={form.transporterName}
              onChange={(e) => handleChange("transporterName", e.target.value)}
              error={errors.transporterName}
            />
            <Select
              label="Status *"
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" }
              ]}
              error={errors.status}
            />
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={deleteDialog !== null}
        title="CONFIRM DELETE"
        message="Are you sure you want to delete this Vehicle Master? This action cannot be undone."
        type="confirm"
        confirmText="YES, DELETE"
        cancelText="NO, CANCEL"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog(null)}
      />
    </>
  );
};

export default VehicleMasterPage;
