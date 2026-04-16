import React, { useEffect, useState } from 'react';
import { authService } from '@/services/authService';
import { StatusBadge } from '@/components/ui';

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
    <div className="page-container fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">USER ADMINISTRATION</h1>
          <p className="page-subtitle">Global directory of registered dashboard accounts</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading user accounts directly from server...</p>
        </div>
      ) : error ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px' }}>
          <p style={{ color: '#e63946', backgroundColor: 'rgba(230,57,70,0.1)', padding: '16px', borderRadius: '8px', fontWeight: 'bold' }}>
            {error}
          </p>
        </div>
      ) : (
        <div className="table-container" style={{ marginTop: '24px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>USER ID</th>
                <th>FULL NAME</th>
                <th>USERNAME TAG</th>
                <th>CONTACT ORIGIN</th>
                <th>ROLE CLEARANCE</th>
                <th>SYSTEM STATUS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ transition: 'background-color 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>USR-{user.id.toString().padStart(3, '0')}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent) 0%, #3a86ff 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#fff',
                        textTransform: 'uppercase',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        {user.full_name ? user.full_name.charAt(0) : user.username.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{user.full_name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--accent)', fontWeight: 500 }}>@{user.username}</td>
                  <td>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{user.email}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'monospace' }}>Mobile: {user.mobile}</div>
                  </td>
                  <td>
                     <StatusBadge status={user.role === 'admin' ? 'BERTHED' : 'SAILED'}>
                       {user.role}
                     </StatusBadge>
                  </td>
                  <td>
                     <StatusBadge status={user.is_active === 1 ? 'BERTHED' : 'UNBERTHED'}>
                       {user.is_active === 1 ? 'ACTIVE' : 'SUSPENDED'}
                     </StatusBadge>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    No users found inside the registry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
