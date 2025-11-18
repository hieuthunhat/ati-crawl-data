import Shopify from "shopify-api-node";
import { createShopifyProduct } from "../services/shopifyService/shopifyService.js";

export const batchCreateProducts = async (req, res) => {
  try {
    const { shopDomain, accessToken, products } = req.body;
    console.log("Received batch create products request:", {
      shopDomain,
      accessToken: accessToken ? "***" : "missing",
      productsCount: products ? products.length : 0,
    });
    
    // Log first and last product to verify full array received
    if (products && products.length > 0) {
      console.log("First product:", products[0].name);
      console.log("Last product:", products[products.length - 1].name);
    }

    if (!shopDomain || !accessToken) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: shopDomain and accessToken",
      });
    }

    const cleanAccessToken = accessToken.toString().trim().replace(/[\r\n\t]/g, '');
    
    if (!cleanAccessToken || cleanAccessToken.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Invalid access token format. Please check your token.",
      });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Products array is required and must not be empty",
      });
    }

    let cleanShopName = shopDomain
      .replace(/^https?:\/\//, '')  // Remove http:// or https://
      .replace(/\/$/, '')            // Remove trailing slash
      .replace('.myshopify.com', ''); // Remove .myshopify.com
    
    console.log(`Connecting to Shopify: ${cleanShopName}.myshopify.com`);
    
    const shopify = new Shopify({
      shopName: cleanShopName,
      accessToken: cleanAccessToken,  // Use cleaned token
    });

    console.log("Fetching Shopify location...");
    const locationQuery = `query GetLocations {
      locations(first: 1) {
        edges {
          node {
            id
            name
            address {
              address1
            }
          }
        }
      }
    }`;

    const locationResult = await shopify.graphql(locationQuery);
    const locationId = locationResult?.locations?.edges[0]?.node?.id;

    if (!locationId) {
      return res.status(400).json({
        success: false,
        message: "Failed to get Shopify location. Please ensure your access token has 'read_locations' scope.",
      });
    }

    console.log(`Using location: ${locationId}`);

    const results = [];
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      try {
        console.log(`Creating product ${i + 1}/${products.length}: ${product.name}`);
        
        const result = await createShopifyProduct(
          shopify,
          product,
          locationId
        );
        
        results.push({
          index: i,
          productId: product.id,
          productName: product.name,
          inventoryQuantity: product.inventoryQuantity || 100,
          success: true,
          shopifyProductId: result?.id,
          shopifyHandle: result?.handle,
        });
        
        console.log(`✓ Created product ${i + 1}/${products.length}: ${product.name}`);
      } catch (error) {
        errors.push({
          index: i,
          productId: product.id,
          productName: product.name,
          error: error.message,
        });
        console.error(`✗ Failed to create product ${i + 1}/${products.length}:`, error.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully created ${results.length} out of ${products.length} products`,
      summary: {
        total: products.length,
        successful: results.length,
        failed: errors.length,
      },
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Batch create products error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
