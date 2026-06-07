import { useEffect, useRef } from "react";

export default function JobDetailsModal({ job, loading, error, onClose }) {
  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);
  const lastFocusedRef = useRef(null);

  const open = !!(job || loading || error);

  useEffect(() => {
    if (!open) return undefined;

    lastFocusedRef.current = document.activeElement;
    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const focusables = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables?.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      lastFocusedRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onClose} aria-hidden="false">
      <div
        ref={modalRef}
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-details-title"
      >
        <div style={styles.header}>
          <div>
            <h2 id="job-details-title" style={styles.title}>
              {job?.title || "Job details"}
            </h2>
            {job && (
              <p style={styles.meta}>
                {job.company} {job.location ? `· ${job.location}` : ""}
              </p>
            )}
          </div>
          <button ref={closeBtnRef} style={styles.closeBtn} onClick={onClose} aria-label="Close details">
            ✕
          </button>
        </div>

        {loading && (
          <div style={styles.centerBlock}>
            <p style={styles.muted}>Loading job…</p>
          </div>
        )}

        {error && !loading && (
          <div style={styles.centerBlock}>
            <p style={styles.errorText}>{error}</p>
            <p style={styles.muted}>The link may be invalid or the job was removed.</p>
          </div>
        )}

        {job && !loading && (
          <>
            <div style={styles.section}>
              <span style={styles.label}>SPT Class</span>
              <p style={styles.value}>
                AI Match Score {(job.aiScore || job.totalScore || 0)}/100
              </p>
            </div>

            {job.aiSummary && (
              <div style={styles.section}>
                <span style={styles.label}>AI Summary</span>
                <p style={styles.value}>{job.aiSummary}</p>
              </div>
            )}

            {job.whyFit && (
              <div style={styles.section}>
                <span style={styles.label}>Why You Fit</span>
                <p style={styles.value}>{job.whyFit}</p>
              </div>
            )}

            {job.missingSkills?.length > 0 && (
              <div style={styles.section}>
                <span style={styles.label}>Missing Skills</span>
                <div style={styles.chips}>
                  {job.missingSkills.map((skill) => (
                    <span key={skill} style={styles.chip}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {job.match?.reasons?.length > 0 && (
              <div style={styles.section}>
                <span style={styles.label}>Score Reasons</span>
                <p style={styles.value}>{job.match.reasons.join(" | ")}</p>
              </div>
            )}

            {job.suggestion && (
              <div style={styles.section}>
                <span style={styles.label}>Improvement Suggestion</span>
                <p style={styles.value}>{job.suggestion}</p>
              </div>
            )}

            {job.description && (
              <div style={styles.section}>
                <span style={styles.label}>Job Description</span>
                <p style={styles.value}>{job.description}</p>
              </div>
            )}

            <div style={styles.footer}>
              <a href={job.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                <button type="button" style={styles.applyBtn}>Open Job Link</button>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
    padding: 16,
  },
  modal: {
    width: "100%",
    maxWidth: 760,
    maxHeight: "85vh",
    overflowY: "auto",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 12,
    padding: 18,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 12,
  },
  title: {
    margin: 0,
    color: "#e2e8f0",
    fontSize: 22,
  },
  meta: {
    color: "#94a3b8",
    margin: "6px 0 0",
    fontSize: 13,
  },
  closeBtn: {
    border: "1px solid #334155",
    background: "#1e293b",
    color: "#cbd5e1",
    borderRadius: 8,
    cursor: "pointer",
    padding: "6px 10px",
    height: 34,
  },
  centerBlock: {
    padding: "24px 16px",
    textAlign: "center",
  },
  muted: {
    color: "#94a3b8",
    fontSize: 14,
    margin: 0,
  },
  errorText: {
    color: "#fecaca",
    fontSize: 15,
    fontWeight: 600,
    margin: "0 0 8px",
  },
  section: {
    borderTop: "1px solid #1e293b",
    paddingTop: 12,
    marginTop: 10,
  },
  label: {
    display: "block",
    color: "#64748b",
    textTransform: "uppercase",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  value: {
    color: "#cbd5e1",
    fontSize: 14,
    margin: 0,
    whiteSpace: "pre-wrap",
    lineHeight: 1.5,
  },
  chips: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  chip: {
    background: "#451a03",
    color: "#fcd34d",
    borderRadius: 4,
    fontSize: 11,
    padding: "3px 8px",
    fontWeight: 600,
  },
  footer: {
    marginTop: 18,
    display: "flex",
    justifyContent: "flex-end",
  },
  applyBtn: {
    padding: "9px 14px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    color: "#fff",
    fontWeight: 700,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  },
};
