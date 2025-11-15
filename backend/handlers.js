import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/routes.js";
import geminiService from './services/geminiService.js';
import './config/firebase-db.js';

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", router);

// Root endpoint with API documentation
app.get("/", (req, res) => {
  res.json({
    message: "Backend API with AI Evaluation",
    version: "2.0.0",
    endpoints: {
      crawling: {
        products: "POST /api/crawledProducts"
      }
    },
    documentation: "See README.md and API_DOCUMENTATION.md"
  });
});

// Initialize AI services on startup
try {
  geminiService.initializeGemini();
  console.log('AI services initialized');
} catch (error) {
  console.warn(' AI services initialization skipped:', error.message);
}

export default app;
