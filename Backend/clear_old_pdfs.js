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

    // Ask for confirmation
    console.log('\n⚠️  This will clear all PDF data. You can regenerate by submitting a new analysis.');
    console.log('📝 Type "yes" to confirm or press Ctrl+C to cancel\n');

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('Confirm deletion (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes') {
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

        console.log(`\n✅ Cleared PDF data for ${result.modifiedCount} user(s)`);
        console.log('🔄 Generate a new report through the app to create fresh PDFs with new formatting\n');
      } else {
        console.log('\n❌ Operation cancelled\n');
      }

      readline.close();
      mongoose.connection.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}
