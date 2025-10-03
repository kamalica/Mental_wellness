import { useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function RegisterForm() {
  const [age, setAge] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!age || age < 1 || age > 120) {
      setError("Please enter a valid age");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Get JWT token from Clerk
      const token = await getToken();

      // Send to backend with Clerk userId + name + age
      const res = await fetch("http://localhost:8000/api/users/save-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 👈 Clerk JWT
        },
        body: JSON.stringify({
          name: user.fullName || user.firstName || "User",
          age: parseInt(age),
        }),
      });

      if (!res.ok) throw new Error("Failed to save profile");

      const data = await res.json();
      console.log("✅ Profile saved:", data);

      // Store user info in localStorage
      localStorage.setItem('userInfo', JSON.stringify({
        id: user.id,
        name: user.fullName || user.firstName || "User",
        age: parseInt(age)
      }));

      // Navigate to analysis page
      navigate("/analysis");

    } catch (err) {
      console.error("❌ Error saving profile:", err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
      <h2>Complete Your Profile</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label htmlFor="name" style={{ display: "block", marginBottom: "0.5rem" }}>
            Name
          </label>
          <input
            type="text"
            id="name"
            value={user?.fullName || user?.firstName || ""}
            disabled
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              backgroundColor: "#f5f5f5"
            }}
          />
        </div>
        
        <div>
          <label htmlFor="age" style={{ display: "block", marginBottom: "0.5rem" }}>
            Age *
          </label>
          <input
            type="number"
            id="age"
            placeholder="Enter your age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min="1"
            max="120"
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px"
            }}
          />
        </div>

        {error && (
          <div style={{ color: "red", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isSubmitting}
          style={{
            padding: "0.75rem",
            backgroundColor: isSubmitting ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            fontSize: "1rem",
            fontWeight: "bold"
          }}
        >
          {isSubmitting ? "Saving..." : "Complete Registration"}
        </button>
      </form>
    </div>
  );
}
