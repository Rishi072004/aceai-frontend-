import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bot, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getGoogleIdToken } from "@/utils/googleAuth";
import "./Login.css";
const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
   const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, googleLogin } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // Redirect to home page
        navigate("/");
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError("");

    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const idToken = await getGoogleIdToken(clientId);
      const result = await googleLogin(idToken);

      if (result.success) {
        navigate("/");
      } else {
        setError(result.error || "Google sign-in failed");
      }
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };



  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-stars"></div>
        <div className="auth-bg-glow auth-bg-glow-1"></div>
        <div className="auth-bg-glow auth-bg-glow-2"></div>
        <div className="auth-bg-glow auth-bg-glow-3"></div>
      </div>

      <div className="auth-split-layout">
        {/* Left Side - Branding */}
        <div className="auth-left-panel">
          <div className="auth-brand-content">
            <img src="/logo-aceai.png" alt="AceAi" className="auth-brand-logo" />
            <h1 className="auth-brand-text">Join our website for</h1>
            <h2 className="auth-brand-highlight">AI-powered interview prep</h2>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-right-panel">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <h2 className="auth-form-title">Welcome back</h2>
              <p className="auth-form-subtitle">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && (
                <div className="auth-alert" role="alert">{error}</div>
              )}

              <div className="auth-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="auth-input"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="password">Password</label>
                <div className="auth-input-wrap">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    className="auth-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="auth-input-toggle"
                    disabled={isLoading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="auth-icon auth-icon--sm" />
                    ) : (
                      <Eye className="auth-icon auth-icon--sm" />
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="auth-icon auth-icon--sm auth-icon--spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Sign in"
                )}
              </button>

              <div className="auth-divider"><span>or</span></div>

              <button
                type="button"
                className="auth-oauth-btn"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading || isLoading}
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="auth-icon auth-icon--sm auth-icon--spin" />
                    <span>Continue with Google</span>
                  </>
                ) : (
                  <>
                    <img src="/google-logo.svg" alt="Google" className="auth-oauth-icon" />
                    <span>Continue with Google</span>
                    <ArrowRight className="auth-icon auth-icon--sm" />
                  </>
                )}
              </button>

              <div className="auth-switch">
                <span>Don't have an account? </span>
                <Link to="/register" className="auth-link">Sign up</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;