// src/api/api.js
const BASE = process.env.REACT_APP_API_URL || "http://localhost:5050/api";

/**
 * Build headers including token if provided.
 * Automatically skips Content-Type for FormData.
 * @param {string} token
 * @param {any} body
 * @returns {object} headers
 */
const buildHeaders = (token, body) => {
  const headers = {};
  if (!(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["x-auth-token"] = token;
  return headers;
};

/**
 * Central request helper
 * Supports GET, POST, PUT, DELETE, FormData, query params
 * @param {string} url
 * @param {object} options
 * @returns {Promise<any>}
 */
const request = async (url, options = {}) => {
  try {
    let finalUrl = url;

    // Handle query params
    if (options.params) {
      const query = new URLSearchParams(options.params).toString();
      finalUrl += `?${query}`;
    }

    // Build headers
    if (!options.headers) options.headers = buildHeaders(options.token, options.body);

    // Convert body to JSON if not FormData
    if (options.body && !(options.body instanceof FormData) && options.method !== "GET") {
      options.body = JSON.stringify(options.body);
    }

    const res = await fetch(finalUrl, options);
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!res.ok) {
      const validationMsg = Array.isArray(data?.errors) && data.errors[0]?.msg;
      const msg = validationMsg || data?.message || res.statusText || "API request failed";
      throw new Error(msg);
    }

    return data;
  } catch (err) {
    console.error("API Error:", err.message);
    throw err;
  }
};

/** ======================= Auth APIs ======================= */
export const registerStaff = (formData) =>
  request(`${BASE}/auth/staff/register`, { method: "POST", body: formData });

export const loginStaff = (credentials) =>
  request(`${BASE}/auth/staff/login`, { method: "POST", body: credentials });

export const getStaffProfile = (token) =>
  request(`${BASE}/auth/staff/profile`, { headers: buildHeaders(token) });

export const registerOrganiser = (formData) =>
  request(`${BASE}/organiser/register`, { method: "POST", body: formData });

// export const sendOtp = (data) =>
//   request(`${BASE}/otp/send-otp`, { method: "POST", body: data });

export const sendOtp = async (phone) => {
  try {
    const res = await fetch(`${BASE}/otp/send-otp`, {  // ✅ correct endpoint
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("OTP Error:", err);
    throw err;
  }
};

export const loginOrganiser = (credentials) =>
  request(`${BASE}/auth/organiser/login`, { method: "POST", body: credentials });

export const getOrganiserProfile = (token) =>
  request(`${BASE}/auth/organiser/profile`, { headers: buildHeaders(token) });

/** ======================= Staff APIs ======================= */
export const getAllStaff = (token, params = {}) =>
  request(`${BASE}/staff`, { headers: buildHeaders(token), params });

export const getStaffById = (id, token) =>
  request(`${BASE}/staff/${id}`, { headers: buildHeaders(token) });

export const updateStaff = (id, data, token) =>
  request(`${BASE}/staff/${id}`, {
    method: "PUT",
    body: data,
    headers: buildHeaders(token, data),
  });

/** ======================= Event APIs ======================= */
export const getEvents = (token, params = {}) =>
  request(`${BASE}/events`, { headers: buildHeaders(token), params });

export const getEventById = (id, token) =>
  request(`${BASE}/events/${id}`, { headers: buildHeaders(token) });

export const createEvent = (data, token) =>
  request(`${BASE}/events`, {
    method: "POST",
    body: data,
    headers: buildHeaders(token, data),
  });

export const updateEvent = (id, data, token) =>
  request(`${BASE}/events/${id}`, {
    method: "PUT",
    body: data,
    headers: buildHeaders(token, data),
  });

export const deleteEvent = (id, token) =>
  request(`${BASE}/events/${id}`, { method: "DELETE", headers: buildHeaders(token) });

// Staff-facing events and applications
export const getStaffAvailableEvents = (token) =>
  request(`${BASE}/events/staff`, { headers: buildHeaders(token) });

export const staffApplyForEvent = (eventId, token) =>
  request(`${BASE}/events/staff/apply`, { method: "POST", body: { eventId }, headers: buildHeaders(token) });

export const staffCancelApplication = (eventId, token) =>
  request(`${BASE}/events/staff/apply`, { method: "DELETE", body: { eventId }, headers: buildHeaders(token) });

/** ======================= Feedback / Ratings ======================= */
export const submitFeedback = (eventId, data, token) =>
  request(`${BASE}/events/${eventId}/feedback`, {
    method: "POST",
    body: data,
    headers: buildHeaders(token, data),
  });

/** ======================= Utility ======================= */
export const fetchWithToken = (endpoint, token, params = {}) =>
  request(`${BASE}${endpoint}`, { headers: buildHeaders(token), params });
