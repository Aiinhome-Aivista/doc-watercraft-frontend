import React, { useState } from "react";
import { Button, Input } from "@/components/ui";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { authService } from "@/services/authService";

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);



  const handleLoginChange = (field: string, value: string) => {
    setLoginForm((prev) => ({ ...prev, [field]: value }));
    setGlobalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError(null);

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
        


        <div style={{ padding: "32px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "var(--text-primary)", letterSpacing: "0.025em", fontFamily: "monospace", margin: 0 }}>
              WELCOME BACK
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "8px", marginBottom: 0 }}>
              Enter your credentials to access the hub
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {globalError && (
              <div style={{ padding: "12px", backgroundColor: "rgba(230, 57, 70, 0.1)", border: "1px solid #e63946", borderRadius: "8px", color: "#e63946", fontSize: "14px", textAlign: "center", fontWeight: "bold" }}>
                {globalError}
              </div>
            )}
            
            <Input
              label="Email Address *"
              placeholder="name@domain.com"
              type="email"
              value={loginForm.email}
              error={errors.email}
              onChange={(e) => handleLoginChange("email", e.target.value)}
            />

            <Input
              label="Password *"
              placeholder="••••••••"
              type="password"
              value={loginForm.password}
              error={errors.password}
              onChange={(e) => handleLoginChange("password", e.target.value)}
            />

            <div style={{ marginTop: "16px" }}>
              <Button className="auth-submit-btn" type="submit" variant="primary" style={{ width: "100%", height: "48px", fontSize: "15px", fontWeight: "bold" ,display:"flex",alignItems:"center",justifyContent:"center" ,cursor:"pointer", transition: "filter 0.2s ease-in-out" }}>
                SIGN IN
              </Button>
            </div>
            
            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <a href="#" className="auth-forgot-link" style={{ fontSize: "14px", color: "var(--text-secondary)", textDecoration: "none", transition: "color 0.2s ease-in-out" }}>
                Forgot your password?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
