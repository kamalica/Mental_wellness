// db.js
const mongoose = require("mongoose");

console.log(process.env.MONGO_URI)

const connectDB = async () => {
  try {
    // These options are no longer needed in MongoDB driver v4.0.0+
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
