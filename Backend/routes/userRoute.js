const express = require("express");
const router = express.Router();
const { 
  saveUserProfile,
  saveTextAnalysis,
  saveVideoAnalysis,
  saveResults, 
  getResults 
} = require("../controller/userController");
const verifyClerkToken = require("../middleware/auth");

console.log("Entered")

// POST → Save user profile (name, age)
router.post("/save-profile", verifyClerkToken, saveUserProfile);

// POST → Save text analysis
router.post("/save-text-analysis", verifyClerkToken, saveTextAnalysis);

// POST → Save video analysis
router.post("/save-video-analysis", verifyClerkToken, saveVideoAnalysis);

// POST → Save all results
router.post("/save-results", verifyClerkToken, saveResults);

// GET → Fetch results
router.get("/get-results", verifyClerkToken, getResults);

module.exports = router;
