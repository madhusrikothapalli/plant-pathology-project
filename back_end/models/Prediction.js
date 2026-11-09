const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    description: { type: String, required: true },
    severity: { type: String, required: true },
    treatment: { type: String, required: true },
    alternatives: {
      type: [
        {
          name: { type: String, required: true },
          confidence: { type: Number, required: true, min: 0, max: 100 },
        },
      ],
      default: [],
    },
    imageName: { type: String, required: true },
    imageType: { type: String, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Prediction", predictionSchema);
