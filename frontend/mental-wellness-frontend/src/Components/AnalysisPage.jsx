import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { UserButton, useAuth } from "@clerk/clerk-react";

const AnalysisPage = () => {
  const [videoRecording, setVideoRecording] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [videoBlob, setVideoBlob] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [videoAnalysisResult, setVideoAnalysisResult] = useState(null);
  const [wellnessReport, setWellnessReport] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);  
  const streamRef = useRef(null);
  const countdownRef = useRef(null);
  const frameIntervalRef = useRef(null); // For live frame streaming
  const recordingTimeoutRef = useRef(null); // Ensures hard stop at 60s
  const isStartingRef = useRef(false); // Prevent double-start
  const [typingStartTime, setTypingStartTime] = useState(null);


  const navigate = useNavigate();
  const { getToken } = useAuth(); // Get Clerk token for authenticated requests

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  useEffect(() => {
    // Only run once on mount
    const storedResult = JSON.parse(localStorage.getItem('analysisResult') || 'null');
    if (storedResult) setAnalysisResult(storedResult);
    
    const loadingTimer = setTimeout(() => setIsLoading(false), 1000);
    return () => {
      clearTimeout(loadingTimer);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    };
  }, []); // Empty dependency array - only run once on mount

  // ===================== DATABASE SAVE FUNCTIONS =====================
  
  /**
   * Save user profile (name, age) to database
   */
  const saveUserProfile = async (name, age) => {
    try {
      const token = await getToken();
      const response = await fetch("http://localhost:8000/api/users/save-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name, age })
      });
      
      if (!response.ok) throw new Error("Failed to save profile");
      const data = await response.json();
      console.log("✅ Profile saved:", data);
      return data;
    } catch (error) {
      console.error("❌ Error saving profile:", error);
      return null;
    }
  };

  /**
   * Save text analysis result to database
   */
  const saveTextAnalysisToDb = async (analysisData) => {
    try {
      const token = await getToken();
      const response = await fetch("http://localhost:8000/api/users/save-text-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ text_analysis: analysisData })
      });
      
      if (!response.ok) throw new Error("Failed to save text analysis");
      const data = await response.json();
      console.log("✅ Text analysis saved to database:", data);
      return data;
    } catch (error) {
      console.error("❌ Error saving text analysis:", error);
      return null;
    }
  };

  /**
   * Save video analysis result to database
   */
  const saveVideoAnalysisToDb = async (analysisData) => {
    try {
      const token = await getToken();
      const response = await fetch("http://localhost:8000/api/users/save-video-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ video_analysis: analysisData })
      });
      
      if (!response.ok) throw new Error("Failed to save video analysis");
      const data = await response.json();
      console.log("✅ Video analysis saved to database:", data);
      return data;
    } catch (error) {
      console.error("❌ Error saving video analysis:", error);
      return null;
    }
  };

  /**
   * Get the final emotion report from backend
   */
  const fetchEmotionReport = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/analysis/emotion_report");
      if (!response.ok) throw new Error("Failed to fetch emotion report");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Error fetching emotion report:", error);
      return null;
    }
  };

  /**
   * Generate AI-powered wellness report using Groq API
   */
  const generateWellnessReport = async () => {
    try {
      setGeneratingReport(true);
      console.log("🤖 Generating wellness report with Groq AI...");

      const token = await getToken();
      const response = await fetch("http://localhost:8000/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate wellness report");
      }

      const data = await response.json();
      
      if (data.success && data.report) {
        console.log("✅ Wellness report generated successfully!");
        setWellnessReport(data.report);
        return data.report;
      } else {
        throw new Error("Invalid report data received");
      }
    } catch (error) {
      console.error("❌ Error generating wellness report:", error);
      setError(`Failed to generate wellness report: ${error.message}`);
      return null;
    } finally {
      setGeneratingReport(false);
    }
  };

  /**
   * Download the wellness report
   */
  const downloadWellnessReport = async () => {
    try {
      console.log("📥 Downloading wellness report PDF...");

      // Get authentication token
      const token = await getToken();

      // Fetch PDF from backend
      const response = await fetch("http://localhost:8000/api/reports/download-pdf", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("No wellness report PDF found. Please generate one first.");
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Get filename from Content-Disposition header or create default
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = `Mental_Wellness_Report_${Date.now()}.pdf`;
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1];
        }
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("✅ PDF report downloaded successfully!");

    } catch (error) {
      console.error("❌ Error downloading PDF report:", error);
      setError(`Failed to download PDF report: ${error.message}`);
    }
  };

  // ==================================================================

  // --------------------- Live Frame Streaming ---------------------
  const captureAndSendFrame = async () => {
    if (!videoRef.current) return;
    const el = videoRef.current;
    // Only capture when we have current data and valid dimensions
    if (el.readyState < 2 || !el.videoWidth || !el.videoHeight) return;
    const canvas = document.createElement("canvas");
    canvas.width = el.videoWidth || 640;
    canvas.height = el.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
    const base64Frame = canvas.toDataURL("image/jpeg");

    try {
      await fetch("http://localhost:8000/api/analysis/face_emotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frame: base64Frame, user_id: userInfo.id || "anonymous" }),
      });
    } catch (err) {
      console.error("Error sending frame:", err);
    }
  };


  const startFrameStreaming = () => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    frameIntervalRef.current = setInterval(captureAndSendFrame, 1000);
  };

  const stopFrameStreaming = () => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    frameIntervalRef.current = null;
  };
  // ----------------------------------------------------------------

  const startVideoRecording = async () => {
    try {
      console.log("🎥 Starting video recording...");
      
      // Prevent duplicate starts
      if (videoRecording || isStartingRef.current) {
        console.log("⚠️ Already recording or starting");
        return;
      }
      isStartingRef.current = true;
      
      setError("");
      setVideoBlob(null);
      
      // Check API availability
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API not available in this browser");
      }
      console.log("✅ Camera API available");

      // Simple video-only constraints
      let stream;
      try {
        console.log("📷 Requesting camera access...");
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: false 
        });
        console.log("✅ Camera stream obtained:", stream);
        console.log("   Video tracks:", stream.getVideoTracks().length);
        stream.getVideoTracks().forEach(track => {
          console.log("   Track:", track.label, "Enabled:", track.enabled, "Ready:", track.readyState);
        });
      } catch (e) {
        console.error("❌ Camera access failed:", e);
        const reason = e?.name || e?.message || "Unknown error";
        throw new Error(`Unable to access camera: ${reason}`);
      }

      // Stop any existing stream first
      if (streamRef.current) {
        console.log("🛑 Stopping existing stream");
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      streamRef.current = stream;

      // Attach to video element
      const videoEl = videoRef.current;
      if (!videoEl) throw new Error("Video element not available");
      
      console.log("📺 Attaching stream to video element");
      videoEl.srcObject = stream;
      videoEl.muted = true;
      videoEl.playsInline = true;
      
      // Wait for metadata
      console.log("⏳ Waiting for metadata...");
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Timeout waiting for metadata"));
        }, 5000);
        
        if (videoEl.readyState >= 2) {
          clearTimeout(timeout);
          return resolve();
        }
        videoEl.addEventListener("loadedmetadata", () => {
          clearTimeout(timeout);
          console.log("✅ Metadata loaded. Video dimensions:", videoEl.videoWidth, "x", videoEl.videoHeight);
          resolve();
        }, { once: true });
      });
      
      // Start playback
      console.log("▶️ Starting video playback...");
      await videoEl.play();
      console.log("✅ Video playing. Paused:", videoEl.paused, "ReadyState:", videoEl.readyState);
      
      // Wait a bit for the stream to actually render frames
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log("📹 After delay - Video dimensions:", videoEl.videoWidth, "x", videoEl.videoHeight);
      
      // Verify we have valid dimensions
      if (videoEl.videoWidth < 100 || videoEl.videoHeight < 100) {
        console.warn("⚠️ Video dimensions too small, waiting longer...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("📹 After extended delay - Video dimensions:", videoEl.videoWidth, "x", videoEl.videoHeight);
      }

      // Track event handlers
      stream.getTracks().forEach((track) => {
        track.onended = () => {
          console.warn("❌ MediaTrack ended:", track.kind);
          setError("Camera feed ended unexpectedly");
        };
      });

      // Start UI and timers
      setVideoRecording(true);
      setCountdown(60);
      
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            stopVideoRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = setTimeout(() => {
        stopVideoRecording();
      }, 60000);

      // Start frame streaming
      console.log("🎬 Starting frame streaming");
      startFrameStreaming();
      console.log("✅ Recording started successfully!");
      
    } catch (err) {
      console.error("❌ FATAL ERROR:", err);
      setError(`Camera error: ${err?.message || "Unable to access device"}`);
      console.error("Error accessing camera:", err);
      
      // Cleanup on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
    } finally {
      isStartingRef.current = false;
    }
  };

  const stopVideoRecording = async () => {
    console.log("🛑 STOP called. Current state - videoRecording:", videoRecording);
    
    // Only stop if actually recording
    if (!videoRecording && !streamRef.current) {
      console.log("⚠️ Not recording, ignoring stop call");
      return;
    }
    
    console.trace("Stack trace:");
    
    // Clear timers
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    if (recordingTimeoutRef.current) { clearTimeout(recordingTimeoutRef.current); recordingTimeoutRef.current = null; }
    // Stop frame streaming
    stopFrameStreaming();
    // Stop camera tracks
    if (streamRef.current) {
      console.log("🛑 Stopping camera tracks");
      try { streamRef.current.getTracks().forEach((t) => t.stop()); } catch {}
      streamRef.current = null;
    }
    // Cleanup video element
    if (videoRef.current) {
      try { const v = videoRef.current; v.pause(); v.srcObject = null; } catch {}
    }
    setVideoRecording(false);
    console.log("✅ Recording stopped");
    
    // Fetch and save the final emotion report
    console.log("📊 Fetching final emotion report...");
    const emotionReport = await fetchEmotionReport();
    if (emotionReport && emotionReport.success && emotionReport.report) {
      console.log("✅ Emotion report received:", emotionReport.report);
      setVideoAnalysisResult(emotionReport.report);
      
      // Save to database
      await saveVideoAnalysisToDb(emotionReport.report);
    }
    
    // Mark success so UI shows completion and main submit unlocks if needed
    try {
      const marker = { completed: true, ts: Date.now() };
      setVideoBlob(new Blob([JSON.stringify(marker)], { type: "application/json" }));
    } catch {
      setVideoBlob(new Blob(["ok"], { type: "text/plain" }));
    }
  };

  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

  const handleSubmit = async () => {
  if (!videoBlob && !textInput.trim()) {
    setError("Please complete at least one analysis method (video or text).");
    return;
  }

  setIsSubmitting(true);
  setError("");

  try {
    const duration = typingStartTime ? (Date.now() - typingStartTime) / 1000 : 60; // in seconds

    const payload = {
      text: textInput,
      duration: duration,
      user_id: userInfo.id || "anonymous"
    };

    console.log("📤 Sending text analysis...");
    const response = await fetch("http://localhost:8000/api/analysis/text_analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Failed to submit text analysis");

    const result = await response.json();
    console.log("✅ Text analysis result:", result);
    
    localStorage.setItem("analysisResult", JSON.stringify(result));
    setAnalysisResult(result);

    // Save text analysis to database
    if (result.success && result.analysis) {
      console.log("💾 Saving text analysis to database...");
      await saveTextAnalysisToDb(result.analysis);
    }

    // 🤖 AUTOMATICALLY GENERATE WELLNESS REPORT after analysis is saved
    console.log("🤖 Auto-generating wellness report...");
    const report = await generateWellnessReport();
    
    if (report) {
      console.log("✅ Wellness report ready for download!");
      setShowReport(true);
    } else {
      console.warn("⚠️ Report generation failed, but analysis was saved");
      setShowReport(true); // Still show the analysis results
    }

  } catch (err) {
    setError("Failed to submit analysis. Please try again.");
    console.error("❌ Error in handleSubmit:", err);
  } finally {
    setIsSubmitting(false);
  }
};


  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    localStorage.removeItem("analysisResult");
    navigate("/");
  };

  // Legacy function - now redirects to new wellness report download
  const handleDownloadReport = () => {
    // Use the new AI-powered wellness report download
    downloadWellnessReport();
  };


  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #90ee90 0%, #7dd87d 50%, #6bcb6b 100%)',
      position: 'relative',
      padding: '0'
    }}>
      {/* Enhanced Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
          linear-gradient(45deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%)
        `,
        pointerEvents: 'none'
      }}></div>
      
      {/* Professional Header with Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(15px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid rgba(144, 238, 144, 0.2)',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: 'bold',
                color: '#2d3748',
                marginBottom: '8px',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                Mental Wellness Dashboard
              </h1>
              <p style={{ 
                color: '#4a5568', 
                fontSize: '1.1rem',
                fontWeight: '500'
              }}>
                Welcome back, {userInfo.name || 'User'}! 👋
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </motion.div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 10 }}>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: '#fed7d7',
                border: '1px solid #feb2b2',
                color: '#c53030',
                padding: '16px 20px',
                borderRadius: '12px',
                marginBottom: '32px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report Download Section moved below analysis */}

        {/* Analysis Sections */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{ marginBottom: '48px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              fontWeight: 'bold',
              color: '#2d3748',
              marginBottom: '12px',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              Start Your Analysis
            </h2>
            <p style={{
              color: '#6b7280',
              fontSize: '1.1rem',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Choose your preferred method to begin your mental wellness analysis
            </p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
            gap: '32px'
          }}>
            {/* Video Analysis Section */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              style={{
                background: 'linear-gradient(135deg, rgba(144, 238, 144, 0.08), rgba(255, 255, 255, 0.95))',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                padding: '32px',
                border: '1px solid rgba(144, 238, 144, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Card Background Pattern */}
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
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎥</div>
                  <h2 style={{
                    fontSize: '1.75rem',
                    fontWeight: 'bold',
                    color: '#2d3748',
                    marginBottom: '8px'
                  }}>
                    Video Analysis
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
                    Record a 1-minute video to help us understand your emotional state
                  </p>
                </div>
                
                <div style={{
                  position: 'relative',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                  marginBottom: '24px',
                  background: '#f8fafc'
                }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{
                      width: '100%',
                      height: '280px',
                      minWidth: '320px',
                      minHeight: '240px',
                      background: '#f1f5f9',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                  
                  {videoRecording && (
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      left: '16px',
                      right: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      zIndex: 10,
                      pointerEvents: 'none'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          background: '#ef4444',
                          borderRadius: '50%',
                          animation: 'pulse 1s ease-in-out infinite'
                        }}></div>
                        <p style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'white', margin: 0 }}>Recording</p>
                      </div>
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.7)',
                        padding: '8px 20px',
                        borderRadius: '20px',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <p style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'white', margin: 0 }}>{formatTime(countdown)}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'center' }}>
                  {!videoRecording ? (
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(144, 238, 144, 0.3)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startVideoRecording}
                      style={{
                        background: 'linear-gradient(135deg, #90ee90, #7dd87d)',
                        color: 'white',
                        fontWeight: 'bold',
                        padding: '16px 40px',
                        borderRadius: '50px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 10px 30px rgba(144, 238, 144, 0.3)',
                        textTransform: 'none',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Start Video Analysis
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={stopVideoRecording}
                      style={{
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: 'white',
                        fontWeight: 'bold',
                        padding: '16px 40px',
                        borderRadius: '50px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      Stop Recording
                    </motion.button>
                  )}
                  
                  {videoBlob && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        marginTop: '20px',
                        padding: '12px 20px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderRadius: '25px',
                        border: '1px solid rgba(34, 197, 94, 0.2)'
                      }}
                    >
                      <p style={{
                        color: '#16a34a',
                        fontWeight: '600',
                        margin: 0,
                        fontSize: '0.95rem'
                      }}>
                        ✓ Video recorded successfully
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Text Analysis Section */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              style={{
                background: 'linear-gradient(135deg, rgba(144, 238, 144, 0.08), rgba(255, 255, 255, 0.95))',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                padding: '32px',
                border: '1px solid rgba(144, 238, 144, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Card Background Pattern */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(144, 238, 144, 0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none'
              }}></div>
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✍️</div>
                  <h2 style={{
                    fontSize: '1.75rem',
                    fontWeight: 'bold',
                    color: '#2d3748',
                    marginBottom: '8px'
                  }}>
                    Text Analysis
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
                    Share your thoughts and feelings in your own words
                  </p>
                </div>
                
                <div style={{
                  minHeight: '280px',
                  border: '2px dashed #90ee90',
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '24px',
                  transition: 'all 0.3s ease',
                  background: 'rgba(144, 238, 144, 0.02)'
                }}>
                  <label style={{
                    display: 'block',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#4a5568',
                    marginBottom: '16px'
                  }}>
                    How do you feel right now? Share your thoughts and emotions.
                  </label>
                  <textarea
                    value={textInput}
                     onChange={(e) => setTextInput(e.target.value)}
  onFocus={() => !typingStartTime && setTypingStartTime(Date.now())}
                    placeholder="Express your current feelings, thoughts, or any concerns you'd like to share..."
                    style={{
                      width: '100%',
                      height: '180px',
                      padding: '16px',
                      border: 'none',
                      resize: 'none',
                      outline: 'none',
                      fontSize: '1rem',
                      color: '#4a5568',
                      fontFamily: 'inherit',
                      lineHeight: '1.6',
                      background: 'transparent'
                    }}
                    maxLength={1000}
                  />
                  <div style={{
                    textAlign: 'right',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginTop: '12px',
                    fontWeight: '500'
                  }}>
                    {textInput.length}/1000 characters
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <p style={{
                    color: '#6b7280',
                    marginBottom: '16px',
                    fontSize: '0.95rem',
                    lineHeight: '1.5'
                  }}>
                    Take your time to express yourself. Your words help us understand your mental state.
                  </p>
                  {textInput.trim() && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        padding: '12px 20px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderRadius: '25px',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        display: 'inline-block',
                        marginBottom: '16px'
                      }}
                    >
                      <p style={{
                        color: '#16a34a',
                        fontWeight: '600',
                        margin: 0,
                        fontSize: '0.95rem'
                      }}>
                        ✓ Text analysis ready
                      </p>
                    </motion.div>
                  )}

                  <div>
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(144, 238, 144, 0.3)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSubmit}
                      disabled={isSubmitting || !textInput.trim()}
                      style={{
                        background: isSubmitting || !textInput.trim()
                          ? 'linear-gradient(135deg, #d1d5db, #9ca3af)'
                          : 'linear-gradient(135deg, #90ee90, #7dd87d)',
                        color: 'white',
                        fontWeight: 'bold',
                        padding: '12px 28px',
                        borderRadius: '50px',
                        border: 'none',
                        cursor: isSubmitting || !textInput.trim() ? 'not-allowed' : 'pointer',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        boxShadow: isSubmitting || !textInput.trim() ? 'none' : '0 10px 30px rgba(144, 238, 144, 0.3)'
                      }}
                    >
                      {isSubmitting ? 'Analyzing...' : 'Submit Text Analysis'}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Report Download Section (after analysis) */}
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: '48px' }}
          >
            <div style={{
              background: 'linear-gradient(135deg, rgba(144, 238, 144, 0.12), rgba(255, 255, 255, 0.95))',
              backdropFilter: 'blur(15px)',
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '40px',
              border: '1px solid rgba(144, 238, 144, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: '-90px', right: '-90px', width: '260px', height: '260px', background: 'radial-gradient(circle, rgba(144, 238, 144, 0.2) 0%, transparent 70%)', borderRadius: '50%' }}></div>

              <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
                {generatingReport ? (
                  <>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🤖</div>
                    <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold', color: '#2d3748', marginBottom: '10px' }}>Generating AI Report...</h2>
                    <p style={{ color: '#6b7280', marginBottom: '20px' }}>Our AI is analyzing your results to create a comprehensive wellness report.</p>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      border: '4px solid rgba(144, 238, 144, 0.2)',
                      borderTop: '4px solid #90ee90',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto'
                    }}></div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📄</div>
                    <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold', color: '#2d3748', marginBottom: '10px' }}>Your Report is Ready</h2>
                    <p style={{ color: '#6b7280', marginBottom: '20px' }}>Download your AI-generated wellness report from this analysis.</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDownloadReport}
                      disabled={generatingReport}
                      style={{
                        background: 'linear-gradient(135deg, #90ee90, #7dd87d)',
                        color: 'white',
                        padding: '14px 40px',
                        borderRadius: '50px',
                        border: 'none',
                        cursor: generatingReport ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        fontWeight: 'bold',
                        fontSize: '1.05rem',
                        boxShadow: '0 15px 35px rgba(144, 238, 144, 0.35)'
                      }}
                    >
                      📥 Download Report
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          style={{ 
            textAlign: 'center', 
            marginBottom: '48px',
            background: 'linear-gradient(135deg, rgba(144, 238, 144, 0.08), rgba(255, 255, 255, 0.5))',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            padding: '40px',
            border: '1px solid rgba(144, 238, 144, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(144, 238, 144, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 1
          }}></div>
          
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#2d3748',
              marginBottom: '12px'
            }}>
              Submit Analysis
            </h3>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 25px 50px rgba(144, 238, 144, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={isSubmitting || (!videoBlob && !textInput.trim())}
            style={{
              padding: '20px 60px',
              borderRadius: '50px',
              fontWeight: 'bold',
              fontSize: '1.25rem',
              transition: 'all 0.3s ease',
              border: 'none',
              cursor: isSubmitting || (!videoBlob && !textInput.trim()) ? 'not-allowed' : 'pointer',
              background: isSubmitting || (!videoBlob && !textInput.trim()) 
                ? 'linear-gradient(135deg, #d1d5db, #9ca3af)' 
                : 'linear-gradient(135deg, #90ee90, #7dd87d)',
              color: 'white',
              boxShadow: isSubmitting || (!videoBlob && !textInput.trim()) 
                ? 'none' 
                : '0 20px 40px rgba(144, 238, 144, 0.3)',
              textTransform: 'none',
              letterSpacing: '0.5px'
            }}
          >
            {isSubmitting ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '3px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '12px'
                }}></div>
                Analyzing...
              </div>
            ) : (
              'Submit Analysis'
            )}
          </motion.button>
          
          <p style={{
            color: '#6b7280',
            marginTop: '20px',
            fontSize: '0.95rem'
          }}>
            Your analysis will be processed securely and confidentially.
          </p>
          </div>
        </motion.div>

        {/* Support Contacts Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          style={{
            background: 'linear-gradient(135deg, rgba(144, 238, 144, 0.12), rgba(255, 255, 255, 0.95))',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '40px',
            border: '1px solid rgba(144, 238, 144, 0.3)',
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
            background: 'radial-gradient(circle, rgba(144, 238, 144, 0.2) 0%, transparent 70%)',
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

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default AnalysisPage;