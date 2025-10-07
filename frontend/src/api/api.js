// frontend/src/api/api.js

const BASE = process.env.REACT_APP_API_URL || "http://localhost:5050/api";

/**
 * Build headers including token if provided
 * @param {string} token 
 * @param {boolean} isJSON 
 * @returns {object} headers
 */
const buildHeaders = (token, isJSON = true) => {
  const headers = {};
  if (isJSON) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

/**
 * Central request helper
 * @param {string} url 
 * @param {object} options 
 * @returns {Promise<any>}
 */
const request = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!res.ok) {
      throw new Error(data?.message || res.statusText || "API request failed");
    }

    return data;
  } catch (err) {
    console.error("API Error:", err.message);
    throw err;
  }
};

/** ======================= Auth APIs ======================= */
export const registerStaff = (data) =>
  request(`${BASE}/auth/staff/register`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });

export const loginStaff = (data) =>
  request(`${BASE}/auth/staff/login`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });

export const getStaffProfile = (token) =>
  request(`${BASE}/auth/staff/profile`, {
    headers: buildHeaders(token),
  });

export const registerOrganiser = (data) =>
  request(`${BASE}/auth/organiser/register`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });

export const loginOrganiser = (data) =>
  request(`${BASE}/auth/organiser/login`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });

export const getOrganiserProfile = (token) =>
  request(`${BASE}/auth/organiser/profile`, {
    headers: buildHeaders(token),
  });

/** ======================= Staff APIs ======================= */
export const getAllStaff = (token) =>
  request(`${BASE}/staff`, {
    headers: buildHeaders(token),
  });

export const getStaffById = (id, token) =>
  request(`${BASE}/staff/${id}`, {
    headers: buildHeaders(token),
  });

export const updateStaff = (id, data, token) =>
  request(`${BASE}/staff/${id}`, {
    method: "PUT",
    headers: buildHeaders(token),
    body: JSON.stringify(data),
  });

/** ======================= Event APIs ======================= */
export const getEvents = (token) =>
  request(`${BASE}/events`, {
    headers: buildHeaders(token),
  });

export const getEventById = (id, token) =>
  request(`${BASE}/events/${id}`, {
    headers: buildHeaders(token),
  });

export const createEvent = (data, token) =>
  request(`${BASE}/events`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(data),
  });

export const updateEvent = (id, data, token) =>
  request(`${BASE}/events/${id}`, {
    method: "PUT",
    headers: buildHeaders(token),
    body: JSON.stringify(data),
  });

export const deleteEvent = (id, token) =>
  request(`${BASE}/events/${id}`, {
    method: "DELETE",
    headers: buildHeaders(token),
  });

/** ======================= Feedback / Ratings ======================= */
export const submitFeedback = (eventId, data, token) =>
  request(`${BASE}/events/${eventId}/feedback`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(data),
  });

/** ======================= Utility ======================= */
// Example: generic GET with token
export const fetchWithToken = (endpoint, token) =>
  request(`${BASE}${endpoint}`, {
    headers: buildHeaders(token),
  });
