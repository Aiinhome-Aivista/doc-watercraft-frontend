import React, { useState } from "react";
import { Button, Input } from "@/components/ui";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { authService } from "@/services/authService";

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Registration state
  const [regForm, setRegForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Login state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleRegChange = (field: string, value: string) => {
    setRegForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
    setGlobalError(null);
  };

  const handleLoginChange = (field: string, value: string) => {
    setLoginForm((prev) => ({ ...prev, [field]: value }));
    setGlobalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError(null);

    if (isLogin) {
      if (!loginForm.email.trim()) { setErrors(prev => ({ ...prev, email: "Email is required" })); return; }
      if (!loginForm.password) { setErrors(prev => ({ ...prev, password: "Password is required" })); return; }

      try {
        dispatch({ type: 'auth/login/pending' });
        console.log("Locating user credentials...", loginForm);
        const res = await authService.loginUser(loginForm);
        
        if (res.token) {
          localStorage.setItem('access_token', res.token);
          if (res.data) {
            localStorage.setItem('user_data', JSON.stringify(res.data));
          }
        }

        console.log("Login sequence executed:", res);
        dispatch({ type: 'auth/login/fulfilled' });
        navigate("/dashboard");
      } catch (error: any) {
        dispatch({ type: 'auth/login/rejected' });
        console.error("Authentication rejected:", error);
        setGlobalError(error.response?.data?.message || "Invalid credentials provided");
      }
    } else {
      // Input Validation
      const newErrors: Record<string, string> = {};
      
      if (!regForm.name.trim()) newErrors.name = "Full Name is required";
      if (!regForm.phone.trim()) newErrors.phone = "Phone number is required";
      if (!regForm.email.trim()) newErrors.email = "Email is required";
      
      if (!regForm.password) {
        newErrors.password = "Password is required";
      } else if (regForm.password !== regForm.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      
      try {
        dispatch({ type: 'auth/register/pending' });
        const payload = {
          username: regForm.email.split('@')[0], 
          password: regForm.password,
          full_name: regForm.name,
          mobile: regForm.phone,
          email: regForm.email
        };
        
        console.log("Registering payload:", payload);
        const res = await authService.registerUser(payload);
        console.log("Registration Response:", res);
        
        dispatch({ type: 'auth/register/fulfilled' });
        alert(res.message || "User registered successfully");
        
        // After successful registration, flip to login panel
        setIsLogin(true);
        setLoginForm(prev => ({ ...prev, email: regForm.email }));
        setRegForm({ name: "", phone: "", email: "", password: "", confirmPassword: "" });
        
      } catch (error: any) {
        dispatch({ type: 'auth/register/rejected' });
        console.error("Registration failed:", error);
        setGlobalError(error.response?.data?.message || "An error occurred during registration");
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <style>{`
        .auth-tab-inactive:hover {
          color: var(--text-primary) !important;
          background-color: var(--hover) !important;
        }
        .auth-submit-btn:hover {
          color: var(--accent) !important;
         
        }
        .auth-forgot-link:hover {
          color: var(--accent) !important;
        }
      `}</style>
      <div style={{ width: "100%", maxWidth: "480px", backgroundColor: "var(--bg2)", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", border: "1px solid var(--border)", overflow: "hidden" }}>
        
        {/* Toggle Header */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "24px" }}>
          <button
            className={isLogin ? "" : "auth-tab-inactive"}
            style={{ 
              flex: 1, 
              padding: "16px", 
              fontSize: "14px", 
              fontWeight: "bold", 
              letterSpacing: "0.05em",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              backgroundColor: isLogin ? "var(--accent)" : "transparent",
              color: isLogin ? "#fff" : "var(--text-secondary)"
            }}
            onClick={() => setIsLogin(true)}
          >
            LOGIN
          </button>
          <button
            className={!isLogin ? "" : "auth-tab-inactive"}
            style={{ 
              flex: 1, 
              padding: "16px", 
              fontSize: "14px", 
              fontWeight: "bold", 
              letterSpacing: "0.05em",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              backgroundColor: !isLogin ? "var(--accent)" : "transparent",
              color: !isLogin ? "#fff" : "var(--text-secondary)"
            }}
            onClick={() => setIsLogin(false)}
          >
            REGISTER
          </button>
        </div>

        <div style={{ padding: "0 32px 32px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "var(--text-primary)", letterSpacing: "0.025em", fontFamily: "monospace", margin: 0 }}>
              {isLogin ? "WELCOME BACK" : "CREATE ACCOUNT"}
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "8px", marginBottom: 0 }}>
              {isLogin ? "Enter your credentials to access the hub" : "Fill out the details to get started"}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {globalError && (
              <div style={{ padding: "12px", backgroundColor: "rgba(230, 57, 70, 0.1)", border: "1px solid #e63946", borderRadius: "8px", color: "#e63946", fontSize: "14px", textAlign: "center", fontWeight: "bold" }}>
                {globalError}
              </div>
            )}
            
            {!isLogin && (
              <>
                <Input
                  label="Full Name *"
                  placeholder="John Doe"
                  value={regForm.name}
                  onChange={(e) => handleRegChange("name", e.target.value)}
                  error={errors.name}
                />
                <Input
                  label="Phone Number *"
                  placeholder="+1 (555) 000-0000"
                  value={regForm.phone}
                  onChange={(e) => handleRegChange("phone", e.target.value)}
                  error={errors.phone}
                />
              </>
            )}

            <Input
              label="Email Address *"
              placeholder="name@domain.com"
              type="email"
              value={isLogin ? loginForm.email : regForm.email}
              error={!isLogin ? errors.email : undefined}
              onChange={(e) => 
                isLogin 
                  ? handleLoginChange("email", e.target.value) 
                  : handleRegChange("email", e.target.value)
              }
            />

            <Input
              label={isLogin ? "Password *" : "Create Password *"}
              placeholder="••••••••"
              type="password"
              value={isLogin ? loginForm.password : regForm.password}
              error={!isLogin ? errors.password : undefined}
              onChange={(e) => 
                isLogin 
                  ? handleLoginChange("password", e.target.value) 
                  : handleRegChange("password", e.target.value)
              }
            />

            {!isLogin && (
              <Input
                label="Confirm Password *"
                placeholder="••••••••"
                type="password"
                value={regForm.confirmPassword}
                error={errors.confirmPassword}
                onChange={(e) => handleRegChange("confirmPassword", e.target.value)}
              />
            )}

            <div style={{ marginTop: "16px" }}>
              <Button className="auth-submit-btn" type="submit" variant="primary" style={{ width: "100%", height: "48px", fontSize: "15px", fontWeight: "bold" ,display:"flex",alignItems:"center",justifyContent:"center" ,cursor:"pointer", transition: "filter 0.2s ease-in-out" }}>
                {isLogin ? "SIGN IN" : "REGISTER NOW"}
              </Button>
            </div>
            
            {isLogin && (
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <a href="#" className="auth-forgot-link" style={{ fontSize: "14px", color: "var(--text-secondary)", textDecoration: "none", transition: "color 0.2s ease-in-out" }}>
                  Forgot your password?
                </a>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
