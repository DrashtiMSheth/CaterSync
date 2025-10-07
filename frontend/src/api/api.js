// frontend/src/api/api.js

const BASE = "http://localhost:5050/api";

/**
 * Helper function for fetch requests
 * Handles errors centrally and prevents JSON parse errors
 */
const request = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);

    const text = await res.text(); // always read as text
    let data;

    try {
      data = JSON.parse(text); // try to parse as JSON
    } catch {
      data = text; // fallback to raw text
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
export const register = (data) =>
  request(`${BASE}/auth/staff/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const login = (data) =>
  request(`${BASE}/auth/staff/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const getStaffProfile = (token) =>
  request(`${BASE}/auth/staff/profile`, {
    headers: { "x-auth-token": token },
  });

export const organiserRegister = (data) =>
  request(`${BASE}/auth/organiser/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), // use JSON unless sending files
  });

export const organiserLogin = (data) =>
  request(`${BASE}/auth/organiser/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  export const getOrganiserProfile = (token) =>
  request(`${BASE}/auth/organiser/profile`, {
    headers: { "x-auth-token": token },
  });
/** ======================= Staff APIs ======================= */
export const getAllStaff = (token) =>
  request(`${BASE}/staff`, {
    headers: { "x-auth-token": token },
  });

export const getStaffById = (id, token) =>
  request(`${BASE}/staff/${id}`, {
    headers: { "x-auth-token": token },
  });

export const updateStaff = (id, data, token) =>
  request(`${BASE}/staff/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-auth-token": token },
    body: JSON.stringify(data),
  });

/** ======================= Event APIs ======================= */
export const getEvents = (token) =>
  request(`${BASE}/events`, {
    headers: { "x-auth-token": token },
  });

export const getEventById = (id, token) =>
  request(`${BASE}/events/${id}`, {
    headers: { "x-auth-token": token },
  });

export const createEvent = (data, token) =>
  request(`${BASE}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-auth-token": token },
    body: JSON.stringify(data),
  });

export const updateEvent = (id, data, token) =>
  request(`${BASE}/events/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-auth-token": token },
    body: JSON.stringify(data),
  });

export const deleteEvent = (id, token) =>
  request(`${BASE}/events/${id}`, {
    method: "DELETE",
    headers: { "x-auth-token": token },
  });

/** ======================= Feedback / Ratings ======================= */
export const submitFeedback = (eventId, data, token) =>
  request(`${BASE}/events/${eventId}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-auth-token": token },
    body: JSON.stringify(data),
  });

/** ======================= Additional APIs ======================= */
// Add more endpoints as your project grows
