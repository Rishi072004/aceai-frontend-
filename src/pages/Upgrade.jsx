import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Check, Shield } from "lucide-react";
import "./Upgrade.css";

const Upgrade = () => {
  const { token, setUser, user } = useAuth();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const upgrade = async () => {
    if (user?.isPaid) {
      setStatus("You are already a Premium user.");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_BASE_URL}/api/users/upgrade`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Upgrade failed");
      const data = await res.json();
      setUser(data.data.user);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      setStatus("✅ Upgrade successful! Enjoy Premium features.");
    } catch (e) {
      console.error(e);
      setStatus("❌ Upgrade failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="up-page">
      <div className="about-background">
        <div className="about-bg-element about-bg-1"></div>
        <div className="about-bg-element about-bg-2"></div>
        <div className="about-bg-element about-bg-3"></div>
      </div>

      <div className="up-container">
        <div className="up-top">
          <Link to="/" className="up-back">
            <ArrowLeft className="up-icon" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="up-card">
          <div className="up-header">
            <Shield className="up-icon up-icon--lg" />
            <h1 className="up-title">Upgrade to Premium</h1>
            <p className="up-subtitle">Unlock unlimited interviews, advanced feedback, and audio features.</p>
          </div>

          <ul className="up-features">
            <li className="up-feature"><Check className="up-icon up-icon--sm" /> Unlimited interviews</li>
            <li className="up-feature"><Check className="up-icon up-icon--sm" /> Advanced AI feedback</li>
            <li className="up-feature"><Check className="up-icon up-icon--sm" /> Audio mode + Text-to-Speech</li>
            <li className="up-feature"><Check className="up-icon up-icon--sm" /> Priority support</li>
          </ul>

          <div className="up-actions">
            <button className="up-btn primary" onClick={upgrade} disabled={loading}>
              {loading ? "Processing..." : user?.isPaid ? "You are Premium" : "Upgrade Now"}
            </button>
            <Link className="up-btn outline" to="/pricing">View Pricing</Link>
          </div>

          {status && <div className="up-status">{status}</div>}
        </div>
      </div>
    </div>
  );
};

export default Upgrade;

