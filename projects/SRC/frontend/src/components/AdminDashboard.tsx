import React, { useEffect, useState } from "react";

interface AdminDashboardProps {
  token: string | null;
}

interface User {
  id: number;
  email: string;
  role: string;
}

export default function AdminDashboard({ token }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState("patient");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  async function fetchUsers() {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateUserRole(userId: number, role: string) {
    if (!token) return;

    setUpdating(true);
    try {
      const response = await fetch(`http://localhost:8000/admin/users/${userId}/role?role=${role}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchUsers();
        setSelectedUser(null);
        alert("User role updated successfully");
      } else {
        const error = await response.json().catch(() => ({}));
        alert(error.detail || "Failed to update user role");
      }
    } catch (err) {
      alert("Error updating user role");
    } finally {
      setUpdating(false);
    }
  }

  function getRoleBadge(role: string) {
    const badges: Record<string, string> = {
      admin: "badge badge-danger",
      doctor: "badge badge-primary",
      clinic: "badge badge-warning",
      patient: "badge badge-success",
    };
    return badges[role] || "badge badge-primary";
  }

  const roleStats = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="container">
      <div className="card mb-3">
        <div className="card-header">
          <div className="card-title">
            <div className="card-icon">👥</div>
            User Management
          </div>
          <button
            className="btn btn-secondary"
            onClick={fetchUsers}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>

        <p className="small-muted" style={{ marginBottom: "24px" }}>
          Manage system users, assign roles, and monitor user accounts. This interface provides 
          administrative control over the entire system.
        </p>

        {/* Statistics */}
        <div className="stats-grid" style={{ marginBottom: "24px" }}>
          <div className="stat-card">
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: "var(--success)" }}>
            <div className="stat-value" style={{ color: "var(--success)" }}>
              {roleStats.patient || 0}
            </div>
            <div className="stat-label">Patients</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: "var(--primary)" }}>
            <div className="stat-value" style={{ color: "var(--primary)" }}>
              {roleStats.doctor || 0}
            </div>
            <div className="stat-label">Doctors</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: "var(--warning)" }}>
            <div className="stat-value" style={{ color: "var(--warning)" }}>
              {roleStats.clinic || 0}
            </div>
            <div className="stat-label">Clinics</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: "var(--danger)" }}>
            <div className="stat-value" style={{ color: "var(--danger)" }}>
              {roleStats.admin || 0}
            </div>
            <div className="stat-label">Administrators</div>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h4>No Users Found</h4>
            <p className="small-muted">No users are registered in the system yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left" }}>
                  <th style={{ padding: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>ID</th>
                  <th style={{ padding: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Email</th>
                  <th style={{ padding: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Role</th>
                  <th style={{ padding: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "16px" }}>{user.id}</td>
                    <td style={{ padding: "16px", fontWeight: "500" }}>{user.email}</td>
                    <td style={{ padding: "16px" }}>
                      <span className={getRoleBadge(user.role)}>{user.role}</span>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setSelectedUser(user);
                          setNewRole(user.role);
                        }}
                        style={{ fontSize: "14px", padding: "6px 12px" }}
                      >
                        Change Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Update Modal */}
      {selectedUser && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <div className="card-icon">⚙️</div>
              Change User Role
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedUser(null);
                setNewRole("patient");
              }}
            >
              Cancel
            </button>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <p><strong>User:</strong> {selectedUser.email}</p>
            <p><strong>Current Role:</strong> <span className={getRoleBadge(selectedUser.role)}>{selectedUser.role}</span></p>
          </div>

          <div className="input-group">
            <label className="input-label">New Role</label>
            <select
              className="input"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="clinic">Clinic</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="btn-group">
            <button
              className="btn btn-primary"
              onClick={() => updateUserRole(selectedUser.id, newRole)}
              disabled={updating || newRole === selectedUser.role}
            >
              {updating ? "Updating..." : "Update Role"}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedUser(null);
                setNewRole("patient");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

