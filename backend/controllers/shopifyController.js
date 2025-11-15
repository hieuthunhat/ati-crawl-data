import { createShopifyProduct } from "../services/shopifyService/shopifyService.js";

/**
 * Batch create products to Shopify store
 * @param {*} req - Request with shopDomain, accessToken, and products array
 * @param {*} res - Response
 */
export const batchCreateProducts = async (req, res) => {
    try {
        const { shopDomain, accessToken, products } = req.body;

        // Validation
        if (!shopDomain || !accessToken) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: shopDomain and accessToken'
            });
        }

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Products array is required and must not be empty'
            });
        }

        console.log(`Creating ${products.length} products in Shopify store: ${shopDomain}`);

        const results = [];
        const errors = [];

        // Create products one by one
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            try {
                const result = await createShopifyProduct(product, shopDomain, accessToken);
                results.push({
                    index: i,
                    productId: product.id,
                    productName: product.name,
                    success: true,
                    shopifyProductId: result?.id
                });
                console.log(`✓ Created product ${i + 1}/${products.length}: ${product.name}`);
            } catch (error) {
                errors.push({
                    index: i,
                    productId: product.id,
                    productName: product.name,
                    error: error.message
                });
                console.error(`✗ Failed to create product ${i + 1}/${products.length}:`, error.message);
            }
        }

        // Return summary
        res.status(200).json({
            success: true,
            message: `Successfully created ${results.length} out of ${products.length} products`,
            summary: {
                total: products.length,
                successful: results.length,
                failed: errors.length
            },
            results,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Batch create products error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}