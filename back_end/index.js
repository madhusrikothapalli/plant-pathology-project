require("dotenv").config();

const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const predictionRoutes = require("./routes/prediction_route");

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  const modelConfigured = Boolean(process.env.PLANT_MODEL_URL);

  res.status(databaseConnected && modelConfigured ? 200 : 503).json({
    status: databaseConnected && modelConfigured ? "ok" : "degraded",
    database: databaseConnected ? "connected" : "disconnected",
    model: modelConfigured ? "configured" : "not_configured",
  });
});

app.use("/api", predictionRoutes);

app.use((_req, res) => {
  res.status(404).json({ detail: "API endpoint not found." });
});

app.use((err, _req, res, _next) => {
  if (err.name === "MulterError") {
    return res.status(err.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
      detail:
        err.code === "LIMIT_FILE_SIZE"
          ? "Image must be 10 MB or smaller."
          : err.message,
    });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({ detail: err.message });
  }

  console.error("Unhandled API error:", err);
  return res.status(500).json({ detail: "An unexpected server error occurred." });
});

const mongoUri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/plant_pathology";

mongoose
  .connect(mongoUri)
  .then(() => console.log("Connected to MongoDB."))
  .catch((error) => {
    console.error(`MongoDB connection failed: ${error.message}`);
  });

mongoose.connection.on("disconnected", () => {
  console.error("MongoDB connection lost.");
});

app.listen(port, () => {
  console.log(`Plant Pathology API listening on http://localhost:${port}`);
});
