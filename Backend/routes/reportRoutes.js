const express = require("express");
const router = express.Router();
const { 
  generateWellnessReport,
  getWellnessReport,
  downloadWellnessPDF
} = require("../controller/reportController");
const verifyClerkToken = require("../middleware/auth");

// POST → Generate AI-powered wellness report using Groq
router.post("/generate", verifyClerkToken, generateWellnessReport);

// GET → Retrieve stored wellness report (text version)
router.get("/get-report", verifyClerkToken, getWellnessReport);

// GET → Download wellness report as PDF
router.get("/download-pdf", verifyClerkToken, downloadWellnessPDF);

module.exports = router;
