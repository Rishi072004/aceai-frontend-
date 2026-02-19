import { Link } from "react-router-dom";
import { User, LogOut, ArrowRight, Coins } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Logo - Outside the navbar pill */}
        <div className="navbar-logo-wrapper">
          <Link to="/">
            <img src="/logo-aceai.png" alt="AceAi" className="navbar-logo-img" />
          </Link>
        </div>
        
        {/* Floating Pill Navbar */}
        <nav className="navbar-pill">
          <Link to="/pricing" className="navbar-link">
            Pricing
          </Link>
          <Link to="/about" className="navbar-link">
            About
          </Link>
          <a href="#modes-section" className="navbar-link">
            Product
          </a>
          
          {isAuthenticated ? (
            <>
              <div className="navbar-user-badge">
                <User className="navbar-user-icon" />
                <span>{user?.firstName || user?.username}</span>
                <span className="navbar-user-credits">
                  <Coins className="navbar-credits-icon" />
                  <span>{user?.credits ?? 0}</span>
                </span>
              </div>
              {user?.plan !== 'STARTER' && (
                <Link to="/history" className="navbar-link">
                  History
                </Link>
              )}
              <Link to="/interview" className="navbar-btn-gradient">
                Start Interview
              </Link>
              <button onClick={logout} className="navbar-btn-dark">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-btn-dark">
                Sign In
              </Link>
              <Link to="/register" className="navbar-btn-gradient">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
