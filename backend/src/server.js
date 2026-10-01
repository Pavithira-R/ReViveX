const express = require("express");
const cors = require("cors");
require("dotenv").config();

const reuseRecycleRoutes = require("./routes/reuseRecycleRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Home / health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ReViveX backend is running",
    version: "1.0.0"
  });
});

// API routes
app.use("/api", reuseRecycleRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Start server
app.listen(PORT, () => {
  console.log("=================================");
  console.log("ReViveX Backend Started");
  console.log(`Server: http://localhost:${PORT}`);
  console.log("=================================");
});