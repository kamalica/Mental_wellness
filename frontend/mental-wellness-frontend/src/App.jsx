import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import ProtectedPage from "./Components/ProtectedRoute";
import SignInPage from "./Components/SignIn";
import SignUpPage from "./Components/SignUp";
import LandingPage from "./Components/LandingPage";
import AnalysisPage from "./Components/AnalysisPage";
import DashboardPage from "./Components/DashboardPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />

        {/* Landing page after sign-in */}
        <Route
          path="/landing"
          element={
            <SignedIn>
              <LandingPage />
            </SignedIn>
          }
        />

        {/* Analysis page */}
        <Route
          path="/analysis"
          element={
            <SignedIn>
              <AnalysisPage />
            </SignedIn>
          }
        />

        {/* Dashboard page */}
        <Route
          path="/dashboard"
          element={
            <SignedIn>
              <DashboardPage />
            </SignedIn>
          }
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <>
              <SignedIn>
                <ProtectedPage />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
