import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Layout from "./components/Layout";
import PatientDashboard from "./components/PatientDashboard";
import DoctorDashboard from "./components/DoctorDashboard";
import AdminDashboard from "./components/AdminDashboard";
import ClinicDashboard from "./components/ClinicDashboard";

interface UserInfo {
  id: number;
  email: string;
  role: string;
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    
    if (storedToken) {
      fetchUserInfo(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchUserInfo(authToken: string) {
    try {
      const response = await fetch("http://localhost:8000/auth/me", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUserInfo({
          id: data.id,
          email: data.email,
          role: data.role,
        });
        localStorage.setItem("role", data.role);
      } else {
        // Token is invalid, clear it
        handleLogout();
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      handleLogout();
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(token: string, role: string, userId: number) {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    setToken(token);
    setUserInfo({
      id: userId,
      email: "", // Will be fetched if needed
      role: role,
    });
    fetchUserInfo(token);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null);
    setUserInfo(null);
  }

  function renderDashboard() {
    if (!token || !userInfo) return null;

    switch (userInfo.role) {
      case "patient":
        return <PatientDashboard token={token} />;
      case "doctor":
        return <DoctorDashboard token={token} />;
      case "admin":
        return <AdminDashboard token={token} />;
      case "clinic":
        return <ClinicDashboard token={token} />;
      default:
        return (
          <div className="container">
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">⚠️</div>
                <h4>Unknown Role</h4>
                <p className="small-muted">Your role ({userInfo.role}) is not recognized. Please contact support.</p>
                <button className="btn btn-primary mt-3" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        );
    }
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!token || !userInfo) {
    return <Login onToken={handleLogin} />;
  }

  // Show appropriate dashboard based on role
  return (
    <Layout role={userInfo.role} onLogout={handleLogout} userName={userInfo.email}>
      {renderDashboard()}
    </Layout>
  );
}
