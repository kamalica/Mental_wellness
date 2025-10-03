const UserData = require("../models/userData");
const Groq = require("groq-sdk");
const { generateWellnessPDF } = require("../utils/pdfGenerator");

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API
});

/**
 * Generate AI-powered wellness report using Groq API
 * Combines user data (name, age), video analysis, and text analysis
 */
const generateWellnessReport = async (req, res) => {
  try {
    // Get user data from database using Clerk user ID
    const userData = await UserData.findOne({ clerk_user_id: req.user.sub });
    
    if (!userData) {
      return res.status(404).json({ 
        success: false,
        error: "User data not found. Please complete analysis first." 
      });
    }

    // Check if both analyses are available
    if (!userData.video_analysis && !userData.text_analysis) {
      return res.status(400).json({ 
        success: false,
        error: "No analysis data available. Please complete video or text analysis first." 
      });
    }

    console.log("📊 Generating wellness report for:", userData.name);

    // Prepare data for Groq API
    const reportPrompt = buildReportPrompt(userData);

    console.log("🤖 Sending request to Groq API...");

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a compassionate mental wellness analyst and counselor. Your role is to:
1. Analyze emotion detection and text sentiment data
2. Generate supportive, professional wellness reports
3. Provide actionable recommendations
4. Be empathetic and encouraging
5. Use clear, non-technical language
6. Format reports in a structured, easy-to-read manner

Always maintain a positive, supportive tone while being honest about areas of concern.`
        },
        {
          role: "user",
          content: reportPrompt
        }
      ],
      model: "llama-3.3-70b-versatile", // Fast and accurate model
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 1
    });

    const generatedReport = chatCompletion.choices[0]?.message?.content;

    if (!generatedReport) {
      throw new Error("Failed to generate report from Groq API");
    }

    console.log("✅ Report generated successfully");

    // Generate PDF from the report
    console.log("📄 Generating PDF...");
    const pdfBuffer = await generateWellnessPDF({
      report: generatedReport,
      userName: userData.name,
      age: userData.age,
      generatedDate: new Date().toISOString()
    });

    console.log("✅ PDF generated successfully");

    // Save the generated report and PDF to database
    userData.report_pdf = generatedReport; // Store text version
    userData.report_pdf_buffer = pdfBuffer; // Store PDF as Buffer
    userData.report_generated_date = new Date(); // Store generation timestamp
    await userData.save();

    console.log("💾 Report and PDF saved to database");

    // Return the report
    return res.json({
      success: true,
      message: "Wellness report generated successfully",
      report: {
        user_name: userData.name,
        user_age: userData.age,
        generated_at: new Date().toISOString(),
        content: generatedReport,
        analysis_summary: {
          video_completed: !!userData.video_analysis,
          text_completed: !!userData.text_analysis,
          dominant_emotion: userData.video_analysis?.dominant_emotion || "N/A",
          sentiment: userData.text_analysis?.text_sentiment?.overall_sentiment || "N/A",
          wellness_score: userData.text_analysis?.overall_assessment?.wellness_score || "N/A"
        }
      }
    });

  } catch (error) {
    console.error("❌ Error generating wellness report:", error);
    return res.status(500).json({ 
      success: false,
      error: "Failed to generate wellness report",
      details: error.message 
    });
  }
};

/**
 * Build the prompt for Groq API with user data
 */
function buildReportPrompt(userData) {
  const { name, age, video_analysis, text_analysis } = userData;

  let prompt = `Generate a comprehensive Mental Wellness Report for the following individual:\n\n`;
  
  prompt += `=== PERSONAL INFORMATION ===\n`;
  prompt += `Name: ${name}\n`;
  prompt += `Age: ${age} years old\n`;
  prompt += `Report Date: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}\n\n`;

  // Video Analysis Section
  if (video_analysis) {
    prompt += `=== VIDEO EMOTION ANALYSIS ===\n`;
    prompt += `Session Duration: ${video_analysis.session_duration || video_analysis.summary?.session_duration || 'N/A'} seconds\n`;
    prompt += `Total Frames Analyzed: ${video_analysis.total_frames || video_analysis.summary?.total_frames || 'N/A'}\n`;
    prompt += `Faces Detected: ${video_analysis.total_faces_detected || video_analysis.summary?.total_faces_detected || 'N/A'}\n`;
    prompt += `Dominant Emotion: ${video_analysis.dominant_emotion || video_analysis.summary?.dominant_emotion || 'N/A'}\n\n`;
    
    prompt += `Emotion Distribution:\n`;
    const emotions = video_analysis.emotion_percentages || video_analysis.emotion_breakdown || {};
    Object.entries(emotions)
      .sort(([, a], [, b]) => b - a)
      .forEach(([emotion, percentage]) => {
        if (percentage > 0) {
          prompt += `  - ${emotion}: ${percentage}%\n`;
        }
      });
    prompt += `\n`;
  } else {
    prompt += `=== VIDEO EMOTION ANALYSIS ===\n`;
    prompt += `No video analysis data available.\n\n`;
  }

  // Text Analysis Section
  if (text_analysis) {
    prompt += `=== TEXT SENTIMENT ANALYSIS ===\n`;
    prompt += `Text Input: "${text_analysis.typed_text}"\n\n`;
    
    prompt += `Typing Metrics:\n`;
    if (text_analysis.typing_speed) {
      prompt += `  - Words per Minute: ${text_analysis.typing_speed.words_per_minute}\n`;
      prompt += `  - Time Taken: ${text_analysis.typing_speed.time_taken} seconds\n`;
      prompt += `  - Total Words: ${text_analysis.typing_speed.total_words}\n\n`;
    }
    
    prompt += `Sentiment Analysis:\n`;
    if (text_analysis.text_sentiment) {
      prompt += `  - Overall Sentiment: ${text_analysis.text_sentiment.overall_sentiment}\n`;
      prompt += `  - Sentiment Score: ${text_analysis.text_sentiment.sentiment_score}\n`;
      
      if (text_analysis.text_sentiment.detected_concerns?.length > 0) {
        prompt += `  - Detected Concerns: ${text_analysis.text_sentiment.detected_concerns.join(', ')}\n`;
      }
      
      if (text_analysis.text_sentiment.positive_indicators?.length > 0) {
        prompt += `  - Positive Indicators: ${text_analysis.text_sentiment.positive_indicators.join(', ')}\n`;
      }
      
      if (text_analysis.text_sentiment.keyword_categories?.length > 0) {
        prompt += `  - Keyword Categories: ${text_analysis.text_sentiment.keyword_categories.join(', ')}\n`;
      }
    }
    
    prompt += `\n`;
    
    if (text_analysis.overall_assessment) {
      prompt += `Overall Assessment:\n`;
      prompt += `  - Wellness Score: ${text_analysis.overall_assessment.wellness_score}/100\n`;
      prompt += `  - Risk Level: ${text_analysis.overall_assessment.risk_level}\n`;
      
      if (text_analysis.overall_assessment.primary_indicators?.length > 0) {
        prompt += `  - Primary Indicators: ${text_analysis.overall_assessment.primary_indicators.join(', ')}\n`;
      }
      
      if (text_analysis.overall_assessment.recommendations?.length > 0) {
        prompt += `\nSystem Recommendations:\n`;
        text_analysis.overall_assessment.recommendations.forEach((rec, index) => {
          prompt += `  ${index + 1}. ${rec}\n`;
        });
      }
    }
    prompt += `\n`;
  } else {
    prompt += `=== TEXT SENTIMENT ANALYSIS ===\n`;
    prompt += `No text analysis data available.\n\n`;
  }

  // Instructions for report generation
  prompt += `=== REPORT REQUIREMENTS ===\n`;
  prompt += `Please generate a comprehensive Mental Wellness Report with the following sections:\n\n`;
  prompt += `1. EXECUTIVE SUMMARY\n`;
  prompt += `   - Brief overview of ${name}'s current mental wellness state\n`;
  prompt += `   - Key findings from both video and text analysis\n\n`;
  
  prompt += `2. EMOTIONAL STATE ANALYSIS\n`;
  prompt += `   - Detailed interpretation of emotion detection results\n`;
  prompt += `   - What the dominant emotions indicate about their mental state\n`;
  prompt += `   - Patterns or notable observations\n\n`;
  
  prompt += `3. SENTIMENT & EXPRESSION ANALYSIS\n`;
  prompt += `   - Analysis of their written expression and typing patterns\n`;
  prompt += `   - Interpretation of detected concerns or positive indicators\n`;
  prompt += `   - Correlation between emotions and text sentiment\n\n`;
  
  prompt += `4. WELLNESS ASSESSMENT\n`;
  prompt += `   - Overall mental wellness evaluation\n`;
  prompt += `   - Strengths and areas of concern\n`;
  prompt += `   - Risk factors (if any)\n\n`;
  
  prompt += `5. PERSONALIZED RECOMMENDATIONS\n`;
  prompt += `   - Specific, actionable steps for ${name}\n`;
  prompt += `   - Coping strategies based on detected patterns\n`;
  prompt += `   - When to seek professional help (if needed)\n`;
  prompt += `   - Daily practices for maintaining mental wellness\n\n`;
  
  prompt += `6. POSITIVE REINFORCEMENT\n`;
  prompt += `   - Highlight positive aspects and strengths\n`;
  prompt += `   - Encouraging message\n`;
  prompt += `   - Resources for continued support\n\n`;
  
  prompt += `Use a warm, professional, and supportive tone. Be specific with recommendations based on the data provided. Format the report clearly with headers and bullet points for easy reading.`;

  return prompt;
}

/**
 * Get the stored wellness report for a user
 */
const getWellnessReport = async (req, res) => {
  try {
    const userData = await UserData.findOne({ clerk_user_id: req.user.sub });
    
    if (!userData) {
      return res.status(404).json({ 
        success: false,
        error: "User data not found" 
      });
    }

    if (!userData.report_pdf) {
      return res.status(404).json({ 
        success: false,
        error: "No wellness report found. Please generate a report first." 
      });
    }

    return res.json({
      success: true,
      report: {
        user_name: userData.name,
        user_age: userData.age,
        content: userData.report_pdf,
        last_updated: userData.updatedAt
      }
    });

  } catch (error) {
    console.error("❌ Error fetching wellness report:", error);
    return res.status(500).json({ 
      success: false,
      error: "Failed to fetch wellness report",
      details: error.message 
    });
  }
};

/**
 * Download wellness report as PDF
 */
const downloadWellnessPDF = async (req, res) => {
  try {
    const userData = await UserData.findOne({ clerk_user_id: req.user.sub });
    
    if (!userData) {
      return res.status(404).json({ 
        success: false,
        error: "User data not found" 
      });
    }

    // Optional: force-regenerate PDF using the stored text version to avoid stale buffers
    const force = String(req.query.force || '').toLowerCase() === 'true';
    if (force) {
      console.log("♻️  Force-regenerating PDF buffer from stored report text...");
      if (!userData.report_pdf) {
        return res.status(404).json({
          success: false,
          error: "No report text found to regenerate PDF. Please generate a report first."
        });
      }
      const regenerated = await generateWellnessPDF({
        report: userData.report_pdf,
        userName: userData.name,
        age: userData.age,
        generatedDate: new Date().toISOString()
      });
      userData.report_pdf_buffer = regenerated;
      userData.report_generated_date = new Date();
      await userData.save();
    }

    if (!userData.report_pdf_buffer) {
      return res.status(404).json({ 
        success: false,
        error: "No PDF report found. Please generate a report first." 
      });
    }

    console.log("📥 Downloading PDF report for:", userData.name);

    // Set headers for PDF download
    const fileName = `Mental_Wellness_Report_${userData.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', userData.report_pdf_buffer.length);

    // Send the PDF buffer
    return res.send(userData.report_pdf_buffer);

  } catch (error) {
    console.error("❌ Error downloading PDF report:", error);
    return res.status(500).json({ 
      success: false,
      error: "Failed to download PDF report",
      details: error.message 
    });
  }
};

module.exports = { 
  generateWellnessReport,
  getWellnessReport,
  downloadWellnessPDF
};
