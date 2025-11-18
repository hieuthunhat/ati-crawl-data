import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/routes.js";
import geminiService from './services/evaluation/geminiService.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/api", router);

app.get("/", (req, res) => {
  res.json({
    message: "Backend API with AI Evaluation",
    version: "2.0.0",
    endpoints: {
      crawling: {
        products: "POST /api/crawl-products"
      }
    },
    documentation: "See README.md and API_DOCUMENTATION.md"
  });
});

try {
  geminiService.initializeGemini();
  console.log('AI services initialized');
} catch (error) {
  console.warn(' AI services initialization skipped:', error.message);
}

export default app;
