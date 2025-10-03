const mongoose = require("mongoose");

const UserDataSchema = new mongoose.Schema(
  {
    clerk_user_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    text_analysis: { 
      type: mongoose.Schema.Types.Mixed, // Stores JSON object
      default: null 
    },
    video_analysis: { 
      type: mongoose.Schema.Types.Mixed, // Stores JSON object
      default: null 
    },
    report_pdf: { type: String }, // Stores the text version of the report
    report_pdf_buffer: { type: Buffer }, // Stores the PDF as binary data
    report_generated_date: { type: Date } // Timestamp when report was generated
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserData", UserDataSchema);
