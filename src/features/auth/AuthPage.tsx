import React, { useState } from "react";
import { Button, Input } from "@/components/ui";
import { useNavigate } from "react-router-dom";

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

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

  const handleRegChange = (field: string, value: string) => {
    setRegForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLoginChange = (field: string, value: string) => {
    setLoginForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      console.log("Logging in with", loginForm);
      // Simulate auth success
      navigate("/");
    } else {
      console.log("Registering with", regForm);
      // Simulate auth success
      navigate("/");
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
            
            {!isLogin && (
              <>
                <Input
                  label="Full Name *"
                  placeholder="John Doe"
                  value={regForm.name}
                  onChange={(e) => handleRegChange("name", e.target.value)}
                />
                <Input
                  label="Phone Number *"
                  placeholder="+1 (555) 000-0000"
                  value={regForm.phone}
                  onChange={(e) => handleRegChange("phone", e.target.value)}
                />
              </>
            )}

            <Input
              label="Email Address *"
              placeholder="name@domain.com"
              type="email"
              value={isLogin ? loginForm.email : regForm.email}
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
