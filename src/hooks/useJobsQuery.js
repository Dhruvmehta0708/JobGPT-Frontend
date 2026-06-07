import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchJobs, fetchNewJobs, resetJobs } from "../services/api";

const EMPTY_SUMMARY = { targets: 0, prospects: 0, suspects: 0 };

export function useJobsQuery(email, showToast, searchConfig) {
  const [jobs, setJobs] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [savedFilter, setSavedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("totalScore");
  const [sortOrder, setSortOrder] = useState("desc");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const cacheRef = useRef(new Map());

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timeout);
  }, [query]);

  const queryParams = useMemo(() => {
    return {
      role: searchConfig?.role,
      skills: searchConfig?.skills || [],
      experienceYears: searchConfig?.experienceYears || 0,
      preferredLocation: searchConfig?.preferredLocation || "India",
      remoteOk: Boolean(searchConfig?.remoteOk),
      q: debouncedQuery
    };
  }, [searchConfig, debouncedQuery]);

  const cacheKey = `${email}:${JSON.stringify(queryParams)}`;

  const loadJobs = useCallback(
    async ({ forceRefresh = false } = {}) => {
      setLoading(true);
      setError("");
      try {
        if (!forceRefresh && cacheRef.current.has(cacheKey)) {
          const cached = cacheRef.current.get(cacheKey);
          setJobs(cached.jobs);
          setSummary(cached.summary);
          setTotalPages(cached.totalPages);
          return;
        }

        const data = await fetchJobs(email, queryParams);
        let jobsFlat = data.jobsFlat || [];
        if (statusFilter !== "all") {
          jobsFlat = jobsFlat.filter((job) => (job.status || "not_applied") === statusFilter);
        }
        if (savedFilter !== "all") {
          jobsFlat = jobsFlat.filter((job) => String(Boolean(job.isSaved)) === savedFilter);
        }
        if (activeTab === "targets") jobsFlat = jobsFlat.filter((j) => (j.aiScore || 0) > 70);
        if (activeTab === "prospects") jobsFlat = jobsFlat.filter((j) => (j.aiScore || 0) >= 40 && (j.aiScore || 0) <= 70);
        if (activeTab === "suspects") jobsFlat = [];

        jobsFlat = [...jobsFlat].sort((a, b) => {
          if (sortBy === "fetchedAt") return new Date(b.fetchedAt) - new Date(a.fetchedAt);
          if (sortBy === "company") return String(a.company).localeCompare(String(b.company));
          if (sortBy === "title") return String(a.title).localeCompare(String(b.title));
          return (b.aiScore || b.totalScore || 0) - (a.aiScore || a.totalScore || 0);
        });
        if (sortOrder === "asc") jobsFlat.reverse();

        const nextSummary = data.summary || EMPTY_SUMMARY;
        const nextTotalPages = Math.max(1, Math.ceil(jobsFlat.length / 12));
        const paged = jobsFlat.slice((page - 1) * 12, page * 12);

        setJobs(paged);
        setSummary(nextSummary);
        setTotalPages(nextTotalPages);

        cacheRef.current.set(cacheKey, {
          jobs: paged,
          summary: nextSummary,
          totalPages: nextTotalPages,
        });
      } catch (err) {
        setError(err.message || "Unable to load jobs");
        showToast(`❌ ${err.message || "Failed to load jobs"}`);
      } finally {
        setLoading(false);
      }
    },
    [activeTab, cacheKey, email, page, queryParams, savedFilter, showToast, sortBy, sortOrder, statusFilter]
  );

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const refreshJobs = useCallback(async () => {
    await loadJobs({ forceRefresh: true });
  }, [loadJobs]);

  const triggerFetch = useCallback(async () => {
    setFetching(true);
    showToast("🤖 Fetching fresh jobs...");
    try {
      const result = await fetchNewJobs(email);
      if (result.success) {
        cacheRef.current.clear();
        setPage(1);
        showToast(
          `✅ New jobs: 🎯 ${result.summary.targets} | 👀 ${result.summary.prospects} | 🔍 ${result.summary.suspects}`
        );
        await loadJobs({ forceRefresh: true });
      } else {
        showToast(`⚠️ ${result.error || "Fetch failed"}`);
      }
    } catch (err) {
      showToast(`❌ ${err.message || "Fetch failed"}`);
    } finally {
      setFetching(false);
    }
  }, [email, loadJobs, showToast]);

  const resetListing = useCallback(async () => {
    await resetJobs();
    cacheRef.current.clear();
    setPage(1);
    await loadJobs({ forceRefresh: true });
  }, [loadJobs]);

  const patchJobInState = useCallback((jobId, patch) => {
    setJobs((prev) =>
      prev.map((job) => (job._id === jobId ? { ...job, ...patch } : job))
    );
  }, []);

  return {
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
    loadJobs,
    refreshJobs,
    triggerFetch,
    resetListing,
    patchJobInState,
  };
}
