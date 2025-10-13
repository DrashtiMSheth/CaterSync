# Event Management System

A comprehensive event management platform that connects event organizers with staff members for efficient event planning and execution. The system features real-time communication, location-based staff allocation, and a modern web interface.

## 🚀 Features

### For Event Organizers
- **Registration & Authentication**: Secure registration with OTP verification
- **Event Management**: Create, update, and manage events
- **Staff Application Handling**: Review and approve/reject staff applications
- **Real-time Notifications**: WebSocket-based notifications for instant updates
- **Dashboard**: Comprehensive dashboard with event analytics

### For Staff Members
- **Profile Management**: Complete profile setup with skills and availability
- **Event Discovery**: Browse and apply for available events
- **Application Tracking**: Monitor application status in real-time
- **Location-based Matching**: Find events based on location preferences

### System Features
- **Real-time Communication**: WebSocket integration for instant updates
- **File Upload**: Support for profile pictures and event attachments
- **Responsive Design**: Modern, mobile-friendly interface
- **Security**: JWT-based authentication and role-based access control

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time communication
- **JWT** for authentication
- **Multer** for file uploads
- **Twilio** for OTP services
- **bcrypt** for password hashing

### Frontend
- **React 19** with modern hooks
- **React Router** for navigation
- **Socket.io Client** for real-time features
- **Framer Motion** for animations
- **Material-UI** components
- **Leaflet** for maps integration

## 📁 Project Structure

```
project123/
├── Backend/
│   ├── config/
│   │   └── db.js                 # Database configuration
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── eventController.js    # Event management
│   │   ├── organiserController.js # Organizer operations
│   │   └── staffController.js    # Staff operations
│   ├── middlewares/
│   │   ├── auth.js               # JWT authentication
│   │   ├── errorHandler.js     # Error handling
│   │   ├── roles.js              # Role-based access
│   │   ├── upload.js             # File upload handling
│   │   └── validationMiddleware.js # Input validation
│   ├── models/
│   │   ├── Event.js              # Event data model
│   │   ├── Organiser.js          # Organizer model
│   │   ├── Staff.js              # Staff model
│   │   └── User.js               # Base user model
│   ├── routes/
│   │   ├── authRoutes.js         # Authentication routes
│   │   ├── eventRoutes.js        # Event routes
│   │   ├── organiserRoutes.js    # Organizer routes
│   │   ├── otpRoutes.js          # OTP routes
│   │   └── staffRoutes.js        # Staff routes
│   ├── uploads/                   # File storage
│   ├── server.js                 # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js            # API client
│   │   ├── context/
│   │   │   └── AuthContext.js    # Authentication context
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx   # Home page
│   │   │   ├── OrganiserLogin.jsx # Organizer login
│   │   │   ├── StaffLogin.jsx    # Staff login
│   │   │   ├── OrganiserRegistration.jsx # Organizer signup
│   │   │   ├── StaffRegistration.jsx # Staff signup
│   │   │   ├── OrganiserDashboard.jsx # Organizer dashboard
│   │   │   └── StaffDashboard.jsx # Staff dashboard
│   │   ├── utils/
│   │   │   ├── constants.js       # App constants
│   │   │   └── socket.js         # Socket.io client
│   │   ├── App.js                # Main app component
│   │   └── index.js              # App entry point
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project123
   ```

2. **Install Backend Dependencies**
   ```bash
   cd Backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Setup**
   
   Create a `.env` file in the `Backend` directory:
   ```env
   # Database Configuration
   MONGO_URI=mongodb://localhost:27017/eventmanagement
   
   # JWT Secret Key (change this in production)
   JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
   
   # Server Configuration
   PORT=5050
   
   # Twilio Configuration (for OTP)
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   ```

5. **Start MongoDB**
   - **Local MongoDB**: Ensure MongoDB service is running
   - **MongoDB Atlas**: Update the `MONGO_URI` in `.env` file

6. **Start the Backend Server**
   ```bash
   cd Backend
   npm start
   # or for development
   npm run dev
   ```

7. **Start the Frontend**
   ```bash
   cd frontend
   npm start
   ```

8. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5050/api

## 🔧 Configuration

### Database Setup
1. **Local MongoDB**:
   ```bash
   # Install MongoDB locally
   # Start MongoDB service
   mongod
   ```

2. **MongoDB Atlas** (Recommended for production):
   - Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster
   - Get your connection string and update `MONGO_URI` in `.env`

### Twilio Setup (for OTP)
1. Create a [Twilio account](https://www.twilio.com/)
2. Get your Account SID and Auth Token
3. Purchase a phone number
4. Update the Twilio credentials in `.env`

## 📱 Usage

### For Event Organizers
1. **Register**: Create an account with organization details
2. **Verify**: Complete OTP verification
3. **Create Events**: Add event details, location, and requirements
4. **Manage Applications**: Review and approve staff applications
5. **Monitor**: Track event progress and staff assignments

### For Staff Members
1. **Register**: Create a profile with skills and availability
2. **Browse Events**: View available events in your area
3. **Apply**: Submit applications for interesting events
4. **Track Status**: Monitor application status and updates
5. **Participate**: Join approved events and provide feedback

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Comprehensive validation middleware
- **CORS Protection**: Configured CORS for secure cross-origin requests
- **File Upload Security**: Validated file types and sizes
- **Role-based Access**: Different access levels for organizers and staff

## 🐛 Troubleshooting

### Common Issues

#### 1. "Failed to fetch" Error
**Problem**: Registration fails with "Failed to fetch" error
**Solutions**:
- Ensure backend server is running on port 5050
- Check MongoDB connection
- Verify `.env` file exists with correct configuration
- Check CORS settings in `server.js`

#### 2. Database Connection Issues
**Problem**: MongoDB connection failed
**Solutions**:
- Verify MongoDB is running: `mongod`
- Check `MONGO_URI` in `.env` file
- Ensure MongoDB service is accessible

#### 3. OTP Not Sending
**Problem**: OTP verification fails
**Solutions**:
- Verify Twilio credentials in `.env`
- Check Twilio account balance
- Ensure phone number format is correct

#### 4. File Upload Issues
**Problem**: Profile pictures or documents not uploading
**Solutions**:
- Check file size limits (max 200MB)
- Verify file types are supported
- Ensure `uploads` directory exists and is writable

### Development Tips

1. **Enable Debug Mode**:
   ```bash
   # Backend
   DEBUG=* npm run dev
   
   # Frontend
   REACT_APP_DEBUG=true npm start
   ```

2. **Check Logs**:
   - Backend logs in terminal
   - Browser console for frontend errors
   - Network tab for API requests

3. **Database Debugging**:
   ```bash
   # Connect to MongoDB
   mongo
   use eventmanagement
   show collections
   ```

## 🚀 Deployment

### Backend Deployment (Vercel)
1. Install Vercel CLI: `npm i -g vercel`
2. Configure `vercel.json` (already included)
3. Deploy: `vercel --prod`

### Frontend Deployment (Netlify/Vercel)
1. Build the project: `npm run build`
2. Deploy the `build` folder
3. Configure environment variables

### Environment Variables for Production
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/eventmanagement
JWT_SECRET=your_production_secret_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section above
- Review the code comments for implementation details

## 🔄 Updates

### Recent Updates
- Real-time WebSocket integration
- Enhanced file upload system
- Improved error handling
- Mobile-responsive design
- Security enhancements

### Planned Features
- Email notifications
- Advanced search filters
- Analytics dashboard
- Mobile app development
- Payment integration

---

**Happy Event Managing! 🎉**