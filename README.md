# Nexus Live

A full-stack video conferencing web application that enables seamless real-time communication and collaboration. Connect with friends, family, and colleagues through high-quality video meetings with features like user authentication, meeting history, and guest access.

## Features

- **Real-time Video Conferencing**: High-quality video calls with real-time communication using Socket.io
- **User Authentication**: Secure registration and login system with JWT tokens
- **Meeting History**: Track and manage your past meetings
- **Guest Access**: Join meetings without registration
- **Responsive Design**: Modern UI built with React and Material-UI
- **Cross-platform**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- **React** - JavaScript library for building user interfaces
- **Material-UI** - React components implementing Google's Material Design
- **Tailwind CSS** - Utility-first CSS framework
- **DaisyUI** - Component library for Tailwind CSS
- **Framer Motion** - Animation library for React
- **React Router** - Declarative routing for React
- **Axios** - HTTP client for API requests
- **Socket.io-client** - Real-time bidirectional communication

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time bidirectional communication
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing

## Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local installation or cloud service like MongoDB Atlas)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd nexus-live
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   ```

## Environment Variables

Create `.env` files in both backend and frontend directories.

### Backend (.env)
```
NODE_ENV=development
PORT=8000
JWT_SECRET=your_jwt_secret_key_here
MONGODB_URI=mongodb://127.0.0.1:27017/nexus_live_dev
```

### Frontend (.env)
```
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

## Running the Application

1. **Start the Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   The backend server will start on http://localhost:8000

2. **Start the Frontend:**
   ```bash
   cd frontend
   npm start
   ```
   The frontend will be available at http://localhost:3000

3. **Access the Application:**
   - Open your browser and navigate to http://localhost:3000
   - Register a new account or login with existing credentials
   - Create or join video meetings

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/profile` - Get user profile (requires authentication)
- `POST /api/v1/auth/history` - Add meeting to history (requires authentication)
- `GET /api/v1/auth/history` - Get meeting history (requires authentication)

### Health Check
- `GET /api/health` - Application health status

## Usage

1. **Registration/Login:**
   - Visit the landing page
   - Click "Register" to create a new account or "Login" to sign in
   - Fill in the required details and submit

2. **Creating a Meeting:**
   - After logging in, navigate to the home page
   - Use the meeting creation interface to start a new video call

3. **Joining a Meeting:**
   - Use the meeting code provided by the host
   - Click "Join as Guest" on the landing page or enter the code in the app

4. **Viewing History:**
   - Access your meeting history from the history page
   - View past meetings with their codes and dates

## Project Structure

```
nexus-live/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── app.js
│   ├── package.json
│   └── example.env
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── example.env
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Acknowledgments

- Built with modern web technologies for optimal performance
- Real-time communication powered by Socket.io
- UI components from Material-UI and Tailwind CSS
