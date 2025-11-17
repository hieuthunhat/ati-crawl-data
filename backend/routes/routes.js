import express from "express";
import { getProductsData } from "../controllers/controllers.js";
import { batchCreateProducts } from "../controllers/shopifyController.js";

const router = express.Router();

router.post("/crawl-products", getProductsData);

router.post("/products", batchCreateProducts);

export default router;