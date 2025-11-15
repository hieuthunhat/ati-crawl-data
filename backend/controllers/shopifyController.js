import { createShopifyProduct } from "../services/shopifyService/shopifyService.js";

/**
 * Expect an array of products in the request body to create them in batch.
 * @param {*} req 
 * @param {*} res 
 */
export const batchCreateProducts = async (req, res) => {
    try {
        // Maybe need to have shopify domain and access token in the request body too
        const { products } = req.body;
        for (const product of products) {
            await createShopifyProduct(product);
        }
    } catch (error) {
        
    }
}