import React, { useEffect, useState } from "react";
import ImageViewer from "./ImageViewer";

interface DoctorDashboardProps {
  token: string | null;
}

interface PendingRecord {
  id: number;
  user_id: number;
  risk_score: number;
  annotated_image: string;
  original_image?: string;
  created_at: string;
}

interface RecordDetail extends PendingRecord {
  status: string;
  doctor_notes?: string;
  validated_by?: number;
}

export default function DoctorDashboard({ token }: DoctorDashboardProps) {
  const [pending, setPending] = useState<PendingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<RecordDetail | null>(null);
  const [viewer, setViewer] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (token) {
      fetchPending();
    }
  }, [token]);

  async function fetchPending() {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/doctor/records/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPending(data);
      }
    } catch (err) {
      console.error("Error fetching pending records:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecordDetail(recordId: number) {
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:8000/doctor/records/${recordId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedRecord(data);
        setNotes(data.doctor_notes || "");
      }
    } catch (err) {
      console.error("Error fetching record detail:", err);
    }
  }

  async function validateRecord(recordId: number, validated: boolean) {
    if (!token) return;

    setValidating(true);
    try {
      const response = await fetch(`http://localhost:8000/doctor/records/${recordId}/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          validated,
          notes: notes.trim() || (validated ? "Validated by doctor" : "Rejected by doctor"),
        }),
      });

      if (response.ok) {
        setSelectedRecord(null);
        setNotes("");
        await fetchPending();
        alert(validated ? "Record validated successfully" : "Record rejected");
      } else {
        const error = await response.json().catch(() => ({}));
        alert(error.detail || "Failed to validate record");
      }
    } catch (err) {
      alert("Error validating record");
    } finally {
      setValidating(false);
    }
  }

  function getImageUrl(imagePath: string) {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:8000${imagePath.startsWith("/") ? imagePath : "/" + imagePath}`;
  }

  function getRiskLevel(score: number): { label: string; badge: string; color: string } {
    if (score < 30) return { label: "Low", badge: "badge-success", color: "var(--success)" };
    if (score < 60) return { label: "Moderate", badge: "badge-warning", color: "var(--warning)" };
    return { label: "High", badge: "badge-danger", color: "var(--danger)" };
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="container">
      <div className="card mb-3">
        <div className="card-header">
          <div className="card-title">
            <div className="card-icon">🔍</div>
            Pending Records Review
          </div>
          <button
            className="btn btn-secondary"
            onClick={fetchPending}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>

        <p className="small-muted" style={{ marginBottom: "24px" }}>
          Review AI-analyzed retinal images and validate or adjust diagnoses. Add professional notes 
          for patient reference.
        </p>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : pending.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <h4>No Pending Records</h4>
            <p className="small-muted">All records have been reviewed. New records will appear here as they are uploaded.</p>
          </div>
        ) : (
          <ul className="record-list">
            {pending.map((record) => {
              const riskInfo = getRiskLevel(record.risk_score);
              return (
                <li key={record.id} className="record-item">
                  <img
                    src={getImageUrl(record.annotated_image)}
                    alt={`Record ${record.id}`}
                    className="record-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect fill='%23ddd' width='120' height='120'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999'%3EImage%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div className="record-content">
                    <div className="record-header">
                      <div>
                        <div className="record-id">Record #{record.id}</div>
                        <div className="record-meta">
                          <div>👤 Patient ID: {record.user_id}</div>
                          <div>📅 {formatDate(record.created_at)}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                        <span className={riskInfo.badge}>{riskInfo.label} Risk</span>
                        <div style={{ fontSize: "20px", fontWeight: "700", color: riskInfo.color }}>
                          {record.risk_score.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    <div className="btn-group">
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          fetchRecordDetail(record.id);
                          setViewer(getImageUrl(record.annotated_image));
                        }}
                      >
                        👁️ Review Details
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setViewer(getImageUrl(record.annotated_image))}
                      >
                        📷 View Image
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={() => validateRecord(record.id, true)}
                        disabled={validating}
                      >
                        ✅ Validate
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => validateRecord(record.id, false)}
                        disabled={validating}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="card" style={{ marginTop: "24px" }}>
          <div className="card-header">
            <div className="card-title">
              <div className="card-icon">📋</div>
              Record #{selectedRecord.id} - Review
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedRecord(null);
                setNotes("");
              }}
            >
              Close
            </button>
          </div>

          <div className="grid-2" style={{ marginBottom: "24px" }}>
            <div>
              <strong>Patient ID:</strong> {selectedRecord.user_id}
            </div>
            <div>
              <strong>Date:</strong> {formatDate(selectedRecord.created_at)}
            </div>
            <div>
              <strong>Risk Score:</strong>{" "}
              <span style={{ fontSize: "24px", fontWeight: "700", color: getRiskLevel(selectedRecord.risk_score).color }}>
                {selectedRecord.risk_score.toFixed(1)}
              </span>
            </div>
            <div>
              <strong>Status:</strong>{" "}
              <span className={`badge ${selectedRecord.status === "validated" ? "badge-success" : selectedRecord.status === "rejected" ? "badge-danger" : "badge-warning"}`}>
                {selectedRecord.status}
              </span>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Doctor's Notes</label>
            <textarea
              className="input"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your professional notes, observations, or recommendations..."
            />
          </div>

          <div className="btn-group">
            <button
              className="btn btn-success"
              onClick={() => validateRecord(selectedRecord.id, true)}
              disabled={validating}
            >
              ✅ Validate Record
            </button>
            <button
              className="btn btn-danger"
              onClick={() => validateRecord(selectedRecord.id, false)}
              disabled={validating}
            >
              ❌ Reject Record
            </button>
          </div>
        </div>
      )}

      {viewer && <ImageViewer src={viewer} onClose={() => setViewer(null)} />}
    </div>
  );
}
