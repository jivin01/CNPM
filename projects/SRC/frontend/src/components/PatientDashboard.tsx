import React, { useState, useEffect } from "react";
import ImageViewer from "./ImageViewer";

interface PatientDashboardProps {
  token: string | null;
}

interface AnalysisRecord {
  id: number;
  risk_score: number;
  original_image: string;
  annotated_image: string;
  status: string;
  doctor_notes?: string;
  created_at: string;
}

export default function PatientDashboard({ token }: PatientDashboardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchRecords();
    }
  }, [token]);

  async function fetchRecords() {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/patient/records", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      } else {
        setError("Failed to load your records");
      }
    } catch (err) {
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (!file || !token) {
      setError("Please select an image file");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Upload failed");
      }

      const result = await response.json();
      
      // Refresh records list
      await fetchRecords();
      
      // Clear file input
      setFile(null);
      
      // Show success message (you could add a toast notification here)
      alert(`Analysis complete! Risk score: ${result.risk_score.toFixed(2)}`);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  function getRiskLevel(score: number): { label: string; badge: string; color: string } {
    if (score < 30) return { label: "Low Risk", badge: "badge-success", color: "var(--success)" };
    if (score < 60) return { label: "Moderate Risk", badge: "badge-warning", color: "var(--warning)" };
    return { label: "High Risk", badge: "badge-danger", color: "var(--danger)" };
  }

  function getStatusBadge(status: string) {
    const badges: Record<string, string> = {
      pending: "badge badge-warning",
      validated: "badge badge-success",
      rejected: "badge badge-danger",
    };
    return badges[status] || "badge badge-primary";
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

  function getImageUrl(imagePath: string) {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:8000${imagePath.startsWith("/") ? imagePath : "/" + imagePath}`;
  }

  return (
    <div className="container">
      <div className="grid">
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <div className="card-icon">📤</div>
                Upload Retinal Image
              </div>
            </div>
            
            <p className="small-muted" style={{ marginBottom: "24px" }}>
              Upload a Fundus or OCT retinal image for AI-powered analysis. Our system will detect 
              abnormal vascular regions and provide a preliminary risk assessment.
            </p>

            <div className="input-group">
              <label className="input-label">Select Image File</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={uploading}
                style={{ padding: "8px" }}
              />
              {file && (
                <div className="small-muted" style={{ marginTop: "4px" }}>
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            {error && (
              <div className="alert alert-error" role="alert">
                {error}
              </div>
            )}

            <div className="btn-group">
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={!file || uploading || !token}
              >
                {uploading ? (
                  <>
                    <span className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }}></span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    Upload and Analyze
                  </>
                )}
              </button>
              {file && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setFile(null);
                    setError(null);
                  }}
                  disabled={uploading}
                >
                  Clear
                </button>
              )}
            </div>

            <div style={{ marginTop: "24px", padding: "16px", background: "var(--primary-light)", borderRadius: "var(--radius-small)" }}>
              <strong style={{ color: "var(--primary)" }}>📋 Instructions:</strong>
              <ul style={{ marginTop: "8px", paddingLeft: "20px", color: "var(--text-secondary)", fontSize: "14px" }}>
                <li>Supported formats: PNG, JPG, JPEG</li>
                <li>Recommended image quality: High resolution for best results</li>
                <li>Analysis typically takes 10-30 seconds</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <div className="card-icon">📊</div>
                My Analysis Records
              </div>
              <button
                className="btn btn-secondary"
                onClick={fetchRecords}
                disabled={loading}
                style={{ padding: "8px 16px", fontSize: "14px" }}
              >
                🔄 Refresh
              </button>
            </div>

            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : records.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h4>No Records Yet</h4>
                <p className="small-muted">Upload your first retinal image to get started with analysis.</p>
              </div>
            ) : (
              <ul className="record-list">
                {records.map((record) => {
                  const riskInfo = getRiskLevel(record.risk_score);
                  return (
                    <li key={record.id} className="record-item">
                      <img
                        src={getImageUrl(record.annotated_image || record.original_image)}
                        alt={`Analysis ${record.id}`}
                        className="record-image"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect fill='%23ddd' width='120' height='120'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999'%3EImage%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      <div className="record-content">
                        <div className="record-header">
                          <div>
                            <div className="record-id">Analysis #{record.id}</div>
                            <div className="record-meta">
                              <div>📅 {formatDate(record.created_at)}</div>
                              {record.doctor_notes && (
                                <div style={{ marginTop: "8px", fontStyle: "italic", color: "var(--primary)" }}>
                                  💬 Doctor's Notes: {record.doctor_notes}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className={getStatusBadge(record.status)}>
                              {record.status}
                            </span>
                          </div>
                        </div>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px" }}>
                          <div>
                            <div style={{ fontSize: "24px", fontWeight: "700", color: riskInfo.color }}>
                              {record.risk_score.toFixed(1)}
                            </div>
                            <div className="small-muted">Risk Score</div>
                          </div>
                          <div>
                            <span className={riskInfo.badge}>{riskInfo.label}</span>
                          </div>
                        </div>

                        <div className="btn-group" style={{ marginTop: "12px" }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setViewer(getImageUrl(record.annotated_image || record.original_image))}
                            style={{ fontSize: "14px", padding: "8px 16px" }}
                          >
                            👁️ View Image
                          </button>
                          {record.original_image && record.annotated_image && (
                            <button
                              className="btn btn-secondary"
                              onClick={() => setViewer(getImageUrl(record.original_image))}
                              style={{ fontSize: "14px", padding: "8px 16px" }}
                            >
                              📷 Original
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {viewer && <ImageViewer src={viewer} onClose={() => setViewer(null)} />}
    </div>
  );
}
