import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AUTH_URL = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(window.location.origin)}`;

export default function AuthChoice() {
  const [hovered, setHovered] = useState(null);
  const navigate = useNavigate();

  const handleAuth = (provider) => {
    window.location.href = `${AUTH_URL}&provider=${provider}`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0A0B",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Georgia', serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Ambient background glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Subtle grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "420px",
          padding: "0 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "40px",
        }}
      >
        {/* Logo / Brand */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              margin: "0 auto 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              boxShadow: "0 0 32px rgba(99,102,241,0.4)",
            }}
          >
            ✦
          </div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              letterSpacing: "-0.5px",
              margin: 0,
              fontFamily: "'Georgia', serif",
            }}
          >
            Join Caesura
          </h1>
          <p
            style={{
              marginTop: "8px",
              color: "rgba(255,255,255,0.45)",
              fontSize: "15px",
              fontFamily: "system-ui, sans-serif",
              fontWeight: "400",
            }}
          >
            Choose how you'd like to continue
          </p>
        </div>

        {/* Auth Options */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            {
              id: "google",
              icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
              ),
              label: "Continue with Google",
              onClick: () => handleAuth("google"),
            },
            {
              id: "github",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
              ),
              label: "Continue with GitHub",
              onClick: () => handleAuth("github"),
            },
          ].map((option) => (
            <button
              key={option.id}
              onMouseEnter={() => setHovered(option.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={option.onClick}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 20px",
                borderRadius: "12px",
                border: `1px solid ${hovered === option.id ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"}`,
                background: hovered === option.id ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                color: "white",
                cursor: "pointer",
                fontSize: "15px",
                fontFamily: "system-ui, sans-serif",
                fontWeight: "500",
                letterSpacing: "0.01em",
                transition: "all 0.15s ease",
                textAlign: "left",
                transform: hovered === option.id ? "translateY(-1px)" : "none",
                boxShadow: hovered === option.id ? "0 4px 20px rgba(0,0,0,0.3)" : "none",
              }}
            >
              <span style={{ flexShrink: 0, opacity: 0.85 }}>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "rgba(255,255,255,0.2)",
            fontSize: "13px",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
          or
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* Dev Login */}
        <button
          onMouseEnter={() => setHovered("dev")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => navigate("/dev-login")}
          style={{
            width: "100%",
            padding: "12px 20px",
            borderRadius: "12px",
            border: `1px solid ${hovered === "dev" ? "rgba(200,255,0,0.3)" : "rgba(255,255,255,0.06)"}`,
            background: hovered === "dev" ? "rgba(200,255,0,0.06)" : "transparent",
            color: "rgba(255,255,255,0.35)",
            cursor: "pointer",
            fontSize: "13px",
            fontFamily: "system-ui, sans-serif",
            fontWeight: "500",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            transition: "all 0.15s ease",
          }}
        >
          Dev Login
        </button>
      </div>
    </div>
  );
}
