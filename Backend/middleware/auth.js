const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

// Use your Clerk frontend API URL as issuer
const CLERK_ISSUER = "https://creative-cobra-87.clerk.accounts.dev";

const client = jwksClient({
  jwksUri: `${CLERK_ISSUER}/.well-known/jwks.json`,
});

console.log(client)

// Helper to get signing key
function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

const verifyClerkToken = (req, res, next) => {
  console.log("🔐 Auth Middleware: Verifying token...");
  
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log("❌ No authorization header found");
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  console.log("   Token received:", token ? "✓" : "✗");

  jwt.verify(token, getKey, { algorithms: ["RS256"] }, (err, decoded) => {
    if (err) {
      console.log("❌ Token verification failed:", err.message);
      return res.status(401).json({ error: "Invalid token" });
    }

    console.log("✅ Token verified successfully");
    console.log("   User ID (sub):", decoded.sub);

    // decoded will contain clerk_user_id in "sub"
    req.user = decoded;
    next();
  });
};

module.exports = verifyClerkToken;
