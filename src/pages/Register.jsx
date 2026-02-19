import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bot, Eye, EyeOff, Loader2, Check, X, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getGoogleIdToken } from "@/utils/googleAuth";
import { useToast } from "@/hooks/use-toast";
import "./Register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { googleLogin } = useAuth();

  const checkPasswordStrength = (password) => {
    setPasswordStrength({
      length: password.length >= 6,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check password strength when password field changes
    if (name === "password") {
      checkPasswordStrength(value);
    }

    // Clear error when user starts typing
    if (error) setError("");
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (!Object.values(passwordStrength).every(Boolean)) {
      setError("Password does not meet requirements");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Store token and user data
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      toast({
        title: "Success!",
        description: "Account created successfully. Welcome to AceAi!",
      });

      // Redirect to home page
      navigate("/");
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

  const PasswordRequirement = ({ met, text }) => (
    <div className="auth-req">
      {met ? (
        <Check className="auth-icon auth-icon--sm ok" />
      ) : (
        <X className="auth-icon auth-icon--sm bad" />
      )}
      <span className={met ? "ok" : "muted"}>{text}</span>
    </div>
  );

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
              <h2 className="auth-form-title">Create your account</h2>
              <p className="auth-form-subtitle">Join AceAi to start practicing interviews</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && (
                <div className="auth-alert" role="alert">{error}</div>
              )}

              <div className="auth-grid-2">
                <div className="auth-field">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    className="auth-input"
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="auth-input"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
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
                    placeholder="Create a strong password"
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

                {formData.password && (
                  <div className="auth-req-list">
                    <PasswordRequirement met={passwordStrength.length} text="At least 6 characters" />
                    <PasswordRequirement met={passwordStrength.lowercase} text="One lowercase letter" />
                    <PasswordRequirement met={passwordStrength.uppercase} text="One uppercase letter" />
                    <PasswordRequirement met={passwordStrength.number} text="One number" />
                  </div>
                )}
              </div>

              <div className="auth-field">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="auth-input-wrap">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    className="auth-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="auth-input-toggle"
                    disabled={isLoading}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
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
                    <span>Creating account...</span>
                  </>
                ) : (
                  "Create account"
                )}
              </button>

              <div className="auth-divider"><span>or</span></div>

              <button
                type="button"
                className="auth-oauth-btn"
                onClick={async () => {
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
                }}
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
                <span>Already have an account? </span>
                <Link to="/login" className="auth-link">Sign in</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;