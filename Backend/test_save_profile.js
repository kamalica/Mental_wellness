// Test if the save-profile endpoint is working

console.log("Testing save-profile endpoint...\n");

// Instructions:
console.log("1. Open your browser DevTools (F12)");
console.log("2. Go to the Application/Storage tab");
console.log("3. Look for Clerk session token");
console.log("4. Or login to your app and check Network tab");
console.log("\nThen run this test with a real token:\n");

const testToken = "YOUR_CLERK_TOKEN_HERE"; // Replace with actual token from browser

async function testSaveProfile() {
  try {
    const response = await fetch("http://localhost:8000/api/users/save-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${testToken}`
      },
      body: JSON.stringify({
        name: "Test User",
        age: 25
      })
    });

    console.log("Status:", response.status);
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log("\n✅ SUCCESS! Profile saved to database");
    } else {
      console.log("\n❌ ERROR:", data.error || "Unknown error");
    }
  } catch (error) {
    console.error("\n❌ Request failed:", error.message);
  }
}

// Uncomment when you have a real token
// testSaveProfile();

console.log("\n=== DEBUG CHECKLIST ===");
console.log("1. Is backend running on http://localhost:8000? ✓");
console.log("2. Is MongoDB connected? (check terminal)");
console.log("3. Check if Clerk token is being sent from frontend");
console.log("4. Check browser Network tab for the API call");
console.log("5. Check backend terminal for any errors\n");
