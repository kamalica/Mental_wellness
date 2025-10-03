const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    clearOldPDFs();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

async function clearOldPDFs() {
  try {
    const UserData = mongoose.model('UserData', new mongoose.Schema({
      clerk_user_id: String,
      name: String,
      age: Number,
      report_pdf: String,
      report_pdf_buffer: Buffer,
      report_generated_date: Date
    }));

    // Find all users with PDF reports
    const users = await UserData.find({ 
      report_pdf_buffer: { $exists: true, $ne: null } 
    });

    console.log(`\n📊 Found ${users.length} user(s) with PDF reports\n`);

    for (const user of users) {
      console.log(`👤 User: ${user.name}`);
      console.log(`   Current PDF size: ${user.report_pdf_buffer ? (user.report_pdf_buffer.length / 1024).toFixed(2) : 0} KB`);
      console.log(`   Generated: ${user.report_generated_date || 'Unknown'}`);
    }

    console.log('\n🗑️  Deleting old PDF data...\n');

    // Clear PDF data
    const result = await UserData.updateMany(
      {},
      {
        $unset: {
          report_pdf_buffer: "",
          report_generated_date: ""
        }
      }
    );

    console.log(`✅ Cleared PDF data for ${result.modifiedCount} user(s)`);
    console.log('🔄 Now submit a new analysis through the app to generate a fresh PDF with new formatting\n');

    mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}
