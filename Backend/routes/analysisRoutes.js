const express = require("express");
const { spawn } = require("child_process");
const router = express.Router();

let pythonProcess = null;
let latestAnalysis = null;

// Helper to start Python process safely
function startPythonProcess() {
  pythonProcess = spawn(
    "D:/Other_Projects/Mental_Wellness_New/Backend/Scripts/venv/Scripts/python.exe",
    ["D:/Other_Projects/Mental_Wellness_New/Backend/Scripts/Face/emotion_analysis.py"]
  );

  pythonProcess.stdout.on("data", (data) => {
    try {
      const result = JSON.parse(data.toString());
      latestAnalysis = result;
      
      // Log the analysis result to console
      if (result.success) {
        console.log(`Frame #${result.frame_number}: ${result.faces_detected} face(s) detected`);
        if (result.emotions && result.emotions.length > 0) {
          result.emotions.forEach(emotion => {
            console.log(`  - ${emotion.emotion} (${(emotion.confidence * 100).toFixed(1)}%)`);
          });
        }
        
        // Log consolidated report every 10 frames
        if (result.current_report && result.frame_number % 10 === 0) {
          console.log("\n📊 Consolidated Report:");
          console.log(`  Dominant Emotion: ${result.current_report.dominant_emotion}`);
          console.log(`  Session Duration: ${result.current_report.session_duration}s`);
          console.log(`  Total Faces: ${result.current_report.total_faces_detected}`);
          console.log("  Emotion Breakdown:");
          Object.entries(result.current_report.emotion_percentages).forEach(([emotion, percentage]) => {
            console.log(`    ${emotion}: ${percentage}%`);
          });
          console.log("");
        }
      } else {
        console.error(`Frame #${result.frame_number} failed:`, result.error);
      }
    } catch (err) {
      console.error("Parsing Python output failed:", err);
      console.error("Raw data:", data.toString());
    }
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error("Python error:", data.toString());
  });

  pythonProcess.on("exit", () => {
    console.log("Python process exited");
    pythonProcess = null;
  });
}

router.post("/face_emotion", (req, res, next) => {
  try {
    const { frame } = req.body;
    if (!frame) return res.status(400).json({ error: "No frame provided" });

    if (!pythonProcess) startPythonProcess();

    // Check if process started successfully
    if (!pythonProcess) {
      return res.status(500).json({ error: "Python process failed to start" });
    }

    // Send frame to Python
    pythonProcess.stdin.write(frame + "\n");

    // Always respond
    return res.json({ success: true, analysis: latestAnalysis });
  } catch (err) {
    console.error("Route error:", err);
    next(err); // Pass to Express error handler
  }
});

// Route to get the current analysis report
router.get("/emotion_report", (req, res, next) => {
  try {
    if (!latestAnalysis) {
      return res.json({ 
        success: false, 
        message: "No analysis data available yet" 
      });
    }

    // Return the complete consolidated report
    const report = latestAnalysis.current_report || latestAnalysis;
    
    // Build a comprehensive report with formatted details
    const comprehensiveReport = {
      ...report,
      summary: {
        dominant_emotion: report.dominant_emotion || "Unknown",
        session_duration: report.session_duration || 0,
        total_frames: report.total_frames || 0,
        total_faces_detected: report.total_faces_detected || 0
      },
      emotion_breakdown: report.emotion_percentages || {},
      formatted_report: generateFormattedReport(report),
      timestamp: report.timestamp || new Date().toISOString()
    };

    return res.json({ 
      success: true, 
      report: comprehensiveReport
    });
  } catch (err) {
    console.error("Report route error:", err);
    next(err);
  }
});

// Helper function to generate formatted text report
function generateFormattedReport(report) {
  if (!report || !report.emotion_percentages) {
    return "No emotion data available";
  }

  const { dominant_emotion, total_faces_detected, emotion_percentages, session_duration } = report;
  
  // Sort emotions by percentage
  const sortedEmotions = Object.entries(emotion_percentages)
    .sort(([, a], [, b]) => b - a);

  let formatted = `📊 CONSOLIDATED EMOTION ANALYSIS REPORT\n`;
  formatted += `${'='.repeat(70)}\n\n`;
  formatted += `>>> DOMINANT EMOTION: ${dominant_emotion?.toUpperCase() || 'UNKNOWN'} <<<\n\n`;
  formatted += `Session Duration: ${session_duration}s\n`;
  formatted += `Total Faces Detected: ${total_faces_detected}\n`;
  formatted += `Total Frames Analyzed: ${report.total_frames || 0}\n\n`;
  formatted += `${'-'.repeat(70)}\n`;
  formatted += `EMOTION DISTRIBUTION:\n`;
  formatted += `${'-'.repeat(70)}\n`;

  sortedEmotions.forEach(([emotion, percentage]) => {
    const barLength = Math.round((percentage / 100) * 50);
    const bar = '#'.repeat(barLength) + '-'.repeat(50 - barLength);
    formatted += `  ${emotion.padEnd(12)} |${bar}| ${percentage.toFixed(2)}%\n`;
  });

  formatted += `${'='.repeat(70)}\n`;

  return formatted;
}

//text analysis 
router.post("/text_analysis", (req, res, next) => {
  try {
    const { text, duration } = req.body;
    console.log("📝 Text received:", text);
    console.log("⏱️  Duration:", duration);
    
    if (!text || duration == null) {
      return res.status(400).json({ error: "Text and duration are required" });
    }

    const inputData = { text, duration };
    console.log("🚀 Spawning Python process for text analysis...");
    
    const py = spawn(
      "D:/Other_Projects/Mental_Wellness_New/Backend/Scripts/venv/Scripts/python.exe",
      ["D:/Other_Projects/Mental_Wellness_New/Backend/Scripts/Text/text_speed.py"],
      {
        cwd: "D:/Other_Projects/Mental_Wellness_New/Backend/Scripts/Text",
        env: { ...process.env, PYTHONUNBUFFERED: "1" }
      }
    );

    let output = "";
    let errorOutput = "";
    
    py.stdout.on("data", (data) => {
      const chunk = data.toString();
      console.log("📤 Python stdout:", chunk);
      output += chunk;
    });

    py.stderr.on("data", (data) => {
      const chunk = data.toString();
      console.error("⚠️  Python stderr:", chunk);
      errorOutput += chunk;
    });

    py.on("close", (code) => {
      console.log(`✅ Python process exited with code: ${code}`);
      console.log("📊 Full output:", output);
      
      try {
        const result = JSON.parse(output);
        console.log("✅ Parsed result:", result);
        res.json({ success: true, analysis: result });
      } catch (err) {
        console.error("❌ Failed to parse Python output:", err.message);
        console.error("Raw output:", output);
        res.status(500).json({ 
          success: false, 
          error: "Failed to parse Python output",
          raw_output: output,
          stderr: errorOutput
        });
      }
    });

    py.on("error", (err) => {
      console.error("❌ Failed to spawn Python process:", err);
      res.status(500).json({ 
        success: false, 
        error: "Failed to start Python process: " + err.message 
      });
    });

    // Send JSON input to Python stdin
    const jsonInput = JSON.stringify(inputData);
    console.log("📨 Sending to Python stdin:", jsonInput);
    py.stdin.write(jsonInput + "\n");
    py.stdin.end();
    
  } catch (err) {
    console.error("❌ Route error:", err);
    next(err);
  }
});

// Route to stop the analysis and get final report
router.post("/stop_analysis", (req, res, next) => {
  try {
    if (pythonProcess) {
      pythonProcess.kill();
      pythonProcess = null;
      console.log("🛑 Analysis stopped by user request");
    }

    const report = latestAnalysis?.current_report || latestAnalysis;
    
    // Build comprehensive final report
    const comprehensiveReport = report ? {
      ...report,
      summary: {
        dominant_emotion: report.dominant_emotion || "Unknown",
        session_duration: report.session_duration || 0,
        total_frames: report.total_frames || 0,
        total_faces_detected: report.total_faces_detected || 0
      },
      emotion_breakdown: report.emotion_percentages || {},
      formatted_report: generateFormattedReport(report),
      timestamp: report.timestamp || new Date().toISOString()
    } : null;

    return res.json({ 
      success: true, 
      message: "Analysis stopped",
      final_report: comprehensiveReport
    });
  } catch (err) {
    console.error("Stop analysis error:", err);
    next(err);
  }
});

module.exports = router;
