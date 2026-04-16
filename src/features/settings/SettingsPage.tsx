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

const SettingsPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

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
                      onClick={() => {
                        setSelectedUser(user);
                        setUserPermissions([]);
                      }}
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
                onClick={() => {
                  console.log(
                    "Saved permissions:",
                    userPermissions,
                    "for user:",
                    selectedUser.id,
                  );
                  setSelectedUser(null);
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
                "DASHBOARD",
                "PARTY MASTER",
                "VESSEL OPS",
                "VEHICLE LOGISTICS",
                "WEIGHBRIDGE TERMINAL",
                "REPORTS & BILLING",
              ].map((feat) => (
                <label
                  key={feat}
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
                    checked={userPermissions.includes(feat)}
                    onChange={(e) => {
                      if (e.target.checked)
                        setUserPermissions((p) => [...p, feat]);
                      else
                        setUserPermissions((p) => p.filter((x) => x !== feat));
                    }}
                  />
                  {feat}
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
                {["PLANNED", "BERTHED", "MOORED", "COMPLETED"].map((feat) => (
                  <label
                    key={feat}
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
                      checked={userPermissions.includes(feat)}
                      onChange={(e) => {
                        if (e.target.checked)
                          setUserPermissions((p) => [...p, feat]);
                        else
                          setUserPermissions((p) =>
                            p.filter((x) => x !== feat),
                          );
                      }}
                    />
                    {feat}
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
                  "PENDING WBIN",
                  "WBIN DONE",
                  "LOADING/UNLOADING",
                  "PENDING WBOUT",
                  "GATE OUT",
                  "COMPLETED_GATE",
                ].map((feat) => {
                  const labelStr =
                    feat === "COMPLETED_GATE" ? "COMPLETED" : feat;
                  return (
                    <label
                      key={feat}
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
                        checked={userPermissions.includes(feat)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setUserPermissions((p) => [...p, feat]);
                          else
                            setUserPermissions((p) =>
                              p.filter((x) => x !== feat),
                            );
                        }}
                      />
                      {labelStr}
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
