const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const Prediction = require("../models/Prediction");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error("Please upload a JPG, PNG, or WebP image.");
      error.statusCode = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

function isValidAssessment(data) {
  return (
    data &&
    typeof data.name === "string" &&
    typeof data.confidence === "number" &&
    Number.isFinite(data.confidence) &&
    data.confidence >= 0 &&
    data.confidence <= 100 &&
    typeof data.description === "string" &&
    typeof data.severity === "string" &&
    typeof data.treatment === "string" &&
    (data.alternatives === undefined ||
      (Array.isArray(data.alternatives) &&
        data.alternatives.every(
          (item) =>
            typeof item.name === "string" &&
            typeof item.confidence === "number" &&
            Number.isFinite(item.confidence) &&
            item.confidence >= 0 &&
            item.confidence <= 100,
        )))
  );
}

router.post("/predict", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: "Choose an image to analyze." });
    }
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        detail: "The database is unavailable. Check the MongoDB connection and try again.",
      });
    }

    const modelUrl = process.env.PLANT_MODEL_URL;
    if (!modelUrl) {
      return res.status(503).json({
        detail:
          "No plant disease model is configured. Set PLANT_MODEL_URL to an inference service before analyzing images.",
      });
    }

    const image = new Blob([req.file.buffer], { type: req.file.mimetype });
    const formData = new FormData();
    formData.append("file", image, req.file.originalname);
    const headers = {};
    if (process.env.PLANT_MODEL_API_KEY) {
      headers.Authorization = `Bearer ${process.env.PLANT_MODEL_API_KEY}`;
    }

    let modelResponse;
    try {
      modelResponse = await fetch(modelUrl, {
        method: "POST",
        headers,
        body: formData,
        signal: AbortSignal.timeout(30_000),
      });
    } catch (error) {
      console.error(`Plant model request failed: ${error.message}`);
      return res.status(502).json({
        detail: "The plant disease model could not be reached. Check its URL and try again.",
      });
    }

    if (!modelResponse.ok) {
      console.error(`Plant model returned HTTP ${modelResponse.status}.`);
      return res.status(502).json({
        detail: "The plant disease model returned an error. Check its configuration and try again.",
      });
    }

    let assessment;
    try {
      assessment = await modelResponse.json();
    } catch {
      return res.status(502).json({
        detail: "The plant disease model returned an invalid response.",
      });
    }

    if (!isValidAssessment(assessment)) {
      return res.status(502).json({
        detail:
          "The model response is incomplete. It must include name, confidence (0-100), description, severity, and treatment.",
      });
    }

    const prediction = await Prediction.create({
      ...assessment,
      alternatives: assessment.alternatives || [],
      imageName: req.file.originalname,
      imageType: req.file.mimetype,
    });

    return res.status(201).json({
      id: prediction.id,
      name: prediction.name,
      confidence: prediction.confidence,
      description: prediction.description,
      severity: prediction.severity,
      treatment: prediction.treatment,
      alternatives: prediction.alternatives,
      createdAt: prediction.createdAt,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/predictions", async (_req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        detail: "The database is unavailable. Check the MongoDB connection and try again.",
      });
    }

    const predictions = await Prediction.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select("name confidence severity imageName createdAt")
      .lean();

    return res.json(
      predictions.map((prediction) => ({
        id: prediction._id,
        name: prediction.name,
        confidence: prediction.confidence,
        severity: prediction.severity,
        imageName: prediction.imageName,
        createdAt: prediction.createdAt,
      })),
    );
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
