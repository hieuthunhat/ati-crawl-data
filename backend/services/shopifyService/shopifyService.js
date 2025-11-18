import Shopify from "shopify-api-node"

export const createShopifyProduct = async (shopify, product, locationId) => {
    try {
        const inventoryQuantity = product.inventoryQuantity || 100;
        const priceFormatted = product.price ? (product.price / 1000).toFixed(2) : "0.00";

        let bodyHtml = `<p>${product.name || product.title}</p>`;
        
        if (product.avgRating || product.rating_average || product.rating) {
            const rating = product.avgRating || product.rating_average || product.rating;
            const reviewCount = product.ratingNum || product.review_count || product.reviewCount || 0;
            bodyHtml += `<p>⭐ Rating: ${rating}/5 (${reviewCount} reviews)</p>`;
        }
        
        if (product.url) {
            bodyHtml += `<p>🔗 <a href="${product.url}" target="_blank">View Original Product</a></p>`;
        }

        const imageUrl = product.imageUrl || product.thumbnail_url || product.image;

        let sku = '';
        const productIdStr = product.id?.toString() || '';
        
        if (productIdStr.length > 0 && productIdStr.length <= 200) {
            sku = `SKU-${productIdStr}`;
        } else if (productIdStr.length > 200) {
            const hash = productIdStr.split('').reduce((acc, char) => {
                return ((acc << 5) - acc) + char.charCodeAt(0);
            }, 0);
            sku = `SKU-${Math.abs(hash)}-${Date.now()}`;
        } else {
            sku = `SKU-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        }
        
        if (sku.length > 255) {
            sku = sku.substring(0, 255);
        }

        const mutation = `
            mutation CreateProductWithLocation(
                $title: String!,
                $bodyHtml: String,
                $locationId: ID!,
                $quantity: Int!,
                $price: Money!,
                $sku: String
            ) {
                productSet(
                    synchronous: true
                    input: {
                        title: $title
                        descriptionHtml: $bodyHtml
                        productOptions: [{
                            name: "Title"
                            position: 1
                            values: [{
                                name: "Default Title"
                            }]
                        }]
                        variants: [{
                            price: $price
                            sku: $sku
                            optionValues: [{
                                optionName: "Title"
                                name: "Default Title"
                            }]
                            inventoryQuantities: [{
                                locationId: $locationId
                                name: "available"
                                quantity: $quantity
                            }]
                        }]
                    }
                ) {
                    product {
                        id
                        title
                        handle
                        variants(first: 1) {
                            edges {
                                node {
                                    id
                                    price
                                    sku
                                    inventoryQuantity
                                }
                            }
                        }
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        const variables = {
            title: product.name || product.title || 'Untitled Product',
            bodyHtml: bodyHtml,
            locationId: locationId,
            quantity: inventoryQuantity,
            price: priceFormatted,  // Just the amount as string, no currencyCode object
            sku: sku  // Use the generated short SKU
        };

        console.log(`Creating Shopify product: ${variables.title} (Price: ${priceFormatted}, Stock: ${inventoryQuantity}, SKU: ${sku})`);

        const result = await shopify.graphql(mutation, variables);

        if (result.productSet?.userErrors && result.productSet.userErrors.length > 0) {
            const errors = result.productSet.userErrors.map(e => `${e.field}: ${e.message}`).join(', ');
            throw new Error(`Shopify API errors: ${errors}`);
        }

        const createdProduct = result.productSet?.product;
        
        if (!createdProduct) {
            throw new Error('Product creation failed: No product returned');
        }

        if (imageUrl) {
            try {
                const productId = createdProduct.id.replace('gid://shopify/Product/', '');
                
                await shopify.productImage.create(productId, {
                    src: imageUrl
                });
                console.log(`✓ Image added for product: ${createdProduct.title}`);
            } catch (imgError) {
                console.warn(`⚠ Failed to add image: ${imgError.message}`);
            }
        }

        console.log(`✓ Product created successfully: ${createdProduct.title} (ID: ${createdProduct.id})`);
        
        return {
            id: createdProduct.id,
            title: createdProduct.title,
            handle: createdProduct.handle,
            variant: createdProduct.variants?.edges[0]?.node
        };
    } catch (error) {
        console.error('Shopify product creation error:', error.message);
        throw error;
    }
}