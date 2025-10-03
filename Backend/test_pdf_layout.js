/**
 * Test script to verify PDF generation improvements
 * Run this to test the improved PDF layout
 */

const { generateWellnessPDF } = require('./utils/pdfGenerator');
const fs = require('fs');
const path = require('path');

// Sample report content with various formatting to test
const sampleReport = `### Overall Wellness Assessment

Based on the comprehensive analysis of your emotional state and communication patterns, here is your personalized wellness report.

### Emotional Analysis Summary

Your facial emotion analysis revealed the following patterns:

* Happy expressions detected: 65% of the time
* Neutral expressions: 25% of the time
* Concerned expressions: 10% of the time

This indicates a generally positive emotional baseline with occasional moments of thoughtfulness.

### Communication Patterns

The text analysis of your responses shows:

* Positive sentiment: 70%
* Neutral sentiment: 20%
* Negative sentiment: 10%

**Key Observations:**

Your writing speed averaged 45 words per minute, which is within the normal range. This suggests comfortable expression without excessive hesitation or rushing.

### Mental Wellness Indicators

Several positive indicators emerged from your assessment:

* Consistent emotional expression across different contexts
* Balanced communication style
* Good self-awareness in responses
* Appropriate emotional regulation

### Areas for Growth

While your overall wellness indicators are positive, consider these areas for continued development:

* Mindfulness practices could help maintain emotional balance
* Regular stress management techniques may be beneficial
* Continued self-reflection supports ongoing growth

### Recommendations

**Daily Practices:**

* Practice 10 minutes of mindfulness meditation
* Maintain a gratitude journal
* Engage in regular physical activity
* Ensure adequate sleep (7-9 hours)

**Social Connection:**

* Regular interaction with supportive friends and family
* Participation in community or group activities
* Seeking support when needed

**Professional Support:**

If you experience persistent changes in mood, energy, or daily functioning, consider consulting with a mental health professional for personalized guidance.

### Strengths to Celebrate

Your assessment highlights several strengths:

* Strong emotional resilience
* Positive communication patterns
* Good self-awareness
* Balanced perspective on life challenges

### Conclusion

This report reflects your current wellness state based on the analysis conducted. Remember that mental wellness is an ongoing journey, and it's normal to experience variations over time.

Continue to practice self-care, maintain social connections, and don't hesitate to seek support when needed. Your proactive approach to understanding your mental wellness is a positive step toward overall well-being.

**Remember:** This assessment is a snapshot in time. Regular check-ins and continued self-awareness will support your ongoing wellness journey.`;

async function testPDFGeneration() {
  try {
    console.log('🧪 Testing PDF Generation...\n');

    const testData = {
      report: sampleReport,
      userName: 'Test User',
      age: 28,
      generatedDate: new Date().toISOString()
    };

    console.log('📝 Report length:', sampleReport.length, 'characters');
    console.log('📄 Generating PDF...');

    const startTime = Date.now();
    const pdfBuffer = await generateWellnessPDF(testData);
    const endTime = Date.now();

    console.log(`✅ PDF generated successfully in ${endTime - startTime}ms`);
    console.log(`📊 PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

    // Save the test PDF
    const outputPath = path.join(__dirname, 'test_wellness_report.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log(`\n💾 Test PDF saved to: ${outputPath}`);
    console.log('\n✨ Verification Checklist:');
    console.log('[ ] Open the PDF and check for proper margins');
    console.log('[ ] Verify no text overlapping');
    console.log('[ ] Confirm no extra blank pages');
    console.log('[ ] Check all content is within page boundaries');
    console.log('[ ] Verify footer appears on every page');
    console.log('[ ] Check section headers are properly formatted');
    console.log('[ ] Verify bullet points are indented correctly');
    console.log('[ ] Confirm page breaks occur at appropriate points');

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testPDFGeneration();
