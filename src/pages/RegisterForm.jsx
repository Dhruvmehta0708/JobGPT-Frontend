import { useState } from "react";
import { registerUser } from "../services/api";

// ─── Role → Skills mapping ────────────────────────────────────────────────────
const ROLE_SKILLS = {
  "Frontend Developer":      ["React", "JavaScript", "HTML", "CSS", "TypeScript", "Tailwind CSS", "Next.js", "Redux", "Figma"],
  "Backend Developer":       ["Node.js", "Express", "Python", "Django", "REST API", "MongoDB", "PostgreSQL", "MySQL", "Docker"],
  "Full Stack Developer":    ["React", "Node.js", "JavaScript", "MongoDB", "Express", "TypeScript", "REST API", "MySQL", "Git"],
  "React Developer":         ["React", "JavaScript", "TypeScript", "Redux", "React Hooks", "Next.js", "Tailwind CSS", "REST API"],
  "Node.js Developer":       ["Node.js", "Express", "MongoDB", "REST API", "JavaScript", "JWT", "Socket.io", "MySQL"],
  "Python Developer":        ["Python", "Django", "Flask", "FastAPI", "REST API", "PostgreSQL", "Pandas", "NumPy"],
  "Data Analyst":            ["Python", "SQL", "Excel", "Power BI", "Tableau", "Pandas", "NumPy", "Machine Learning"],
  "UI/UX Designer":          ["Figma", "Adobe XD", "Sketch", "Prototyping", "Wireframing", "User Research", "CSS", "HTML"],
  "DevOps Engineer":         ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Jenkins", "Terraform", "Ansible"],
  "Android Developer":       ["Java", "Kotlin", "Android SDK", "Jetpack Compose", "Firebase", "REST API", "SQLite"],
  "ML Engineer":             ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy", "SQL", "AWS"],
  "QA Engineer":             ["Manual Testing", "Selenium", "Postman", "JIRA", "API Testing", "TestNG", "Cypress"],
  "Software Engineer":       ["Java", "Python", "Data Structures", "Algorithms", "SQL", "Git", "REST API", "System Design"],
  "React Native Developer":  ["React Native", "JavaScript", "TypeScript", "Redux", "Firebase", "REST API", "iOS", "Android"],
  "Cloud Engineer":          ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Linux", "CI/CD"],
};

const ROLES = Object.keys(ROLE_SKILLS);

const EXPERIENCE_OPTIONS = [
  "Fresher (0 years)",
  "0-1 years",
  "1-2 years",
  "2-3 years",
  "3-5 years",
  "5+ years",
];

export default function RegisterForm({ onRegister }) {
  const [form, setForm] = useState({
    name:       "",
    email:      "",
    role:       "",
    skills:     [],
    experience: "Fresher (0 years)",
    wants: {
      remote:   true,
      onsite:   true,
      startup:  false,
      bigco:    false,
      growth:   true,
      location: "India",
    },
  });


  const [customSkill, setCustomSkill] = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  // When role changes → auto-populate suggested skills
  const handleRoleChange = (role) => {
    const suggested = ROLE_SKILLS[role] || [];
    setForm((f) => ({ ...f, role, skills: [...suggested.slice(0, 5)] }));
  };

  // Toggle skill chip
  const toggleSkill = (skill) => {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter((s) => s !== skill)
        : [...f.skills, skill],
    }));
  };

  // Add custom skill
  const addCustomSkill = () => {
    const s = customSkill.trim();
    if (s && !form.skills.includes(s)) {
      setForm((f) => ({ ...f, skills: [...f.skills, s] }));
    }
    setCustomSkill("");
  };

  const handleSubmit = async () => {
    if (!form.email || !form.role || !form.name) {
      setError("Name, Email aur Role required hai!");
      return;
    }
    if (form.skills.length === 0) {
      setError("Kam se kam ek skill select karo!");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await registerUser(form);
      if (res.success) {
        onRegister(form.email, {
          role: form.role,
          skills: form.skills,
          experience: form.experience,
          preferredLocation: form.wants.location,
          remoteOk: form.wants.remote
        });
      } else {
        setError(res.error || "Registration failed");
      }
    } catch {
      setError("Server se connect nahi ho paya. Backend chal raha hai?");
    } finally {
      setLoading(false);
    }
  };

  const suggestedSkills = ROLE_SKILLS[form.role] || [];

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>🤖</div>
          <h1 style={styles.title}>JOB GPT</h1>
          <p style={styles.subtitle}>AI-powered job discovery for Indian developers</p>
        </div>

        {/* Name */}
        <div style={styles.field}>
          <label style={styles.label}>Your Name</label>
          <input
            style={styles.input}
            placeholder="e.g. Dhruv Mehta"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        {/* Email */}
        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            placeholder="you@gmail.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        {/* Role Dropdown */}
        <div style={styles.field}>
          <label style={styles.label}>Job Role You're Looking For</label>
          <select
            style={styles.select}
            value={form.role}
            onChange={(e) => handleRoleChange(e.target.value)}
          >
            <option value="">-- Select a Role --</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Skills */}
        {form.role && (
          <div style={styles.field}>
            <label style={styles.label}>
              Skills{" "}
              <span style={styles.labelHint}>
                ({form.skills.length} selected — click to toggle)
              </span>
            </label>

            <div style={styles.chipContainer}>
              {suggestedSkills.map((skill) => {
                const selected = form.skills.includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    style={{
                      ...styles.chip,
                      ...(selected ? styles.chipSelected : styles.chipUnselected),
                    }}
                  >
                    {selected ? "✓ " : "+ "}{skill}
                  </button>
                );
              })}
            </div>

            {/* Custom skill input */}
            <div style={styles.customSkillRow}>
              <input
                style={{ ...styles.input, flex: 1, marginBottom: 0 }}
                placeholder="Add custom skill (e.g. GraphQL)"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomSkill()}
              />
              <button style={styles.addBtn} onClick={addCustomSkill}>+ Add</button>
            </div>

            {/* Custom/extra skills */}
            {form.skills.filter((s) => !suggestedSkills.includes(s)).length > 0 && (
              <div style={{ ...styles.chipContainer, marginTop: 8 }}>
                {form.skills
                  .filter((s) => !suggestedSkills.includes(s))
                  .map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      style={{ ...styles.chip, ...styles.chipCustom }}
                    >
                      ✓ {skill} ×
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Experience */}
        <div style={styles.field}>
          <label style={styles.label}>Experience Level</label>
          <select
            style={styles.select}
            value={form.experience}
            onChange={(e) => setForm({ ...form, experience: e.target.value })}
          >
            {EXPERIENCE_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        {/* Preferences */}
        <div style={styles.field}>
          <label style={styles.label}>Job Preferences</label>
          <div style={styles.prefRow}>
            {[
              { key: "remote",  label: "🌐 Remote" },
              { key: "onsite",  label: "🏢 On-site" },
              { key: "startup", label: "🚀 Startup" },
              { key: "bigco",   label: "🏦 MNC/Big Co" },
              { key: "growth",  label: "📈 Growth Focus" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    wants: { ...f.wants, [key]: !f.wants[key] },
                  }))
                }
                style={{
                  ...styles.prefChip,
                  ...(form.wants[key] ? styles.prefSelected : {}),
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>



        {error && <div style={styles.error}>{error}</div>}

        <button
          style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "⏳ Setting up your agent..." : "🚀 Start Finding Jobs"}
        </button>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    background: "#1a1a2e",
    border: "1px solid #2d2d5e",
    borderRadius: 16,
    padding: "36px 32px",
    width: "100%",
    maxWidth: 560,
    boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
  },
  header: {
    textAlign: "center",
    marginBottom: 32,
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    color: "#e2e8f0",
    margin: "0 0 8px",
    letterSpacing: 2,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 14,
    margin: 0,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    display: "block",
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  labelHint: {
    color: "#64748b",
    fontWeight: 400,
    textTransform: "none",
    letterSpacing: 0,
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    color: "#e2e8f0",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
    marginBottom: 0,
  },
  select: {
    width: "100%",
    padding: "10px 14px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    color: "#e2e8f0",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
    cursor: "pointer",
  },
  chipContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    transition: "all 0.15s",
  },
  chipSelected: {
    background: "#6366f1",
    color: "#fff",
  },
  chipUnselected: {
    background: "#1e293b",
    color: "#94a3b8",
    border: "1px solid #334155",
  },
  chipCustom: {
    background: "#065f46",
    color: "#6ee7b7",
  },
  customSkillRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  addBtn: {
    padding: "10px 16px",
    background: "#334155",
    color: "#e2e8f0",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  prefRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  prefChip: {
    padding: "7px 14px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    background: "#1e293b",
    color: "#94a3b8",
    border: "1px solid #334155",
    transition: "all 0.15s",
  },
  prefSelected: {
    background: "#0f4c75",
    color: "#7dd3fc",
    border: "1px solid #0369a1",
  },
  error: {
    background: "#450a0a",
    color: "#fca5a5",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 16,
  },
  submitBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: 0.5,
    marginTop: 8,
  },
};