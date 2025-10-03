import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function ProtectedPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to landing page when user is authenticated
    navigate('/landing');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-green/10 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}

export default ProtectedPage;
