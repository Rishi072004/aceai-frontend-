import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for existing token and user data on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('Found stored user data:', parsedUser.email, 'ID:', parsedUser._id);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    } else {
      console.log('No stored user data found');
    }
    setIsLoading(false);
  }, []);

  // Verify token validity
  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Token is invalid");
      }

      const data = await response.json();
      setUser(data.data.user);
    } catch (error) {
      console.error("Token verification failed:", error);
      logout();
    }
  };

  const login = async (email, password) => {
    try {
      // Clear any existing user data first to prevent conflicts
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      const { token: newToken, user: userData } = data.data;
      
      // Clear all old API keys from previous users
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('openai_api_key_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Set new user data
      setToken(newToken);
      setUser(userData);
      
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(userData));

      console.log('Login successful for user:', userData.email, 'ID:', userData._id);

      toast({
        title: "Success!",
        description: "Welcome back! You've been logged in successfully.",
      });

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      // Clear any existing user data first to prevent conflicts
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      const { token: newToken, user: newUser } = data.data;
      
      // Clear all old API keys from previous users
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('openai_api_key_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Set new user data
      setToken(newToken);
      setUser(newUser);
      
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      console.log('Registration successful for user:', newUser.email, 'ID:', newUser._id);

      toast({
        title: "Success!",
        description: "Account created successfully. Welcome to AceAi!",
      });

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const googleLogin = async (idToken) => {
    try {
      // Clear any existing user data first to prevent conflicts
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Google login failed");
      }

      const { token: newToken, user: userData } = data.data;

      // Clear all old API keys from previous users
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('openai_api_key_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Set new user data
      setToken(newToken);
      setUser(userData);

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(userData));

      toast({
        title: "Success!",
        description: "Signed in with Google.",
      });

      return { success: true };
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    console.log('Logging out user:', user?.email);
    
    setToken(null);
    setUser(null);
    
    // Clear all authentication-related data
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clean up user-specific API keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('openai_api_key_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    console.log('All user data cleared from localStorage');

    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });

    navigate("/");
  };

  const updateProfile = async (profileData) => {
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Profile update failed");
      }

      setUser(data.data.user);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      toast({
        title: "Success!",
        description: "Profile updated successfully.",
      });

      return { success: true };
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password change failed");
      }

      toast({
        title: "Success!",
        description: "Password changed successfully.",
      });

      return { success: true };
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    isPaid: !!user?.isPaid,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    googleLogin,
    setUser,
  };

  // Debug authentication state
  console.log('=== AUTH CONTEXT DEBUG ===');
  console.log('Token:', token ? 'Present' : 'Missing');
  console.log('User:', user ? 'Present' : 'Missing');
  console.log('isAuthenticated:', !!token && !!user);
  console.log('localStorage token:', localStorage.getItem('token') ? 'Present' : 'Missing');
  console.log('localStorage user:', localStorage.getItem('user') ? 'Present' : 'Missing');

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};