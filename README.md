# 🎯 CaterSync — Where Organisers & Staff Work in Perfect Sync

**CaterSync** is a real-time, location-based **event workforce management platform** that connects event organisers with catering and event staff for seamless event execution.  

From chefs and servers to drivers and DJs — CaterSync brings every role under one unified digital system for efficient, transparent coordination.

---

## 🚀 Overview

Managing workforce during large events can be chaotic — from chefs and waiters to drivers and decorators, every role matters.  

**CaterSync** eliminates this chaos by offering a **modern, intelligent workforce management solution** that ensures the right people are at the right place, at the right time.

---

## 🌟 Key Features

### 👨‍💼 For Event Organisers
- ✅ **Secure Registration & OTP Authentication**
- 🗓️ **Event Creation & Management** — create, edit, and monitor events
- 🧾 **Staff Application Handling** — approve, reject, or review applicants
- 🔔 **Real-time Notifications** (powered by WebSockets)
- 📊 **Dashboard Analytics** for insights and decision-making
- 📍 **Live Location Tracking** of assigned staff

### 👩‍🍳 For Staff Members
- 👤 **Profile Management** with skill and availability setup
- 🔍 **Event Discovery** based on location and skillset
- 🚀 **Live Application Tracking** with instant updates
- 🔑 **OTP-based Authentication** for security
- 💬 **Real-time Communication** with organisers

---

## ⚙️ System Features

- ⚡ **Real-time Communication** — powered by Socket.io  
- 🎨 **Modern, Responsive Frontend** — built with React + Tailwind + MUI  
- 🔐 **Role-based Access Control** — organiser vs. staff permissions  
- 📁 **File Uploads** — profile images & event documents  
- 🧠 **Scalable Backend Architecture** — Express.js + MongoDB  
- 🔒 **Secure Authentication** — JWT & password encryption  

---

## 🧑‍🍳 Supported Workforce Roles

| Category | Roles |
|-----------|--------|
| 🍳 **Kitchen** | Chefs, Cooks, Assistants |
| 🍽️ **Service** | Waiters, Servers, Bartenders, Hosts |
| 🚚 **Logistics** | Drivers, Delivery Staff, Inventory Managers |
| 🧹 **Support** | Cleaners, Setup Crew, Decorators |
| 🎧 **Event Ops** | DJs, Technicians, AV Staff |
| 📸 **Media** | Photographers, Videographers |
| 🔒 **Management** | Supervisors, Security, Guest Relations |
| ☕ **Specialty** | Baristas, Beverage Staff |

---

## 🧠 Tech Stack

### ⚙️ Backend
- 🟢 **Node.js + Express.js** — RESTful API and middleware handling  
- 🍃 **MongoDB (Mongoose)** — scalable data layer  
- 🔌 **Socket.io** — real-time event & staff updates  
- 🔐 **JWT Authentication** — secure login system  
- 🧾 **Multer** — file uploads  
- 🧂 **bcrypt** — password hashing  
- 📱 **Twilio API (OTP)** — SMS-based verification  

### 💻 Frontend
- ⚛️ **React 19** — modern component-based frontend  
- 🧭 **React Router** — dynamic routing and navigation  
- 🎞️ **Framer Motion** — smooth UI animations  
- ⚡ **Socket.io Client** — real-time event updates  
- 🗺️ **Leaflet.js** — map integration for location tracking  
 - 🧩 **Componentized Dashboards** — shared UI (Sidebar, DashboardCards, NotificationsModal) and organiser-specific modules (StaffDirectory, StaffDetailModal, PaymentModal)

---

## ⚡ Quick Start

### 🧩 Prerequisites
Ensure the following are installed:
- Node.js (v16+)
- MongoDB (Local or Atlas)
- Git

---

### 🔧 Setup Instructions

```bash
# Clone the repository
git clone https://github.com/DrashtiMSheth/CaterSync
cd CaterSync

# Install backend dependencies
cd Backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Environment (Frontend)
cd ../frontend
echo REACT_APP_API_URL=http://localhost:5050/api > .env

# Run the backend
cd ../Backend
npm start

# Run the frontend
cd ../frontend
npm start

```

<<<<<<< HEAD
### 🔐 CORS & Auth
- Backend CORS allows `http://localhost:3000` and `x-auth-token` headers for dev.
- Frontend uses `REACT_APP_API_URL` as API base; falls back to `http://localhost:5050/api`.

### 🔔 Realtime Events
- Server emits Socket.io events:
  - `staffApplied` (to organiser room) when a staff applies
  - `staffCancelled` (to organiser room) when a staff cancels
  - `notification` generic messages; clients can subscribe
- Client joins personal room on login (`joinRoom` with `userId`)
- Organiser dashboard listens and updates notifications immediately

### 🗝️ Backend .env example
```
PORT=5050
MONGO_URI=mongodb://localhost:27017/catersync
JWT_SECRET=replace_with_strong_secret
FE_ORIGIN=http://localhost:3000
```

### ❓ Common Issues
- 401/403: ensure `x-auth-token` header is present for protected routes.
- CORS blocked: confirm `FE_ORIGIN` matches your frontend URL.
- WebSocket fails: verify backend port and that client `REACT_APP_API_URL` points to the same host (without `/api` for sockets).

### 🧱 Project Structure (excerpt)
```
frontend/src/
  components/
    common/
      DashboardCards.jsx
      NotificationsModal.jsx
      Sidebar.jsx
    organiser/
      PaymentModal.jsx
      StaffDetailModal.jsx
      StaffDirectory.jsx
  pages/
    OrganiserDashboard.jsx
    StaffDashboard.jsx
```

=======
>>>>>>> bee95f727280dcb892061afd4292bc3fb0da45ce
### 🔄 Routing
- `/` landing, `/organiser/login`, `/organiser/register`, `/organiser` (protected)
- `/staff/login`, `/staff/register`, `/staff` (protected)
