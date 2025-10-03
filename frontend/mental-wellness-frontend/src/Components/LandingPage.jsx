import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";

const LandingPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();

  const motivationalQuotes = [
    "Every step forward is a step toward a better you.",
    "Your mental health is a priority, not a luxury.",
    "Progress, not perfection, is the goal today.",
    "You have the strength to overcome anything.",
    "Take care of your mind, it's the only one you have.",
    "Small steps lead to big changes.",
    "Your wellness journey starts with a single decision.",
    "Believe in yourself and all that you are."
  ];

  // Simulate loading and rotate quotes every 3 seconds
  useEffect(() => {
    const loadingTimer = setTimeout(() => setIsLoading(false), 1000);
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % motivationalQuotes.length);
    }, 3000);
    return () => {
      clearTimeout(loadingTimer);
      clearInterval(interval);
    };
  }, [motivationalQuotes.length]);

  const handleStart = async () => {
    if (!name.trim() || !age.trim()) {
      alert("Please enter your name and age!");
      return;
    }
    if (parseInt(age) < 1 || parseInt(age) > 120) {
      alert("Please enter a valid age!");
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Get Clerk JWT token
      const token = await getToken();
      
      console.log("💾 Saving profile to MongoDB...");
      console.log("   Name:", name);
      console.log("   Age:", age);
      console.log("   Clerk User ID:", user?.id);
      
      // Save to MongoDB via backend API
      const response = await fetch("http://localhost:8000/api/users/save-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          age: parseInt(age)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save profile");
      }
      
      const data = await response.json();
      console.log("✅ Profile saved to MongoDB:", data);
      
      // Store user info in localStorage for quick access
      localStorage.setItem('userInfo', JSON.stringify({ 
        name: name.trim(), 
        age: parseInt(age),
        clerk_user_id: user?.id
      }));
      
      // Navigate to analysis page
      navigate('/analysis');
      
    } catch (error) {
      console.error("❌ Error saving profile:", error);
      alert(`Failed to save profile: ${error.message}\nPlease try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const quoteVariants = {
    enter: { opacity: 0, y: 20, scale: 0.95 },
    center: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 1.05 }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #90ee90 0%, #ffffff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #90ee90',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#666', fontSize: '18px' }}>Loading your wellness journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #90ee90 0%, #ffffff 100%)',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(144, 238, 144, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(144, 238, 144, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }}></div>
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '800px', width: '100%' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 'bold',
            color: '#2d3748',
            marginBottom: '2rem',
            lineHeight: '1.2',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            Welcome to Your
            <span style={{ 
              display: 'block', 
              color: '#90ee90',
              background: 'linear-gradient(45deg, #90ee90, #7dd87d)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Mental Wellness Journey
            </span>
          </h1>
          
          {/* Rotating Quotes */}
          <div style={{ 
            marginBottom: '3rem', 
            height: '120px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <AnimatePresence mode="wait">
              <motion.p
                key={currentQuoteIndex}
                variants={quoteVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.6 }}
                style={{
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
                  color: '#4a5568',
                  fontStyle: 'italic',
                  fontWeight: '500',
                  maxWidth: '600px',
                  lineHeight: '1.6',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                "{motivationalQuotes[currentQuoteIndex]}"
              </motion.p>
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(144, 238, 144, 0.3)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            style={{
              background: 'white',
              color: '#90ee90',
              fontWeight: 'bold',
              fontSize: '1.25rem',
              padding: '16px 48px',
              borderRadius: '50px',
              border: '2px solid #90ee90',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              textTransform: 'none',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#90ee90';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.color = '#90ee90';
            }}
          >
            Let's Start the Journey
          </motion.button>
        </motion.div>
      </div>

      {/* User Info Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              padding: '20px'
            }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '2rem',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: 'bold',
                color: '#2d3748',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                Tell us about yourself
              </h2>
              
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#4a5568',
                    marginBottom: '0.5rem'
                  }}>
                    Your Name
                  </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#90ee90';
                      e.target.style.boxShadow = '0 0 0 3px rgba(144, 238, 144, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#4a5568',
                    marginBottom: '0.5rem'
                  }}>
                    Your Age
                  </label>
              <input
                type="number"
                placeholder="Enter your age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                    min="1"
                    max="120"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#90ee90';
                      e.target.style.boxShadow = '0 0 0 3px rgba(144, 238, 144, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f7fafc',
                    color: '#4a5568',
                    fontWeight: '600',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#edf2f7';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#f7fafc';
                  }}
              >
                Cancel
              </button>
                <button
                  onClick={handleStart}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#90ee90',
                    color: 'white',
                    fontWeight: '600',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#7dd87d';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#90ee90';
                  }}
                >
                  Start Journey
                </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
