import React from "react";

interface HeaderProps {
  role?: string | null;
  onLogout?: () => void;
  userName?: string | null;
}

export default function Header({ role, onLogout, userName }: HeaderProps) {
  const roleLabels: Record<string, string> = {
    patient: "Patient",
    doctor: "Doctor",
    clinic: "Clinic",
    admin: "Administrator",
  };

  return (
    <div className="header">
      <div className="header-content">
        <div className="logo">
          <div className="logo-icon">👁️</div>
          <div className="logo-text">
            <div className="brand">AURA</div>
            <div className="brand-subtitle">Retinal Vascular Health Screening</div>
          </div>
        </div>

        <div className="header-actions">
          {role && (
            <>
              {userName && (
                <span style={{ fontSize: "14px", opacity: 0.9 }}>
                  {userName}
                </span>
              )}
              <div className="role-badge">
                {roleLabels[role] || role}
              </div>
            </>
          )}
          {onLogout && (
            <button className="btn btn-secondary" onClick={onLogout} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "white" }}>
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
