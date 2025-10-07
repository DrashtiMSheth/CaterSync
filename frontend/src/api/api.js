// frontend/src/api/api.js

const BASE = "http://localhost:5000/api";

/**
 * Helper function for fetch requests
 * Handles errors centrally
 */
const request = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);

    // Handle HTTP errors
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "API request failed");
    }

    return res.json();
  } catch (err) {
    console.error("API Error:", err.message);
    throw err;
  }
};

/** ======================= Auth APIs ======================= */
export const register = (data) =>
  request(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const login = (data) =>
  request(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const getProfile = (token) =>
  request(`${BASE}/auth/me`, {
    headers: { "x-auth-token": token },
  });
  
  export const organiserRegister = (data) =>
  request(`${BASE}/auth/organiser/register`, {
    method: "POST",
    body: data, // can use JSON or FormData
  });

export const organiserLogin = (data) =>
  request(`${BASE}/auth/organiser/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
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

/** ======================= Feedback / Ratings (if any) ======================= */
export const submitFeedback = (eventId, data, token) =>
  request(`${BASE}/events/${eventId}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-auth-token": token },
    body: JSON.stringify(data),
  });

/** ======================= Additional APIs ======================= */
// Add more endpoints as your project grows

