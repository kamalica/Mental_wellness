# Mental Wellness Detection App - Frontend Setup

## Overview
A comprehensive Mental Wellness Detection web application built with React, featuring advanced authentication with Clerk and multi-modal data capture for mental health screening.

## Features
- **Secure Authentication**: Clerk-based login/signup with clean, minimalist design
- **Introductory Page**: Rotating motivational quotes carousel with user info collection
- **Analysis Page**: Dual-mode data capture (video recording + text input)
- **Dashboard**: PDF report display with personalized insights and resources
- **Responsive Design**: Modern gradient-based design with green wellness theme
- **Smooth Animations**: Framer Motion for enhanced user experience

## Tech Stack
- React 19.1.1
- Framer Motion 12.23.22 for animations
- Clerk 5.48.1 for authentication
- React Router 7.9.2 for navigation
- Vite 6.3.6 for build tooling

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**: Package manager
- **Clerk Account**: For authentication (https://clerk.com)

## Setup Instructions

### 1. Install Dependencies
```bash
cd frontend_new/mental-wellness-frontend
npm install
```

If you encounter peer dependency conflicts:
```bash
npm install --legacy-peer-deps
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Backend API URL
VITE_API_URL=http://localhost:8000

# Development
VITE_ENV=development
```

### 3. Clerk Setup
1. Sign up for a Clerk account at https://clerk.com
2. Create a new application
3. Get your Publishable Key from the dashboard
4. Configure Sign-in/Sign-up methods:
   - Enable Email/Password
   - Enable Google OAuth (optional)
   - Enable other providers as needed

5. Add allowed redirect URLs in Clerk dashboard:
   ```
   http://localhost:5173
   http://localhost:5173/*
   ```

### 4. Backend Integration
The app expects a backend API running on `http://localhost:8000` with the following endpoints:

#### User Routes (`/api/users`)
- `POST /save-profile` - Save user profile (name, age)
- `POST /save-video-analysis` - Save video analysis results
- `POST /save-text-analysis` - Save text analysis results

#### Analysis Routes (`/api/analysis`)
- `POST /face_emotion` - Process face emotion from video frame
- `POST /text_analysis` - Analyze text sentiment

#### Report Routes (`/api/reports`)
- `POST /generate` - Generate AI wellness report
- `GET /download-pdf` - Download PDF report

### 5. Run the Application
```bash
npm run dev
```

The app will run on `http://localhost:5173`

## Component Structure

### Authentication Pages
- **SignIn.jsx**: Clean, minimalist sign-in page with Clerk integration
- **SignUp.jsx**: User registration with consistent styling

### Main Application Pages
- **LandingPage.jsx**: Welcome page with rotating quotes and user info modal
- **AnalysisPage.jsx**: Dual-mode data capture (video + text) with real-time feedback
- **DashboardPage.jsx**: Results display with PDF viewer and resource links

### Utility Components
- **ProtectedRoute.jsx**: Route protection and redirection logic

## Key Features Implementation

### Video Recording
- Browser camera access with permission handling
- 1-minute countdown timer with visual indicators
- Real-time recording status display
- Automatic cleanup on component unmount

### Text Analysis
- 1000-character limit with live counter
- Focused input area with visual feedback
- Sentiment analysis integration ready

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Breakpoint-specific layouts (sm, md, lg, xl)
- Touch-friendly interface elements

### Error Handling
- Camera permission denial handling
- Network error management
- User-friendly error messages
- Graceful fallbacks

## Color Scheme
- Primary: Light Green (#90ee90)
- Secondary: White (#ffffff)
- Accent: Various shades of green
- Text: Gray scale for readability

## Browser Compatibility
- Modern browsers with WebRTC support
- Mobile browsers (iOS Safari, Chrome Mobile)
- Camera and microphone access required for video analysis

## Development Notes
- All components use functional components with hooks
- State management with React useState and useEffect
- Local storage for user data persistence
- Form validation and user feedback
- Accessibility considerations included

## Next Steps
1. Set up your Clerk account and configure authentication
2. Implement backend API for data processing
3. Add PDF generation and display functionality
4. Integrate with mental health analysis services
5. Deploy to production environment

