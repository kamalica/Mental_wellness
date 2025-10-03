require("dotenv").config();
const express = require("express");
const connectDB = require("./db");
const userRoutes = require("./routes/userRoute");
const analysisRoutes = require("./routes/analysisRoutes");
const reportRoutes = require("./routes/reportRoutes");
const cors = require("cors");
const app = express();
app.use(express.json());

console.log("Server.js")

app.use(cors({
  origin: "http://localhost:5173",  // your frontend URL
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"], // important for JWT
  credentials: true
}));

  
// Connect DB
connectDB();

// Routes
app.use("/api/users", userRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/reports", reportRoutes); // New wellness report routes

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
