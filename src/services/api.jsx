const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  return search.toString();
}

async function requestWithRetry(url, options = {}, retries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const message = payload?.error || payload?.message || `HTTP ${res.status}`;
        throw new Error(message);
      }
      return res.json();
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      const delay = 300 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

export const fetchJobs = async (email, params = {}) => {
  const payload = {
    email,
    role: params.role,
    skills: params.skills,
    experienceYears: params.experienceYears,
    preferredLocation: params.preferredLocation,
    remoteOk: params.remoteOk,
    freshOnly: Boolean(params.freshOnly)
  };
  return requestWithRetry(
    `${BASE_URL}/api/jobs/search`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    },
    1
  );
};

export const fetchJobById = async (email, jobId) => {
  const url = `${BASE_URL}/api/jobs/${jobId}?email=${encodeURIComponent(email)}`;
  return requestWithRetry(url, { method: "GET" }, 1);
};


export const fetchNewJobs = async (email) => {
  return requestWithRetry(
    `${BASE_URL}/api/jobs/refresh`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    },
    0
  );
};

export const registerUser = async (data) => {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const updateJobStatus = async (jobId, email, data) => {
  if (Object.prototype.hasOwnProperty.call(data, "isSaved")) {
    return requestWithRetry(`${BASE_URL}/api/jobs/${jobId}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, isSaved: data.isSaved })
    });
  }

  if (data.status === "applied") {
    return requestWithRetry(`${BASE_URL}/api/jobs/${jobId}/apply-click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
  }

  return requestWithRetry(`${BASE_URL}/user-job/${jobId}/${email}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
};

export const resetJobs = async () => {
  return requestWithRetry(`${BASE_URL}/reset-memory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
};