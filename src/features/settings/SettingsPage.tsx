import React, { useEffect, useState } from "react";
import { authService } from "@/services/authService";
import { GlobalLoader, Button, Modal } from "@/components/ui";

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
          width={600}
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
                    alert("Failed to save changes. Please try again.");
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--text3)",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: "4px",
                }}
              >
                Modules
              </div>
              {[
                { value: "DASHBOARD", label: "DASHBOARD" },
                { value: "PARTY_MASTER", label: "PARTY MASTER" },
                { value: "VESSEL_OPS", label: "VESSEL OPS" },
                { value: "VEHICLE_LOGISTICS", label: "VEHICLE LOGISTICS" },
                { value: "WEIGHBRIDGE_TERMINAL", label: "WEIGHBRIDGE TERMINAL" },
                { value: "REPORTS_BILLING", label: "REPORTS & BILLING" },
                { value: "SETTINGS", label: "SETTINGS" },
              ].map((feat) => (
                <label
                  key={feat.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={userPermissions.modules.includes(feat.value)}
                    onChange={(e) => {
                      if (e.target.checked)
                        setUserPermissions((p) => ({ ...p, modules: [...p.modules, feat.value] }));
                      else
                        setUserPermissions((p) => ({ ...p, modules: p.modules.filter((x) => x !== feat.value) }));
                    }}
                  />
                  {feat.label}
                </label>
              ))}
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "24px" }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--text3)",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: "4px",
                  }}
                >
                  Vessel Statuses
                </div>
                {[
                  { value: "PLANNED", label: "PLANNED" },
                  { value: "BERTHED", label: "BERTHED" },
                  { value: "MOORED", label: "MOORED" },
                  { value: "COMPLETED", label: "COMPLETED" }
                ].map((feat) => (
                  <label
                    key={feat.value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={userPermissions.vessel_statuses.includes(feat.value)}
                      onChange={(e) => {
                        if (e.target.checked)
                          setUserPermissions((p) => ({ ...p, vessel_statuses: [...p.vessel_statuses, feat.value] }));
                        else
                          setUserPermissions((p) => ({
                            ...p,
                            vessel_statuses: p.vessel_statuses.filter((x) => x !== feat.value),
                          }));
                      }}
                    />
                    {feat.label}
                  </label>
                ))}
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--text3)",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: "4px",
                  }}
                >
                  Gate Operations
                </div>
                {[
                  { value: "PENDING_WBIN", label: "PENDING WBIN" },
                  { value: "WBIN_DONE", label: "WBIN DONE" },
                  { value: "UNLOADING", label: "LOADING/UNLOADING" },
                  { value: "PENDING_WBOUT", label: "PENDING WBOUT" },
                  { value: "GATE_OUT", label: "GATE OUT" },
                  { value: "COMPLETED", label: "COMPLETED" },
                ].map((feat) => {
                  return (
                    <label
                      key={feat.value}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                        fontSize: "13px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={userPermissions.gate_operations.includes(feat.value)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setUserPermissions((p) => ({ ...p, gate_operations: [...p.gate_operations, feat.value] }));
                          else
                            setUserPermissions((p) => ({
                              ...p,
                              gate_operations: p.gate_operations.filter((x) => x !== feat.value),
                            }));
                        }}
                      />
                      {feat.label}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default SettingsPage;
