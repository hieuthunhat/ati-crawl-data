import Shopify from "shopify-api-node"

/**
 * Create a Shopify product with dynamic credentials
 * @param {Object} product - Product data to create
 * @param {string} shopDomain - Shopify store domain (e.g., 'my-store.myshopify.com')
 * @param {string} accessToken - Shopify Admin API access token
 * @returns {Promise} Shopify product creation result
 */
export const createShopifyProduct = async (product, shopDomain, accessToken) => {
    if (!shopDomain || !accessToken) {
        throw new Error('Shopify credentials (shopDomain and accessToken) are required');
    }

    if (!product) {
        throw new Error('Product data is required');
    }

    try {
        // Create Shopify instance with provided credentials
        const shopify = new Shopify({
            shopName: shopDomain.replace('.myshopify.com', ''), // Remove .myshopify.com if included
            accessToken: accessToken,
            apiVersion: '2024-01'
        });

        // Transform product data to Shopify format
        const shopifyProduct = {
            title: product.name || product.title,
            body_html: product.description || '',
            vendor: product.vendor || 'Unknown',
            product_type: product.product_type || 'General',
            variants: [
                {
                    price: product.price?.toString() || '0',
                    sku: product.id?.toString() || '',
                    inventory_quantity: product.inventory || 0,
                }
            ],
            images: product.imageUrl ? [{ src: product.imageUrl }] : []
        };

        // Add tags if available
        if (product.avgRating) {
            shopifyProduct.tags = `rating:${product.avgRating}`;
        }

        console.log(`Creating product in Shopify: ${shopifyProduct.title}`);
        const result = await shopify.product.create(shopifyProduct);
        
        return result;
    } catch (error) {
        console.error('Shopify product creation error:', error.message);
        throw new Error(`Failed to create product in Shopify: ${error.message}`);
    }
}