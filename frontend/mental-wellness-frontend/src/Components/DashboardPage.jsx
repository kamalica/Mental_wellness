import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth, UserButton, SignOutButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({});
  const { isLoaded, userId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Get user info and analysis result from localStorage
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const storedResult = JSON.parse(localStorage.getItem('analysisResult') || 'null');
    
    setUserInfo(storedUserInfo);
    setAnalysisResult(storedResult);
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    // Clear stored data
    localStorage.removeItem('userInfo');
    localStorage.removeItem('analysisResult');
    navigate('/');
  };

  const handleNewAnalysis = () => {
    navigate('/analysis');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-green/10 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #90ee90 0%, #ffffff 100%)',
      position: 'relative'
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

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(144, 238, 144, 0.15), rgba(255, 255, 255, 0.95))',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderBottom: '2px solid rgba(144, 238, 144, 0.3)',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
                fontWeight: 'bold',
                color: '#2d3748',
                marginBottom: '8px',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                Welcome back, {userInfo.name || 'User'}! 👋
              </h1>
              <p style={{ 
                color: '#4a5568', 
                fontSize: '1.1rem',
                fontWeight: '500'
              }}>
                Your Mental Wellness Dashboard
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </motion.div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 10 }}>
        {/* Analysis Results Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{ marginBottom: '40px' }}
        >
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '40px',
            border: '1px solid rgba(144, 238, 144, 0.2)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</div>
              <h2 style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
                fontWeight: 'bold',
                color: '#2d3748',
                marginBottom: '12px',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                Your Analysis Results
              </h2>
              <p style={{
                color: '#6b7280',
                fontSize: '1.1rem',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                Comprehensive insights from your mental wellness analysis
              </p>
            </div>
            
            {analysisResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* PDF Report Section */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  style={{
                    border: '2px dashed #90ee90',
                    borderRadius: '16px',
                    padding: '32px',
                    background: 'rgba(144, 238, 144, 0.05)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-50%',
                    width: '200px',
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(144, 238, 144, 0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none'
                  }}></div>
                  
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#2d3748',
                      marginBottom: '20px',
                      textAlign: 'center'
                    }}>
                      📊 Detailed Report
                    </h3>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '12px',
                      padding: '24px',
                      marginBottom: '24px',
                      backdropFilter: 'blur(5px)'
                    }}>
                      <p style={{ 
                        color: '#4a5568', 
                        marginBottom: '12px',
                        fontSize: '1.1rem',
                        lineHeight: '1.6'
                      }}>
                        Your personalized mental wellness report has been generated based on your analysis.
                      </p>
                      <p style={{ 
                        fontSize: '0.95rem', 
                        color: '#6b7280',
                        lineHeight: '1.5'
                      }}>
                        This report includes insights from both your video and text analysis, 
                        providing comprehensive recommendations for your mental wellness journey.
                      </p>
                    </div>
                    
                    {/* Enhanced PDF viewer placeholder */}
                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
                      borderRadius: '16px',
                      padding: '40px',
                      textAlign: 'center',
                      border: '1px solid rgba(144, 238, 144, 0.2)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        right: '20px',
                        bottom: '20px',
                        border: '2px dashed rgba(144, 238, 144, 0.3)',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{ fontSize: '5rem', marginBottom: '20px' }}>📄</div>
                        <p style={{ 
                          color: '#4a5568', 
                          marginBottom: '16px', 
                          fontSize: '1.25rem',
                          fontWeight: '600'
                        }}>
                          PDF Report Viewer
                        </p>
                        <p style={{ 
                          fontSize: '0.95rem', 
                          color: '#6b7280', 
                          marginBottom: '24px',
                          maxWidth: '400px',
                          lineHeight: '1.5'
                        }}>
                          In a real implementation, this would display the generated PDF report with detailed analysis
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          style={{
                            background: 'linear-gradient(135deg, #90ee90, #7dd87d)',
                            color: 'white',
                            padding: '12px 32px',
                            borderRadius: '25px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            fontWeight: '600',
                            fontSize: '1rem',
                            boxShadow: '0 8px 25px rgba(144, 238, 144, 0.3)'
                          }}
                        >
                          Download Report
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Summary Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '24px'
                  }}
                >
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(144, 238, 144, 0.1), rgba(144, 238, 144, 0.05))',
                    borderRadius: '16px',
                    padding: '28px',
                    border: '1px solid rgba(144, 238, 144, 0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-20px',
                      right: '-20px',
                      width: '80px',
                      height: '80px',
                      background: 'radial-gradient(circle, rgba(144, 238, 144, 0.2) 0%, transparent 70%)',
                      borderRadius: '50%'
                    }}></div>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <h4 style={{
                        fontWeight: 'bold',
                        color: '#2d3748',
                        marginBottom: '16px',
                        fontSize: '1.25rem'
                      }}>🔍 Key Insights</h4>
                      <ul style={{ 
                        color: '#4a5568', 
                        lineHeight: '1.8',
                        fontSize: '1rem',
                        listStyle: 'none',
                        padding: 0
                      }}>
                        <li style={{ marginBottom: '8px' }}>✓ Emotional state analysis completed</li>
                        <li style={{ marginBottom: '8px' }}>✓ Stress level assessment provided</li>
                        <li style={{ marginBottom: '8px' }}>✓ Personalized recommendations generated</li>
                        <li style={{ marginBottom: '8px' }}>✓ Wellness goals identified</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
                    borderRadius: '16px',
                    padding: '28px',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-20px',
                      right: '-20px',
                      width: '80px',
                      height: '80px',
                      background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
                      borderRadius: '50%'
                    }}></div>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <h4 style={{
                        fontWeight: 'bold',
                        color: '#2d3748',
                        marginBottom: '16px',
                        fontSize: '1.25rem'
                      }}>🚀 Next Steps</h4>
                      <ul style={{ 
                        color: '#4a5568', 
                        lineHeight: '1.8',
                        fontSize: '1rem',
                        listStyle: 'none',
                        padding: 0
                      }}>
                        <li style={{ marginBottom: '8px' }}>✓ Review your personalized recommendations</li>
                        <li style={{ marginBottom: '8px' }}>✓ Set up a wellness routine</li>
                        <li style={{ marginBottom: '8px' }}>✓ Schedule follow-up analysis</li>
                        <li style={{ marginBottom: '8px' }}>✓ Connect with wellness resources</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔍</div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#2d3748',
                  marginBottom: '16px'
                }}>
                  No Analysis Results Found
                </h3>
                <p style={{ color: '#4a5568', marginBottom: '24px' }}>
                  Complete your mental wellness analysis to see your personalized report.
                </p>
                <button
                  onClick={handleNewAnalysis}
                  style={{
                    background: '#90ee90',
                    color: 'white',
                    padding: '12px 32px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#7dd87d';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#90ee90';
                  }}
                >
                  Start Analysis
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '40px'
          }}
        >
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(144, 238, 144, 0.3)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNewAnalysis}
              style={{
                background: 'linear-gradient(135deg, #90ee90, #7dd87d)',
                color: 'white',
                padding: '16px 40px',
                borderRadius: '50px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 30px rgba(144, 238, 144, 0.3)',
                textTransform: 'none',
                letterSpacing: '0.5px'
              }}
            >
              🔄 New Analysis
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/landing')}
              style={{
                background: 'linear-gradient(135deg, #e2e8f0, #cbd5e0)',
                color: '#4a5568',
                padding: '16px 40px',
                borderRadius: '50px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
              }}
            >
              🏠 Back to Home
            </motion.button>
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '40px',
            border: '1px solid rgba(144, 238, 144, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '-100px',
            left: '-100px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(144, 238, 144, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }}></div>
          
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🤝</div>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: 'bold',
                color: '#2d3748',
                marginBottom: '12px',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                Need Help or Support?
              </h2>
              <p style={{
                color: '#6b7280',
                fontSize: '1.1rem',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                We're here to support you on your mental wellness journey
              </p>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px'
            }}>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                style={{
                  textAlign: 'center',
                  padding: '24px',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '16px',
                  border: '1px solid rgba(144, 238, 144, 0.2)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📞</div>
                <h3 style={{
                  fontWeight: 'bold',
                  color: '#2d3748',
                  marginBottom: '12px',
                  fontSize: '1.25rem'
                }}>Crisis Support</h3>
                <p style={{
                  fontSize: '1rem',
                  color: '#4a5568',
                  marginBottom: '16px',
                  lineHeight: '1.5'
                }}>
                  24/7 mental health crisis support
                </p>
                <a 
                  href="tel:988" 
                  style={{
                    color: '#90ee90',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    fontSize: '1.1rem',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    background: 'rgba(144, 238, 144, 0.1)',
                    transition: 'all 0.3s ease',
                    display: 'inline-block'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(144, 238, 144, 0.2)';
                    e.target.style.color = '#7dd87d';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(144, 238, 144, 0.1)';
                    e.target.style.color = '#90ee90';
                  }}
                >
                  Call 988
                </a>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                style={{
                  textAlign: 'center',
                  padding: '24px',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '16px',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</div>
                <h3 style={{
                  fontWeight: 'bold',
                  color: '#2d3748',
                  marginBottom: '12px',
                  fontSize: '1.25rem'
                }}>Chat Support</h3>
                <p style={{
                  fontSize: '1rem',
                  color: '#4a5568',
                  marginBottom: '16px',
                  lineHeight: '1.5'
                }}>
                  Online mental health chat support
                </p>
                <a 
                  href="https://suicidepreventionlifeline.org/chat" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    color: '#3b82f6',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    fontSize: '1.1rem',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    transition: 'all 0.3s ease',
                    display: 'inline-block'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(59, 130, 246, 0.2)';
                    e.target.style.color = '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                    e.target.style.color = '#3b82f6';
                  }}
                >
                  Start Chat
                </a>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                style={{
                  textAlign: 'center',
                  padding: '24px',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '16px',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏥</div>
                <h3 style={{
                  fontWeight: 'bold',
                  color: '#2d3748',
                  marginBottom: '12px',
                  fontSize: '1.25rem'
                }}>Find Help</h3>
                <p style={{
                  fontSize: '1rem',
                  color: '#4a5568',
                  marginBottom: '16px',
                  lineHeight: '1.5'
                }}>
                  Locate mental health resources
                </p>
                <a 
                  href="https://findtreatment.samhsa.gov/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    color: '#22c55e',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    fontSize: '1.1rem',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    transition: 'all 0.3s ease',
                    display: 'inline-block'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(34, 197, 94, 0.2)';
                    e.target.style.color = '#16a34a';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(34, 197, 94, 0.1)';
                    e.target.style.color = '#22c55e';
                  }}
                >
                  Find Resources
                </a>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
