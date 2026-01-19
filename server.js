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

// Serve static files
app.use(express.static(path.join(__dirname)));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
// Routes
app.use("/api/validate", require("./routes/validate"));
// app.use("/api/auth", require("./routes/auth")); // Removed for Firebase migration
app.use("/api/validations", require("./routes/validations.js")); // Explicit extension

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "AI Startup Validator API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Fallback for SPA (if needed, though this is a single page app)
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`👉 App running at: http://localhost:${PORT}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;
