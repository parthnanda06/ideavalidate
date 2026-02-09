const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
// const connectDB = require("./config/database"); // MongoDB removed
require("./config/firebase"); // Initialize Firebase
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB - REMOVED for Firebase migration
// connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use("/api/validate", require("./routes/validate"));
// app.use("/api/auth", require("./routes/auth")); // Removed for Firebase migration
app.use("/api/validations", require("./routes/validations.js")); // Explicit extension

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "AI Startup Validator API is running" });
});

// Serve Firebase Config to Frontend
app.get("/api/config", (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
  });
});

// Fallback for SPA (Single Page Application)
// Matches any route that hasn't been handled by the above routes/static files
app.get('*', (req, res, next) => {
    // If it's an API request that wasn't matched, let it fall through to 404 handler
    if (req.path.startsWith('/api')) {
        return next();
    }
    // Otherwise serve index.html
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// 404 handler (for API routes not found)
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`👉 App running at: http://localhost:${PORT}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;
