import { useEffect, useState } from "react";
import { updateJobStatus } from "../services/api";

const STATUS_OPTIONS = [
  { value: "not_applied", label: "Not Applied",  color: "#64748b" },
  { value: "applied",     label: "✅ Applied",   color: "#22c55e" },
  { value: "interview",   label: "🎯 Interview", color: "#f59e0b" },
  { value: "rejected",    label: "❌ Rejected",  color: "#ef4444" },
];

export default function JobCard({ job, email, onOpenDetails, onJobPatch }) {
  const [saved,  setSaved]  = useState(job.isSaved  || false);
  const [status, setStatus] = useState(job.status   || "not_applied");
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    setSaved(job.isSaved || false);
    setStatus(job.status || "not_applied");
  }, [job.isSaved, job.status, job._id]);

  const sptColor = {
    Target:   "#22c55e",
    Prospect: "#f59e0b",
    Suspect:  "#ef4444",
  }[job.sptClass] || "#94a3b8";
  const score = job.aiScore || job.totalScore || 0;
  const reasons = job.match?.reasons || [];

  const handleSave = async () => {
    setActionError("");
    const newSaved = !saved;
    setSaved(newSaved);
    setSaving(true);
    try {
      await updateJobStatus(job._id, email, { isSaved: newSaved });
      onJobPatch?.(job._id, { isSaved: newSaved });
    } catch {
      setSaved(!newSaved); // revert
      setActionError("Could not update save state.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (e) => {
    setActionError("");
    const newStatus = e.target.value;
    const prevStatus = status;
    setStatus(newStatus);
    setStatusUpdating(true);
    try {
      await updateJobStatus(job._id, email, { status: newStatus });
      onJobPatch?.(job._id, { status: newStatus });
    } catch {
      setStatus(prevStatus); // revert
      setActionError("Could not update status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ flex: 1 }}>
          <div style={styles.titleRow}>
            <h3 style={styles.title}>{job.title}</h3>
            <span style={{ ...styles.sptBadge, background: sptColor + "22", color: sptColor, border: `1px solid ${sptColor}55` }}>
              AI Match · {score}/100
            </span>
          </div>
          <p style={styles.company}>
            🏢 {job.company}
            {job.location && <span style={styles.location}> · 📍 {job.location}</span>}
          </p>
          {job.salary && <p style={styles.salary}>💰 {job.salary}</p>}
        </div>
      </div>

      {/* Score bar */}
      <div style={styles.scoreBarBg}>
        <div style={{ ...styles.scoreBarFill, width: `${score}%`, background: sptColor }} />
      </div>

      {/* AI Summary */}
      {job.aiSummary && (
        <p style={styles.aiSummary}>💡 {job.aiSummary}</p>
      )}
      {reasons.length > 0 && (
        <p style={styles.aiSummary}>🧠 {reasons.join(" | ")}</p>
      )}

      {/* Expandable details */}
      {(job.whyFit || job.missingSkills?.length > 0 || job.suggestion) && (
        <button style={styles.expandBtn} onClick={() => setExpanded(!expanded)}>
          {expanded ? "▲ Hide AI Analysis" : "▼ Show AI Analysis"}
        </button>
      )}

      {expanded && (
        <div style={styles.expandedSection}>
          {job.whyFit && (
            <div style={styles.analysisBlock}>
              <span style={styles.analysisLabel}>✅ Why You Fit</span>
              <p style={styles.analysisText}>{job.whyFit}</p>
            </div>
          )}
          {job.missingSkills?.length > 0 && (
            <div style={styles.analysisBlock}>
              <span style={styles.analysisLabel}>⚠️ Missing Skills</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                {job.missingSkills.map((s) => (
                  <span key={s} style={styles.missingChip}>{s}</span>
                ))}
              </div>
            </div>
          )}
          {job.suggestion && (
            <div style={styles.analysisBlock}>
              <span style={styles.analysisLabel}>💪 How to Improve</span>
              <p style={styles.analysisText}>{job.suggestion}</p>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {job.tags?.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0" }}>
          {job.tags.slice(0, 5).map((tag) => (
            <span key={tag} style={styles.tag}>{tag}</span>
          ))}
        </div>
      )}

      {/* Footer actions */}
      <div style={styles.footer}>
        <button
          style={styles.detailsBtn}
          onClick={() => onOpenDetails?.(job._id)}
        >
          View Details
        </button>
        <a href={job.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
          <button style={styles.applyBtn}>Apply Now 🚀</button>
        </a>

        <button
          style={{ ...styles.saveBtn, ...(saved ? styles.saveBtnActive : {}) }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "..." : saved ? "⭐ Saved" : "☆ Save"}
        </button>

        <select
          style={styles.statusSelect}
          value={status}
          onChange={handleStatus}
          disabled={statusUpdating}
        >
          {STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      {actionError && <p style={styles.actionError}>{actionError}</p>}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  card: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 12,
    padding: "18px 20px",
    marginBottom: 14,
    transition: "border-color 0.2s",
  },
  header: { display: "flex", gap: 12, marginBottom: 10 },
  titleRow: { display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap", marginBottom: 4 },
  title: { color: "#e2e8f0", fontSize: 16, fontWeight: 700, margin: 0, flex: 1 },
  sptBadge: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" },
  company: { color: "#94a3b8", fontSize: 13, margin: "0 0 4px" },
  location: { color: "#64748b" },
  salary: { color: "#4ade80", fontSize: 13, fontWeight: 600, margin: 0 },
  scoreBarBg: { height: 3, background: "#334155", borderRadius: 2, margin: "10px 0" },
  scoreBarFill: { height: "100%", borderRadius: 2, transition: "width 0.3s" },
  aiSummary: {
    color: "#94a3b8",
    fontSize: 13,
    margin: "8px 0",
    borderLeft: "3px solid #6366f1",
    paddingLeft: 10,
    fontStyle: "italic",
  },
  expandBtn: {
    background: "none",
    border: "none",
    color: "#6366f1",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    padding: "4px 0",
    marginBottom: 4,
  },
  expandedSection: {
    background: "#0f172a",
    borderRadius: 8,
    padding: "12px 14px",
    marginBottom: 10,
    border: "1px solid #1e293b",
  },
  analysisBlock: { marginBottom: 10 },
  analysisLabel: { color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  analysisText: { color: "#cbd5e1", fontSize: 13, margin: "4px 0 0" },
  missingChip: {
    padding: "3px 8px",
    background: "#451a03",
    color: "#fcd34d",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
  },
  tag: {
    padding: "3px 8px",
    background: "#0f172a",
    color: "#64748b",
    borderRadius: 4,
    fontSize: 11,
    border: "1px solid #1e293b",
  },
  footer: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 12 },
  applyBtn: {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  detailsBtn: {
    padding: "8px 14px",
    background: "#0f172a",
    color: "#a5b4fc",
    border: "1px solid #3730a3",
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  saveBtn: {
    padding: "8px 14px",
    background: "#1e293b",
    color: "#94a3b8",
    border: "1px solid #334155",
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  saveBtnActive: {
    background: "#451a03",
    color: "#fbbf24",
    border: "1px solid #92400e",
  },
  statusSelect: {
    padding: "7px 10px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 7,
    color: "#94a3b8",
    fontSize: 12,
    cursor: "pointer",
    outline: "none",
  },
  actionError: {
    margin: "8px 0 0",
    color: "#fca5a5",
    fontSize: 12,
    fontWeight: 600,
  },
};