import React from "react";
import Header from "./Header";
import "../styles/clinical.css";

interface LayoutProps {
  role?: string | null;
  onLogout?: () => void;
  userName?: string | null;
  children?: React.ReactNode;
}

export default function Layout({ role, onLogout, userName, children }: LayoutProps) {
  return (
    <div className="app-shell">
      <Header role={role} onLogout={onLogout} userName={userName} />
      <main>{children}</main>
    </div>
  );
}
