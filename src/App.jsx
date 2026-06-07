import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import RegisterForm from "./pages/RegisterForm";

export default function App() {
  const [email, setEmail] = useState(() => localStorage.getItem("jobgpt_email"));
  const [profile, setProfile] = useState(() => {
    const raw = localStorage.getItem("jobgpt_profile");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const handleRegister = (userEmail, userProfile) => {
    localStorage.setItem("jobgpt_email", userEmail);
    localStorage.setItem("jobgpt_profile", JSON.stringify(userProfile));
    setEmail(userEmail);
    setProfile(userProfile);
  };

  const handleLogout = () => {
    localStorage.removeItem("jobgpt_email");
    localStorage.removeItem("jobgpt_profile");
    setEmail(null);
    setProfile(null);
  };

  if (!email) return <RegisterForm onRegister={handleRegister} />;
  return <Dashboard email={email} profile={profile} onLogout={handleLogout} />;
}