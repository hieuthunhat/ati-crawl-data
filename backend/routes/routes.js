import express from "express";
import { getProductsData, getEvaluationByIdController } from "../controllers/controllers.js";
import { batchCreateProducts } from "../controllers/shopifyController.js";

const router = express.Router();

router.post("/crawledProducts", getProductsData);

router.get("/evaluations/:id", getEvaluationByIdController);

router.post("/products", batchCreateProducts);

export default router;