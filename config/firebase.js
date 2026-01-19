const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

let db;
let auth;

try {
  let serviceAccount;
  
  // 1. Try Environment Variables (Production / Vercel)
  if (process.env.FIREBASE_PRIVATE_KEY) {
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Handle Vercel's formatting of newlines in env vars
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("🔥 Firebase Admin initialized from Environment Variables");

  } 
  // 2. Try Local File (Development)
  else {
    const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");
    if (fs.existsSync(serviceAccountPath)) {
        serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("🔥 Firebase Admin initialized from local file");
    } else {
        console.warn("⚠️ No credentials found! Backend features (saving) will NOT work.");
        // Initialize with default/null so app doesn't crash on require
        // But db calls will fail.
    }
  }

  // Initialize services if app is initialized
  if (admin.apps.length > 0) {
    db = admin.firestore();
    auth = admin.auth();
  } else {
    // Prevent crash if db is imported
    db = { collection: () => { throw new Error("DB not initialized"); } };
  }

} catch (error) {
  console.error("⚠️ Firebase Admin Init Error:", error.message);
}

module.exports = { admin, db, auth };
