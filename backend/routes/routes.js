import express from "express";
import { getProductsData } from "../controllers/controllers.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Chào mừng đến với API Scrape Chotot!");
});

router.post("/crawledProducts", getProductsData);

export default router;