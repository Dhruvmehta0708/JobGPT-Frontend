import { useCallback, useEffect, useMemo, useState } from "react";
import JobCard from "../Components/JobCard";
import JobDetailsModal from "../Components/JobDetailsModal";
import { useJobsQuery } from "../hooks/useJobsQuery";
import { fetchJobById } from "../services/api";

const HISTORY_STATE_KEY = "jobGPTModal";

function buildUrlWithJob(jobId) {
  const params = new URLSearchParams(window.location.search);
  if (jobId) params.set("job", jobId);
  else params.delete("job");
  const q = params.toString();
  return `${window.location.pathname}${q ? `?${q}` : ""}`;
}

export default function Dashboard({ email, profile, onLogout }) {
  const [selectedJobId, setSelectedJobId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("job");
  });
  const [fetchedJob, setFetchedJob] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [toast, setToast] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(Boolean(profile?.remoteOk));
  const [experienceYears, setExperienceYears] = useState(0);
  const preferredLocation = "India";

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const searchConfig = useMemo(
    () => ({
      role: profile?.role || "",
      skills: profile?.skills || [],
      preferredLocation,
      remoteOk: remoteOnly,
      experienceYears
    }),
    [experienceYears, preferredLocation, profile, remoteOnly]
  );

  const {
    jobs,
    summary,
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    savedFilter,
    setSavedFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    query,
    setQuery,
    loading,
    fetching,
    error,
    page,
    setPage,
    totalPages,
    refreshJobs,
    triggerFetch,
    resetListing,
    patchJobInState,
  } = useJobsQuery(email, showToast, searchConfig);

  const handleFetch = async () => {
    await triggerFetch();
  };

  const handleReset = async () => {
    if (!window.confirm("Reset listing state?")) return;
    try {
      await resetListing();
      showToast("🔄 Listing state reset");
    } catch (err) {
      showToast(`❌ ${err.message || "Reset failed"}`);
    }
  };

  const handleJobPatch = (jobId, patch) => {
    patchJobInState(jobId, patch);
    setFetchedJob((prev) => (prev && prev._id === jobId ? { ...prev, ...patch } : prev));
  };

  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;
    return jobs.find((job) => job._id === selectedJobId) || fetchedJob || null;
  }, [jobs, selectedJobId, fetchedJob]);

  const openJobDetails = useCallback((jobId) => {
    const params = new URLSearchParams(window.location.search);
    const current = params.get("job");
    const nextUrl = buildUrlWithJob(jobId);
    if (current === jobId) {
      setSelectedJobId(jobId);
      return;
    }
    window.history.pushState({ [HISTORY_STATE_KEY]: true }, "", nextUrl);
    setSelectedJobId(jobId);
  }, []);

  const closeJobDetails = useCallback(() => {
    if (window.history.state?.[HISTORY_STATE_KEY]) {
      window.history.back();
      return;
    }
    const nextUrl = buildUrlWithJob(null);
    window.history.replaceState({}, "", nextUrl);
    setSelectedJobId(null);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      setSelectedJobId(params.get("job"));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!selectedJobId) {
      setFetchedJob(null);
      setDetailError("");
      setDetailLoading(false);
    }
  }, [selectedJobId]);

  useEffect(() => {
    if (!selectedJobId || loading) return;

    const inList = jobs.some((j) => j._id === selectedJobId);
    if (inList) {
      setFetchedJob(null);
      setDetailError("");
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setDetailError("");

    (async () => {
      try {
        const data = await fetchJobById(email, selectedJobId);
        if (!cancelled) setFetchedJob(data.job);
      } catch (err) {
        if (!cancelled) {
          setFetchedJob(null);
          setDetailError(err.message || "Could not load job");
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedJobId, jobs, loading, email]);

  const showDetailsModal = Boolean(
    selectedJobId && (selectedJob || detailLoading || detailError)
  );
  const modalJob = selectedJob;
  const modalLoading = Boolean(selectedJobId && !modalJob && detailLoading);
  const modalError = selectedJobId && !modalJob && !detailLoading ? detailError : "";

  const tabCount = (tab) => {
    if (tab === "targets") return summary.targets || 0;
    if (tab === "prospects") return summary.prospects || 0;
    if (tab === "suspects") return summary.suspects || 0;
    return (summary.targets || 0) + (summary.prospects || 0) + (summary.suspects || 0);
  };

  const TABS = [
    { key: "all", label: "📋 All", color: "#6366f1" },
    { key: "targets",   label: "🎯 Targets",   color: "#22c55e" },
    { key: "prospects", label: "👀 Prospects",  color: "#f59e0b" },
    { key: "suspects",  label: "🔍 Suspects",   color: "#ef4444" },
  ];

  return (
    <div style={styles.page}>
      {/* Toast */}
      {toast && <div style={styles.toast}>{toast}</div>}

      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <span style={styles.navLogo}>🤖</span>
          <span style={styles.navTitle}>JOB GPT</span>
        </div>
        <div style={styles.navRight}>
          <span style={styles.navEmail}>{email}</span>
          <button style={styles.logoutBtn} onClick={onLogout}>Logout</button>
        </div>
      </nav>

      <div style={styles.container}>
        {/* Action Bar */}
        <div style={styles.actionBar}>
          <div style={styles.actionLeft}>
            <button
              style={{ ...styles.btn, ...styles.btnPrimary, opacity: fetching ? 0.7 : 1 }}
              onClick={handleFetch}
              disabled={fetching}
            >
              {fetching ? "⏳ Fetching..." : "🚀 Fetch New Jobs"}
            </button>

            <button
              style={{ ...styles.btn, ...styles.btnSecondary, opacity: loading ? 0.7 : 1 }}
              onClick={refreshJobs}
              disabled={loading}
            >
              {loading ? "⏳ Loading..." : "📥 Load Jobs"}
            </button>

            <button style={{ ...styles.btn, ...styles.btnDanger }} onClick={handleReset}>
              🔄 Reset
            </button>
          </div>

          <div style={styles.statsRow}>
            <span style={{ ...styles.statBadge, background: "#1e1b4b", color: "#a5b4fc" }}>
              📋 {tabCount("all")} Total
            </span>
            <span style={{ ...styles.statBadge, background: "#14532d", color: "#86efac" }}>
              🎯 {tabCount("targets")} Targets
            </span>
            <span style={{ ...styles.statBadge, background: "#451a03", color: "#fcd34d" }}>
              👀 {tabCount("prospects")} Prospects
            </span>
            <span style={{ ...styles.statBadge, background: "#450a0a", color: "#fca5a5" }}>
              🔍 {tabCount("suspects")} Suspects
            </span>
          </div>
        </div>

        <div style={styles.filterRow}>
          <input
            style={styles.searchInput}
            placeholder="Search title, company, location, tags..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
          <select style={styles.filterSelect} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="all">All status</option>
            <option value="not_applied">Not applied</option>
            <option value="applied">Applied</option>
            <option value="interview">Interview</option>
            <option value="rejected">Rejected</option>
          </select>
          <select style={styles.filterSelect} value={savedFilter} onChange={(e) => { setSavedFilter(e.target.value); setPage(1); }}>
            <option value="all">Saved + Unsaved</option>
            <option value="true">Saved only</option>
            <option value="false">Unsaved only</option>
          </select>
          <select style={styles.filterSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="totalScore">Sort: Score</option>
            <option value="fetchedAt">Sort: Newest</option>
            <option value="company">Sort: Company</option>
            <option value="title">Sort: Title</option>
          </select>
          <select style={styles.filterSelect} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
          <select
            style={styles.filterSelect}
            value={remoteOnly ? "remote" : "all"}
            onChange={(e) => setRemoteOnly(e.target.value === "remote")}
          >
            <option value="all">All work modes</option>
            <option value="remote">Remote preferred</option>
          </select>
          <select
            style={styles.filterSelect}
            value={String(experienceYears)}
            onChange={(e) => setExperienceYears(Number(e.target.value))}
          >
            <option value="0">Any experience</option>
            <option value="1">1+ years</option>
            <option value="2">2+ years</option>
            <option value="3">3+ years</option>
            <option value="5">5+ years</option>
          </select>

        </div>

        {/* Tabs */}
        <div style={styles.tabBar}>
          {TABS.map(({ key, label, color }) => (
            <button
              key={key}
              style={{
                ...styles.tab,
                ...(activeTab === key ? { ...styles.tabActive, borderColor: color, color } : {}),
              }}
              onClick={() => setActiveTab(key)}
            >
              {label}
              <span style={{
                ...styles.tabCount,
                background: activeTab === key ? color : "#334155",
              }}>
                {tabCount(key)}
              </span>
            </button>
          ))}
        </div>

        {/* Job List */}
        {loading ? (
          <div style={styles.emptyState}>
            <h3 style={{ color: "#e2e8f0", margin: "0 0 8px" }}>Loading jobs...</h3>
            <p style={{ color: "#94a3b8", margin: 0 }}>Fetching best matches for your filters.</p>
          </div>
        ) : error ? (
          <div style={styles.emptyState}>
            <h3 style={{ color: "#fecaca", margin: "0 0 8px" }}>Could not load jobs</h3>
            <p style={{ color: "#94a3b8", margin: "0 0 14px" }}>{error}</p>
            <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={refreshJobs}>
              Retry
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
            <h3 style={{ color: "#e2e8f0", margin: "0 0 8px" }}>No jobs found</h3>
            <p style={{ color: "#94a3b8", margin: "0 0 20px" }}>
              Try changing filters or fetch fresh jobs from sources.
            </p>
            <button
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={handleFetch}
              disabled={fetching}
            >
              {fetching ? "⏳ Searching..." : "🚀 Start Fetching"}
            </button>
          </div>
        ) : (
          <div>
            {jobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                email={email}
                onOpenDetails={(job) => openJobDetails(job._id)}
                onJobPatch={handleJobPatch}
              />
            ))}
            <div style={styles.paginationRow}>
              <button
                style={{ ...styles.btn, ...styles.btnSecondary }}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Prev
              </button>
              <span style={{ color: "#94a3b8", fontSize: 13 }}>
                Page {page} / {totalPages}
              </span>
              <button
                style={{ ...styles.btn, ...styles.btnSecondary }}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
      {showDetailsModal && (
        <JobDetailsModal
          job={modalJob}
          loading={modalLoading}
          error={modalError}
          onClose={closeJobDetails}
        />
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    fontFamily: "'Segoe UI', sans-serif",
  },
  toast: {
    position: "fixed",
    top: 16,
    right: 16,
    background: "#1e293b",
    color: "#e2e8f0",
    padding: "12px 20px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    zIndex: 9999,
    border: "1px solid #334155",
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
    maxWidth: 300,
  },
  navbar: {
    background: "#1e293b",
    borderBottom: "1px solid #334155",
    padding: "14px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navLeft: { display: "flex", alignItems: "center", gap: 10 },
  navLogo: { fontSize: 24 },
  navTitle: { fontSize: 18, fontWeight: 800, color: "#e2e8f0", letterSpacing: 1 },
  navRight: { display: "flex", alignItems: "center", gap: 12 },
  navEmail: { color: "#94a3b8", fontSize: 13 },
  logoutBtn: {
    padding: "6px 14px",
    background: "transparent",
    border: "1px solid #334155",
    borderRadius: 6,
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 12,
  },
  container: { maxWidth: 860, margin: "0 auto", padding: "24px 16px" },
  actionBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionLeft: { display: "flex", gap: 8, flexWrap: "wrap" },
  btn: {
    padding: "9px 18px",
    borderRadius: 8,
    border: "none",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  btnPrimary: { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff" },
  btnSecondary: { background: "#1e293b", color: "#cbd5e1", border: "1px solid #334155" },
  btnDanger:    { background: "#450a0a", color: "#fca5a5" },
  statsRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  filterRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  searchInput: {
    flex: "1 1 240px",
    minWidth: 220,
    padding: "9px 10px",
    borderRadius: 8,
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#e2e8f0",
    fontSize: 13,
    outline: "none",
  },
  filterSelect: {
    padding: "9px 10px",
    borderRadius: 8,
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#cbd5e1",
    fontSize: 12,
    outline: "none",
  },
  statBadge: {
    padding: "5px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  tabBar: {
    display: "flex",
    gap: 4,
    marginBottom: 20,
    borderBottom: "1px solid #1e293b",
    paddingBottom: 0,
  },
  tab: {
    padding: "10px 18px",
    background: "transparent",
    border: "2px solid transparent",
    borderBottom: "2px solid transparent",
    borderRadius: "8px 8px 0 0",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    transition: "all 0.2s",
  },
  tabActive: {
    background: "#1e293b",
    color: "#e2e8f0",
  },
  tabCount: {
    padding: "2px 7px",
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 700,
    color: "#fff",
    transition: "background 0.2s",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    background: "#1e293b",
    borderRadius: 12,
    border: "1px solid #334155",
  },
  paginationRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
  },
};