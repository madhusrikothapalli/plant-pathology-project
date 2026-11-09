# Plant Pathology

Plant Pathology is a React frontend with an Express API and MongoDB-backed
assessment history.

## Requirements

- Node.js 20.19+ (or 22.12+)
- MongoDB running locally, or a MongoDB connection URI
- A plant disease inference service to perform image classification

**No trained plant-disease model is included in this repository.** The API
accepts JPG, PNG, and WebP images up to 10 MB, but returns an explicit error
until `PLANT_MODEL_URL` points to an inference service. The service must accept
a `multipart/form-data` POST with a `file` field and return JSON in this shape:

```json
{
  "name": "Example classification",
  "confidence": 92,
  "description": "Description of the assessment.",
  "severity": "Low",
  "treatment": "Recommended next step.",
  "alternatives": [
    { "name": "Another possibility", "confidence": 8 }
  ]
}
```

Confidence values must be between 0 and 100. The API stores successful
assessments and their image metadata in MongoDB; uploaded image bytes are not
stored.

## Configure and run

1. Start MongoDB. By default the backend connects to
   `mongodb://127.0.0.1:27017/plant_pathology`.
2. In a terminal, configure and start the backend:

   ```powershell
   cd back_end
   Copy-Item .env.example .env
   # Edit .env and set PLANT_MODEL_URL (and PLANT_MODEL_API_KEY if needed).
   npm install
   npm run dev
   ```

   To use MongoDB Atlas or another MongoDB server, set `MONGODB_URI` in
   `back_end/.env`. The backend listens on port 3000 by default.
3. In a second terminal, start the frontend:

   ```powershell
   cd front_end\plant-pathology_frontend
   npm install
   npm run dev
   ```

4. Open the local URL printed by Vite, usually `http://localhost:5173`.

The frontend's Vite development server proxies `/api` requests to port 3000.
For a separate frontend/API deployment, set `VITE_API_URL` to the API origin
and set `FRONTEND_ORIGIN` in the backend environment to the frontend origin.

## API

- `GET /api/health` reports database and model readiness.
- `POST /api/predict` analyzes an uploaded image in the `file` field and saves
  a successful assessment.
- `GET /api/predictions` returns the 20 most recent saved assessments.
