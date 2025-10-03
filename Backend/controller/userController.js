const UserData = require("../models/userData")

// Save or update user profile (name, age)
const saveUserProfile = async (req, res) => {
  try {
    console.log("📝 Save Profile Request Received");
    console.log("   Clerk User ID:", req.user?.sub);
    console.log("   Request Body:", req.body);

    const { name, age } = req.body;

    if (!name || !age) {
      console.log("❌ Validation failed: Missing name or age");
      return res.status(400).json({ error: "Name and age are required" });
    }

    console.log("💾 Attempting to save to MongoDB...");

    const data = await UserData.findOneAndUpdate(
      { clerk_user_id: req.user.sub }, // Clerk User ID from token
      { name, age },
      { new: true, upsert: true }
    );

    console.log("✅ Profile saved successfully!");
    console.log("   Saved Data:", data);

    res.json({ message: "✅ Profile saved successfully", data });
  } catch (error) {
    console.error("❌ Error saving profile:", error);
    res.status(500).json({ error: error.message });
  }
};

// Save text analysis results
const saveTextAnalysis = async (req, res) => {
  try {
    const { text_analysis } = req.body;

    if (!text_analysis) {
      return res.status(400).json({ error: "Text analysis data is required" });
    }

    const data = await UserData.findOneAndUpdate(
      { clerk_user_id: req.user.sub },
      { text_analysis },
      { new: true, upsert: true }
    );

    res.json({ message: "✅ Text analysis saved successfully", data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Save video analysis results
const saveVideoAnalysis = async (req, res) => {
  try {
    const { video_analysis } = req.body;

    if (!video_analysis) {
      return res.status(400).json({ error: "Video analysis data is required" });
    }

    const data = await UserData.findOneAndUpdate(
      { clerk_user_id: req.user.sub },
      { video_analysis },
      { new: true, upsert: true }
    );

    res.json({ message: "✅ Video analysis saved successfully", data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Save or update results (all fields)
const saveResults = async (req, res) => {
  try {
    const { name, age, text_analysis, video_analysis, report_pdf } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (age) updateData.age = age;
    if (text_analysis) updateData.text_analysis = text_analysis;
    if (video_analysis) updateData.video_analysis = video_analysis;
    if (report_pdf) updateData.report_pdf = report_pdf;

    const data = await UserData.findOneAndUpdate(
      { clerk_user_id: req.user.sub }, // Clerk User ID from token
      updateData,
      { new: true, upsert: true }
    );

    res.json({ message: "✅ Data saved successfully", data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch results for logged-in user
const getResults = async (req, res) => {
  try {
    const data = await UserData.findOne({ clerk_user_id: req.user.sub });
    if (!data) return res.status(404).json({ message: "No results found" });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  saveUserProfile,
  saveTextAnalysis, 
  saveVideoAnalysis, 
  saveResults, 
  getResults 
};
