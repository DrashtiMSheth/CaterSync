🎯 SmartServe — Where Organisers & Staff Work in Perfect Sync

A real-time, location-based event management platform that connects event organisers with catering and event staff for seamless event execution.
SmartServe brings together chefs, servers, drivers, DJs, cleaners, and more under one unified system for efficient workforce coordination.

🚀 Overview

Managing staff during large events can be chaotic — from chefs and waiters to drivers and decorators, every role matters.
SmartServe solves this by offering a modern, intelligent workforce management solution that ensures the right people are at the right place at the right time.

🌟 Key Features

👨‍💼 For Event Organisers
Secure Registration & OTP Authentication
Event Creation & Management — create, edit, and monitor events
Staff Application Handling — approve, reject, or review applicants
Real-time Notifications (via WebSockets)
Dashboard Analytics for better decision-making
Live Location Tracking of assigned staff

👩‍🍳 For Staff Members
Profile Management with skill & availability setup
Event Discovery based on location and skillset
Live Application Tracking and instant updates
OTP-based Authentication for security
Easy Communication with organisers via real-time updates

⚙️ System Features
Real-time Communication — powered by Socket.io
Modern, Responsive Frontend — React + Tailwind + MUI
Role-based Access Control — organiser vs. staff permissions
File Uploads — profile images & event documents
Scalable Backend Architecture with Express.js & MongoDB
Secure Authentication using JWT

🧑‍🍳 Supported Workforce Roles
SmartServe is designed for every professional role involved in event operations:

Category	Roles
🍳 Kitchen	Chefs, Cooks, Assistants
🍽️ Service	Waiters, Servers, Bartenders, Hosts
🚚 Logistics	Drivers, Delivery Staff, Inventory Managers
🧹 Support	Cleaners, Setup Crew, Decorators
🎧 Event Ops	DJs, Technicians, AV Staff
📸 Media	Photographers, Videographers
🔒 Management	Supervisors, Security, Guest Relations
☕ Specialty	Baristas, Beverage Staff
🧠 Tech Stack


⚙️ Backend
Node.js + Express.js — RESTful API and middleware handling
MongoDB (Mongoose) — scalable data layer
Socket.io — real-time event & staff updates
JWT Authentication — secure login system
Multer — file uploads
bcrypt — password hashing
Twilio API (OTP) — SMS verification


💻 Frontend
React 19 — modern frontend architecture with hooks
React Router — routing and navigation
Framer Motion — smooth animations
Socket.io Client — real-time event updates
Leaflet.js — map integration for location tracking

⚡ Quick Start
🧩 Prerequisites
Node.js (v16 or higher)
MongoDB (Local or Atlas)
Git

🔧 Setup

Clone the repository
git clone https://github.com/DrashtiMSheth/ServeSync
cd SmartServe

Install backend dependencies
cd Backend
npm install

Install frontend dependencies
cd ../frontend
npm install

Run the backend
cd ../Backend
npm start

Run the frontend
cd ../frontend
npm start


🛡️ Security Highlights
JWT-based Authentication
Encrypted Passwords using bcrypt
Role-based Access (Organiser / Staff)
Input Validation Middleware
Safe File Uploads (Multer)
CORS Configuration for Secure API Calls

📱 Core Workflows

👨‍💼 For Organisers
Register & verify account via OTP
Create & publish events
Review staff applications
Approve / Reject applicants
Monitor staff & event progress in real-time

👩‍🍳 For Staff
Register & verify via OTP
Complete skill-based profile
Browse and apply for events
Track application status live
Receive event updates instantly

🧩 Future Enhancements
✅ In-App Chat for Real-Time Coordination
✅ Advanced Analytics Dashboard
✅ Event Budgeting & Cost Tracking
✅ Mobile App (React Native)
✅ Payment Gateway Integration
✅ Multi-language Support


📜 License
This project is licensed under the MIT License — see the LICENSE file for details.

💬 Feedback & Collaboration
Got ideas to make SmartServe better?
💡 Open an issue, fork the repo, or DM me — I’d love to collaborate and hear your feedback!
👉 GitHub Repo: SmartServe — Location-Based Catering Management System

🎉 Let’s make event management smarter, faster, and more connected.
SmartServe — Bringing Order to Every Event, One Staff at a Time.