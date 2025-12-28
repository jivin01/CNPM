import React, { useState } from "react";

interface LoginProps {
  onToken: (token: string, role: string, userId: number) => void;
  onRegister?: () => void;
}

export default function Login({ onToken, onRegister }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const body = new URLSearchParams();
      body.append("username", email);
      body.append("password", password);
      
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || "Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      // Fetch user info to get role
      try {
        const meResponse = await fetch("http://localhost:8000/auth/me", {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        if (meResponse.ok) {
          const meData = await meResponse.json();
          localStorage.setItem("role", meData.role || data.role || "patient");
        }
      } catch (e) {
        // Use role from login response if /me fails
        localStorage.setItem("role", data.role || "patient");
      }

      localStorage.setItem("token", data.access_token);
      onToken(data.access_token, data.role || "patient", data.id);
    } catch (err) {
      setError("Connection error. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function quickLogin(emailVal: string, passwordVal: string) {
    setEmail(emailVal);
    setPassword(passwordVal);
    // Small delay to allow state update
    setTimeout(() => handleLogin(), 100);
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleLogin();
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">👁️</div>
          <h1 className="login-title">AURA</h1>
          <p className="login-subtitle">Retinal Vascular Health Screening System</p>
        </div>

        <div className="input-group">
          <label className="input-label">Email Address</label>
          <input
            className="input"
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Password</label>
          <input
            className="input"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleLogin}
          disabled={loading}
          style={{ width: "100%", marginTop: "8px" }}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }}></span>
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>

        <div className="quick-login">
          <div className="quick-login-title">Quick Access (Demo)</div>
          <div className="quick-login-buttons">
            <button
              className="btn btn-secondary"
              onClick={() => quickLogin("patient@example.com", "pass")}
              disabled={loading}
            >
              Patient
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => quickLogin("doc@example.com", "pass")}
              disabled={loading}
            >
              Doctor
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => quickLogin("admin@example.com", "adminpass")}
              disabled={loading}
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
