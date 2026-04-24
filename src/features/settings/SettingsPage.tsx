import React, { useEffect, useState } from "react";
import { authService } from "@/services/authService";
import { GlobalLoader, Button, Modal, Input, ConfirmDialog } from "@/components/ui";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  mobile: string;
  role: string;
  is_active: number;
}

interface AccessRights {
  modules: string[];
  vessel_statuses: string[];
  gate_operations: string[];
}

const SettingsPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userPermissions, setUserPermissions] = useState<AccessRights>({
    modules: [],
    vessel_statuses: [],
    gate_operations: []
  });

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [regGlobalError, setRegGlobalError] = useState<string | null>(null);

  const [dialogState, setDialogState] = useState<{isOpen: boolean; title: string; message: string; type: "info"|"confirm"|"error"}>({
    isOpen: false, title: "", message: "", type: "info"
  });

  const handleRegChange = (field: string, value: string) => {
    setRegForm((prev) => ({ ...prev, [field]: value }));
    if (regErrors[field]) setRegErrors(prev => ({ ...prev, [field]: "" }));
    setRegGlobalError(null);
  };

  const handleRegisterSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!regForm.name.trim()) newErrors.name = "Full Name is required";
    if (!regForm.phone.trim()) newErrors.phone = "Phone number is required";
    if (!regForm.email.trim()) newErrors.email = "Email is required";
    if (!regForm.password) {
      newErrors.password = "Password is required";
    } else if (regForm.password !== regForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (Object.keys(newErrors).length > 0) {
      setRegErrors(newErrors);
      return;
    }
    try {
      setLoading(true);
      const payload = {
        username: regForm.email.split('@')[0], 
        password: regForm.password,
        full_name: regForm.name,
        mobile: regForm.phone,
        email: regForm.email
      };
      const res = await authService.registerUser(payload);
      setDialogState({ isOpen: true, title: "SUCCESS", message: res.message || "User registered successfully", type: "info" });
      setIsAddUserModalOpen(false);
      setRegForm({ name: "", phone: "", email: "", password: "", confirmPassword: "" });
      
      const updatedRes = await authService.getAllUsers();
      const userList = Array.isArray(updatedRes) ? updatedRes : updatedRes.data || [];
      setUsers(userList);
    } catch (err: any) {
      console.error("Registration failed:", err);
      setRegGlobalError(err.response?.data?.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (user: UserProfile) => {
    try {
      setLoading(true);
      const res = await authService.getAccessRights(user.id);
      const rights = res?.data?.access_rights;
      if (rights) {
        setUserPermissions({
          modules: rights.modules || [],
          vessel_statuses: rights.vessel_statuses || [],
          gate_operations: rights.gate_operations || []
        });
      } else {
        setUserPermissions({ modules: [], vessel_statuses: [], gate_operations: [] });
      }
      setSelectedUser(user);
    } catch (err) {
      console.error("Failed to fetch access rights", err);
      setUserPermissions({ modules: [], vessel_statuses: [], gate_operations: [] });
      setSelectedUser(user);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await authService.getAllUsers();
        // Dynamically extract payload correctly handling pure arrays or nested objects
        const userList = Array.isArray(res) ? res : res.data || [];
        setUsers(userList);
      } catch (err: any) {
        console.error("Failed to load user management list:", err);
        setError("Could not load network user data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <>
      {loading && <GlobalLoader />}

      <div className="section-head">
        <span className="section-title">USER ADMINISTRATION</span>
        <Button variant="light" onClick={() => setIsAddUserModalOpen(true)}>
          + ADD USER
        </Button>
      </div>

      {error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <div className="table-wrap">
          <div className="table-header">
            <span className="table-title">GLOBAL DIRECTORY</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>USER ID</th>
                <th>FULL NAME</th>
                <th>USERNAME TAG</th>
                <th>CONTACT ORIGIN</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="td-mono">
                    USR-{user.id.toString().padStart(3, "0")}
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: "var(--purple)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          fontWeight: "bold",
                          color: "#fff",
                          textTransform: "uppercase",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                      >
                        {user.full_name
                          ? user.full_name.charAt(0)
                          : user.username.charAt(0)}
                      </div>
                      <span className="td-primary">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="text-accent fw-700">@{user.username}</td>
                  <td>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--text)",
                        fontWeight: 500,
                      }}
                    >
                      {user.email}
                    </div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: "12px",
                        color: "var(--text2)",
                        marginTop: "4px",
                      }}
                    >
                      Mobile: {user.mobile}
                    </div>
                  </td>
                  <td>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      EDIT
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="empty">
                    <span
                      className="material-symbols-outlined empty-icon"
                      style={{ display: "block" }}
                    >
                      group_off
                    </span>
                    <div className="empty-text">
                      No users found inside the registry.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <Modal
          title={`EDIT ACCESS — ${selectedUser.username}`}
          onClose={() => setSelectedUser(null)}
          width={680}
          footer={
            <>
              <Button variant="ghost" onClick={() => setSelectedUser(null)}>
                CANCEL
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  try {
                    setLoading(true);
                    await authService.updateAccessRights(selectedUser.id, userPermissions);
                    setSelectedUser(null);
                  } catch (err) {
                    console.error("Failed to save permissions", err);
                    setDialogState({ isOpen: true, title: "ERROR", message: "Failed to save changes. Please try again.", type: "error" });
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                SAVE CHANGES
              </Button>
            </>
          }
        >
          {/* Tree permission layout */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>

            {/* Section label */}
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text3)", letterSpacing: "1.5px", textTransform: "uppercase", paddingBottom: "8px", borderBottom: "1px solid var(--border)", marginBottom: "4px" }}>
              Module Access &amp; Sub-Permissions
            </div>

            {/* ── Simple flat modules ── */}
            {[
              { value: "DASHBOARD", label: "DASHBOARD" },
              { value: "PARTY_MASTER", label: "PARTY MASTER" },
              { value: "VEHICLE_MASTER", label: "VEHICLE MASTER" },
              { value: "REPORTS_BILLING", label: "REPORTS & BILLING" },
              { value: "WEIGHBRIDGE_TERMINAL", label: "WEIGHBRIDGE TERMINAL" },
              { value: "SETTINGS", label: "SETTINGS" },
            ].map((mod) => (
              <label key={mod.value} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "7px 10px", borderRadius: "4px", fontSize: "13px", fontWeight: 600, transition: "background 0.15s", background: userPermissions.modules.includes(mod.value) ? "rgba(0,194,255,0.06)" : "transparent" }}>
                <input
                  type="checkbox"
                  checked={userPermissions.modules.includes(mod.value)}
                  onChange={(e) => {
                    if (e.target.checked) setUserPermissions((p) => ({ ...p, modules: [...p.modules, mod.value] }));
                    else setUserPermissions((p) => ({ ...p, modules: p.modules.filter((x) => x !== mod.value) }));
                  }}
                  style={{ width: 15, height: 15, accentColor: "var(--accent)", cursor: "pointer" }}
                />
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: userPermissions.modules.includes(mod.value) ? "var(--accent)" : "var(--text3)" }}>
                  {mod.value === "DASHBOARD" ? "dashboard" : mod.value === "PARTY_MASTER" ? "groups" : mod.value === "VEHICLE_MASTER" ? "local_shipping" : mod.value === "REPORTS_BILLING" ? "receipt_long" : mod.value === "WEIGHBRIDGE_TERMINAL" ? "scale" : "settings"}
                </span>
                {mod.label}
              </label>
            ))}

            {/* ── VESSEL OPS with vessel_statuses sub-tree ── */}
            <div style={{ borderLeft: userPermissions.modules.includes("VESSEL_OPS") ? "2px solid var(--accent)" : "2px solid var(--border)", borderRadius: "0 6px 6px 0", marginTop: "4px", marginBottom: "4px", transition: "border-color 0.2s" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "7px 10px", fontSize: "13px", fontWeight: 600, background: userPermissions.modules.includes("VESSEL_OPS") ? "rgba(0,194,255,0.06)" : "transparent", borderRadius: "0 4px 4px 0" }}>
                <input
                  type="checkbox"
                  checked={userPermissions.modules.includes("VESSEL_OPS")}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setUserPermissions((p) => ({ ...p, modules: [...p.modules, "VESSEL_OPS"] }));
                    } else {
                      // Uncheck module and clear all vessel_statuses
                      setUserPermissions((p) => ({ ...p, modules: p.modules.filter((x) => x !== "VESSEL_OPS"), vessel_statuses: [] }));
                    }
                  }}
                  style={{ width: 15, height: 15, accentColor: "var(--accent)", cursor: "pointer" }}
                />
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: userPermissions.modules.includes("VESSEL_OPS") ? "var(--accent)" : "var(--text3)" }}>anchor</span>
                VESSEL OPS
              </label>

              {/* Sub-items: vessel_statuses */}
              {userPermissions.modules.includes("VESSEL_OPS") && (
                <div style={{ paddingLeft: "32px", paddingBottom: "8px", display: "flex", flexDirection: "column", gap: "2px" }}>
                  {[
                    { value: "PLANNED", label: "PLANNED", icon: "assignment" },
                    { value: "BERTHED", label: "BERTHED", icon: "anchor" },
                    { value: "MOORED", label: "MOORED", icon: "link" },
                    { value: "COMPLETED", label: "COMPLETED", icon: "check_circle" },
                  ].map((sub) => (
                    <label key={sub.value} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "5px 8px", fontSize: "12px", color: "var(--text2)", borderRadius: "4px", background: userPermissions.vessel_statuses.includes(sub.value) ? "rgba(0,194,255,0.04)" : "transparent" }}>
                      <input
                        type="checkbox"
                        checked={userPermissions.vessel_statuses.includes(sub.value)}
                        onChange={(e) => {
                          if (e.target.checked) setUserPermissions((p) => ({ ...p, vessel_statuses: [...p.vessel_statuses, sub.value] }));
                          else setUserPermissions((p) => ({ ...p, vessel_statuses: p.vessel_statuses.filter((x) => x !== sub.value) }));
                        }}
                        style={{ width: 13, height: 13, accentColor: "var(--accent)", cursor: "pointer" }}
                      />
                      <span className="material-symbols-outlined" style={{ fontSize: 13, color: userPermissions.vessel_statuses.includes(sub.value) ? "var(--green)" : "var(--text3)" }}>{sub.icon}</span>
                      {sub.label}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* ── VEHICLE LOGISTICS with gate_operations sub-tree ── */}
            <div style={{ borderLeft: userPermissions.modules.includes("VEHICLE_LOGISTICS") ? "2px solid var(--amber)" : "2px solid var(--border)", borderRadius: "0 6px 6px 0", marginBottom: "4px", transition: "border-color 0.2s" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "7px 10px", fontSize: "13px", fontWeight: 600, background: userPermissions.modules.includes("VEHICLE_LOGISTICS") ? "rgba(255,176,32,0.06)" : "transparent", borderRadius: "0 4px 4px 0" }}>
                <input
                  type="checkbox"
                  checked={userPermissions.modules.includes("VEHICLE_LOGISTICS")}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setUserPermissions((p) => ({ ...p, modules: [...p.modules, "VEHICLE_LOGISTICS"] }));
                    } else {
                      // Uncheck module and clear all gate_operations
                      setUserPermissions((p) => ({ ...p, modules: p.modules.filter((x) => x !== "VEHICLE_LOGISTICS"), gate_operations: [] }));
                    }
                  }}
                  style={{ width: 15, height: 15, accentColor: "var(--amber)", cursor: "pointer" }}
                />
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: userPermissions.modules.includes("VEHICLE_LOGISTICS") ? "var(--amber)" : "var(--text3)" }}>local_shipping</span>
                VEHICLE LOGISTICS
              </label>

              {/* Sub-items: gate_operations */}
              {userPermissions.modules.includes("VEHICLE_LOGISTICS") && (
                <div style={{ paddingLeft: "32px", paddingBottom: "8px", display: "flex", flexDirection: "column", gap: "2px" }}>
                  {[
                    { value: "PENDING_WBIN", label: "PENDING WBIN", icon: "schedule" },
                    { value: "WBIN_DONE", label: "WBIN DONE", icon: "scale" },
                    { value: "UNLOADING", label: "LOADING / UNLOADING", icon: "construction" },
                    { value: "PENDING_WBOUT", label: "PENDING WBOUT", icon: "pending" },
                    { value: "GATE_OUT", label: "GATE OUT", icon: "logout" },
                    { value: "COMPLETED", label: "COMPLETED", icon: "check_circle" },
                  ].map((sub) => (
                    <label key={sub.value} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "5px 8px", fontSize: "12px", color: "var(--text2)", borderRadius: "4px", background: userPermissions.gate_operations.includes(sub.value) ? "rgba(255,176,32,0.04)" : "transparent" }}>
                      <input
                        type="checkbox"
                        checked={userPermissions.gate_operations.includes(sub.value)}
                        onChange={(e) => {
                          if (e.target.checked) setUserPermissions((p) => ({ ...p, gate_operations: [...p.gate_operations, sub.value] }));
                          else setUserPermissions((p) => ({ ...p, gate_operations: p.gate_operations.filter((x) => x !== sub.value) }));
                        }}
                        style={{ width: 13, height: 13, accentColor: "var(--amber)", cursor: "pointer" }}
                      />
                      <span className="material-symbols-outlined" style={{ fontSize: 13, color: userPermissions.gate_operations.includes(sub.value) ? "var(--green)" : "var(--text3)" }}>{sub.icon}</span>
                      {sub.label}
                    </label>
                  ))}
                </div>
              )}
            </div>

          </div>
        </Modal>
      )}

      {isAddUserModalOpen && (
        <Modal
          title="REGISTER NEW USER"
          onClose={() => setIsAddUserModalOpen(false)}
          width={480}
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsAddUserModalOpen(false)}>
                CANCEL
              </Button>
              <Button variant="primary" onClick={handleRegisterSubmit}>
                REGISTER
              </Button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "8px 0" }}>
            {regGlobalError && (
              <div style={{ padding: "12px", backgroundColor: "rgba(230, 57, 70, 0.1)", border: "1px solid #e63946", borderRadius: "8px", color: "#e63946", fontSize: "14px", textAlign: "center", fontWeight: "bold" }}>
                {regGlobalError}
              </div>
            )}
            <Input label="Full Name *" placeholder="John Doe" value={regForm.name} onChange={(e) => handleRegChange("name", e.target.value)} error={regErrors.name} />
            <Input label="Phone Number *" placeholder="+1 (555) 000-0000" value={regForm.phone} onChange={(e) => handleRegChange("phone", e.target.value)} error={regErrors.phone} />
            <Input label="Email Address *" placeholder="name@domain.com" type="email" value={regForm.email} onChange={(e) => handleRegChange("email", e.target.value)} error={regErrors.email} />
            <Input label="Create Password *" placeholder="••••••••" type="password" value={regForm.password} onChange={(e) => handleRegChange("password", e.target.value)} error={regErrors.password} />
            <Input label="Confirm Password *" placeholder="••••••••" type="password" value={regForm.confirmPassword} onChange={(e) => handleRegChange("confirmPassword", e.target.value)} error={regErrors.confirmPassword} />
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        onConfirm={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};

export default SettingsPage;
