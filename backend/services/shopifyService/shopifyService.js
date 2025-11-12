import Shopify from "shopify-api-node"

// Initialize Shopify only if credentials are available
let shopify = null;

const initializeShopify = () => {
    if (!shopify && process.env.SHOPIFY_ACCESS_TOKEN && process.env.SHOPIFY_DOMAIN) {
        try {
            shopify = new Shopify({
                accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
                shopName: process.env.SHOPIFY_DOMAIN,
            });
            console.log('Shopify service initialized');
        } catch (error) {
            console.warn('Shopify service initialization failed:', error.message);
        }
    }
    return shopify;
};

export const createShopifyProduct = ({product, shopifyDomain}) => {
    const shopifyInstance = initializeShopify();
    
    if (!shopifyInstance) {
        throw new Error('Shopify service not configured. Please set SHOPIFY_ACCESS_TOKEN and SHOPIFY_DOMAIN in .env');
    }
    
    return shopifyInstance.product.create(product);
}