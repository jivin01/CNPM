import React, { useEffect, useState } from "react";

interface ClinicDashboardProps {
  token: string | null;
}

// Note: This is a placeholder. Clinic-specific endpoints would need to be implemented in the backend
// For now, this shows the structure and can display a message or basic stats

export default function ClinicDashboard({ token }: ClinicDashboardProps) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="container">
      <div className="card mb-3">
        <div className="card-header">
          <div className="card-title">
            <div className="card-icon">🏥</div>
            Clinic Dashboard
          </div>
        </div>

        <p className="small-muted" style={{ marginBottom: "24px" }}>
          Manage your clinic's patient population, monitor screening campaigns, and analyze 
          aggregated risk statistics to support medical management and decision-making.
        </p>

        <div className="stats-grid" style={{ marginBottom: "24px" }}>
          <div className="stat-card">
            <div className="stat-value">-</div>
            <div className="stat-label">Total Patients</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: "var(--warning)" }}>
            <div className="stat-value" style={{ color: "var(--warning)" }}>
              -
            </div>
            <div className="stat-label">Pending Reviews</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: "var(--success)" }}>
            <div className="stat-value" style={{ color: "var(--success)" }}>
              -
            </div>
            <div className="stat-label">Screening Campaigns</div>
          </div>
        </div>

        <div className="empty-state">
          <div className="empty-state-icon">🏥</div>
          <h4>Clinic Management</h4>
          <p className="small-muted" style={{ marginTop: "16px" }}>
            Clinic-specific features are being developed. This dashboard will provide:
          </p>
          <ul style={{ marginTop: "16px", textAlign: "left", maxWidth: "500px", margin: "16px auto 0", color: "var(--text-secondary)" }}>
            <li>Patient population management</li>
            <li>Screening campaign monitoring</li>
            <li>Aggregated risk statistics and analytics</li>
            <li>Bulk operations and reporting</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

