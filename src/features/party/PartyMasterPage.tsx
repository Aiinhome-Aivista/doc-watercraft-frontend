import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Button, Input, Modal, ConfirmDialog } from "@/components/ui";
import { partyService } from "@/services/partyService";
import toast from "react-hot-toast";

const PartyMasterPage: React.FC = () => {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<number | string | null>(null);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [parties, setParties] = useState<any[]>([]);

  const fetchParties = async () => {
    dispatch({ type: 'party/fetch/pending' });
    try {
      const res = await partyService.getPartyMasters();
      const list = Array.isArray(res) ? res : res.data || [];
      setParties(list);
      dispatch({ type: 'party/fetch/fulfilled' });
    } catch (err) {
      console.error("Failed to fetch parties", err);
      dispatch({ type: 'party/fetch/rejected' });
    }
  };

  useEffect(() => {
    fetchParties();
  }, []);

  const [form, setForm] = useState({
    partyName: "",
    partyCode: "",
    address: "",
    state: "",
    country: "",
    pincode: "",
  });

  const [mobiles, setMobiles] = useState<string[]>([""]);
  const [emails, setEmails] = useState<string[]>([""]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleMobileChange = (index: number, value: string) => {
    const newMobiles = [...mobiles];
    newMobiles[index] = value;
    setMobiles(newMobiles);
    if (errors[`mobile_${index}`] || errors.mobiles) {
      const newErrors = { ...errors };
      delete newErrors[`mobile_${index}`];
      delete newErrors.mobiles;
      setErrors(newErrors);
    }
  };

  const addMobile = () => setMobiles([...mobiles, ""]);
  const removeMobile = (index: number) => {
    const newMobiles = mobiles.filter((_, i) => i !== index);
    setMobiles(newMobiles.length ? newMobiles : [""]);
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
    if (errors[`email_${index}`] || errors.emails) {
      const newErrors = { ...errors };
      delete newErrors[`email_${index}`];
      delete newErrors.emails;
      setErrors(newErrors);
    }
  };

  const addEmail = () => setEmails([...emails, ""]);
  const removeEmail = (index: number) => {
    const newEmails = emails.filter((_, i) => i !== index);
    setEmails(newEmails.length ? newEmails : [""]);
  };

  const openAddModal = () => {
    setEditId(null);
    setForm({
      partyName: "",
      partyCode: "",
      address: "",
      state: "",
      country: "",
      pincode: "",
    });
    setMobiles([""]);
    setEmails([""]);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (p: any) => {
    setEditId(p.id);
    setForm({
      partyName: p.party_name || "",
      partyCode: p.party_code || "",
      address: p.address || "",
      state: p.state || "",
      country: p.country || "",
      pincode: p.pincode || "",
    });

    let mList = p.mobiles;
    let eList = p.emails;
    try { if (typeof mList === 'string') mList = JSON.parse(mList); } catch {}
    try { if (typeof eList === 'string') eList = JSON.parse(eList); } catch {}
    
    setMobiles(Array.isArray(mList) && mList.length > 0 ? mList : [""]);
    setEmails(Array.isArray(eList) && eList.length > 0 ? eList : [""]);
    setErrors({});
    setIsModalOpen(true);
  };

  const confirmDelete = (id: number | string) => {
    setDeleteDialog(id);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    dispatch({ type: 'party/delete/pending' });
    try {
      await partyService.deletePartyMaster(deleteDialog);
      dispatch({ type: 'party/delete/fulfilled' });
      toast.success("Party Master deleted successfully");
      fetchParties();
    } catch (error: any) {
      dispatch({ type: 'party/delete/rejected' });
      console.error("Failed to delete Party Master:", error);
      toast.error(error?.response?.data?.message || "Failed to delete Party Master");
    } finally {
      setDeleteDialog(null);
    }
  };

  const handleSave = async () => {
    // Basic validation
    const newErrors: Record<string, string> = {};

    if (!form.partyName.trim()) newErrors.partyName = "Party Name is required";
    if (!form.partyCode.trim()) newErrors.partyCode = "Party Code is required";
    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.state.trim()) newErrors.state = "State is required";
    if (!form.country.trim()) newErrors.country = "Country is required";

    if (!form.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^\d{4,10}$/.test(form.pincode.trim())) {
      newErrors.pincode = "Invalid pincode (4-10 digits)";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^\d{10}$/; // Standard 10 digit Indian layout

    const formMobiles = mobiles.map((m) => m.trim()).filter((m) => m !== "");
    if (formMobiles.length === 0) {
      newErrors.mobiles = "At least one valid mobile number is required";
    } else {
      mobiles.forEach((m, idx) => {
        if (m.trim() !== "" && !mobileRegex.test(m.trim())) {
          newErrors[`mobile_${idx}`] =
            "Invalid mobile number (10 digits expected)";
        }
      });
    }

    const formEmails = emails.map((e) => e.trim()).filter((e) => e !== "");
    if (formEmails.length === 0) {
      newErrors.emails = "At least one valid email address is required";
    } else {
      emails.forEach((e, idx) => {
        if (e.trim() !== "" && !emailRegex.test(e.trim())) {
          newErrors[`email_${idx}`] = "Invalid email address format";
        }
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the validation errors");
      return;
    }

    const payload = {
      party_name: form.partyName,
      party_code: form.partyCode,
      address: form.address,
      state: form.state,
      country: form.country,
      pincode: form.pincode,
      mobiles: formMobiles,
      emails: formEmails,
    };

    dispatch({ type: 'party/save/pending' });
    try {
      if (editId) {
        console.log("Updating Party Master:", payload);
        await partyService.updatePartyMaster(editId, payload);
        toast.success("Party Master updated successfully");
      } else {
        console.log("Saving Party Master:", payload);
        await partyService.createPartyMaster(payload);
        toast.success("Party Master saved successfully");
      }
      dispatch({ type: 'party/save/fulfilled' });

      // Clear form
      setForm({
        partyName: "",
        partyCode: "",
        address: "",
        state: "",
        country: "",
        pincode: "",
      });
      setMobiles([""]);
      setEmails([""]);
      setErrors({});
      setIsModalOpen(false);
      fetchParties();
    } catch (error: any) {
      dispatch({ type: 'party/save/rejected' });
      console.error("Failed to save Party Master:", error);
      toast.error(error?.response?.data?.message || "Failed to save Party Master");
    }
  };

  return (
    <>
      <div className="section-head">
        <span className="section-title">PARTY MASTER</span>
        <Button variant="light" onClick={openAddModal}>
          + ADD PARTY
        </Button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Party Name</th>
              <th>Party Code</th>
              <th>Address</th>
              <th>State</th>
              <th>Country</th>
              <th>Pincode</th>
              <th>Mobiles</th>
              <th>Emails</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {parties.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty">
                    <div className="empty-icon">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "inherit" }}
                      >
                        group
                      </span>
                    </div>
                    <div className="empty-text">
                      No parties found. Click + ADD PARTY to create one.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              parties.map((p: any) => {
                let mList = p.mobiles;
                let eList = p.emails;
                try { if (typeof mList === 'string') mList = JSON.parse(mList); } catch {}
                try { if (typeof eList === 'string') eList = JSON.parse(eList); } catch {}
                
                return (
                  <tr key={p.id || p.party_code}>
                    <td className="td-primary">{p.party_name}</td>
                    <td className="font-mono" style={{ fontSize: 13 }}>{p.party_code}</td>
                    <td>{p.address}</td>
                    <td>{p.state}</td>
                    <td>{p.country}</td>
                    <td>{p.pincode}</td>
                    <td>{Array.isArray(mList) ? mList.join(', ') : mList}</td>
                    <td>{Array.isArray(eList) ? eList.join(', ') : eList}</td>
                    <td>
                      <div className="action-group">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(p)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                            edit
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDelete(p.id)}
                          className="text-[#e63946]"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                            delete
                          </span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <Modal
          title={editId ? "EDIT PARTY MASTER" : "ADD PARTY MASTER"}
          onClose={() => setIsModalOpen(false)}
          width="800px"
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                CANCEL
              </Button>
              <Button variant="primary" onClick={handleSave}>
                {editId ? "UPDATE PARTY MASTER" : "SAVE PARTY MASTER"}
              </Button>
            </>
          }
        >
          <div className="form-grid p-2">
            <Input
              label="Party Name *"
              placeholder="Enter party name"
              value={form.partyName}
              onChange={(e) => handleChange("partyName", e.target.value)}
              error={errors.partyName}
            />
            <Input
              label="Party Code *"
              placeholder="Enter party code"
              value={form.partyCode}
              onChange={(e) => handleChange("partyCode", e.target.value)}
              error={errors.partyCode}
            />

            <div className="form-group col-span-full">
              <label className="form-label">Address *</label>
              <textarea
                className={`form-input w-full resize-y ${errors.address ? "input-error" : ""}`}
                placeholder="Enter address"
                rows={3}
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
              {errors.address && (
                <span className="error-text text-[#e63946] text-xs mt-1 block">
                  {errors.address}
                </span>
              )}
            </div>

            <Input
              label="State *"
              placeholder="Enter state"
              value={form.state}
              onChange={(e) => handleChange("state", e.target.value)}
              error={errors.state}
            />
            <Input
              label="Country *"
              placeholder="Enter country"
              value={form.country}
              onChange={(e) => handleChange("country", e.target.value)}
              error={errors.country}
            />
            <Input
              label="Pincode *"
              placeholder="Enter pincode"
              value={form.pincode}
              onChange={(e) => handleChange("pincode", e.target.value)}
              error={errors.pincode}
            />
          </div>

          <div className="mt-6 flex gap-8 flex-wrap p-2 pt-0">
            {/* Mobile Numbers Section */}
            <div className="flex-[1_1_300px]">
              <div className="mb-3 font-semibold text-[var(--text-primary)]">
                Contact Details (Mobile) *
              </div>
              {errors.mobiles && (
                <div className="text-[#e63946] text-xs mb-2" >
                  {errors.mobiles}
                </div>
              )}
              {mobiles.map((mobile, idx) => (
                <div
                  key={`mob-${idx}`}
                  className="flex flex-wrap gap-2 mb-2 items-start" style={{ marginBottom: "10px" }}
                >
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      placeholder={`Mobile ${idx + 1}`}
                      value={mobile}
                      onChange={(e) => handleMobileChange(idx, e.target.value)}
                      error={errors[`mobile_${idx}`]}
                    />
                  </div>
                  {mobiles.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMobile(idx)}
                      className="text-[#e63946] h-fit mt-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        delete
                      </span>
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={addMobile}
                className="mt-1"
              >
                + ADD MOBILE
              </Button>
            </div>

            {/* Email IDs Section */}
            <div className="flex-[1_1_300px]">
              <div className="mb-3 font-semibold text-[var(--text-primary)]">
                Contact Details (Email) *
              </div>
              {errors.emails && (
                <div className="text-[#e63946] text-xs mb-2">
                  {errors.emails}
                </div>
              )}
              {emails.map((email, idx) => (
                <div
                  key={`email-${idx}`}
                  className="flex flex-wrap gap-2 mb-2 items-start" style={{ marginBottom: "10px" }}
                >
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      placeholder={`Email ${idx + 1}`}
                      value={email}
                      onChange={(e) => handleEmailChange(idx, e.target.value)}
                      error={errors[`email_${idx}`]}
                    />
                  </div>
                  {emails.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEmail(idx)}
                      className="text-[#e63946] h-fit mt-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        delete
                      </span>
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={addEmail}
                className="mt-1"
              >
                + ADD EMAIL
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={deleteDialog !== null}
        title="CONFIRM DELETE"
        message="Are you sure you want to delete this Party Master? This action cannot be undone."
        type="confirm"
        confirmText="YES, DELETE"
        cancelText="NO, CANCEL"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog(null)}
      />
    </>
  );
};

export default PartyMasterPage;
