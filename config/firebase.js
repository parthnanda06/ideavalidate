const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

let db;
let auth;

try {
  // Check if service account file exists
  const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");
  
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log("🔥 Firebase Admin initialized with service account");
  } else {
    // Fallback for development/placeholder without crashing immediately
    // usage will fail if not configured, but app starts
    console.warn("⚠️ Firebase Service Account not found at:", serviceAccountPath);
    console.warn("⚠️ Make sure to download the JSON from Firebase Console and save it as 'serviceAccountKey.json' in the project root.");
  }

  // Initialize services if app is initialized
  if (admin.apps.length > 0) {
    db = admin.firestore();
    auth = admin.auth();
  } else {
    // Mock db for initial startup so server doesn't crash before config
    console.warn("⚠️ Running in partial mode - Database features will fail until configured");
    db = {
        collection: () => ({
            add: async () => { throw new Error("Firebase not configured"); },
            get: async () => { throw new Error("Firebase not configured"); }
        })
    };
  }

} catch (error) {
  console.error("❌ Firebase initialization error:", error);
}

module.exports = { admin, db, auth };
