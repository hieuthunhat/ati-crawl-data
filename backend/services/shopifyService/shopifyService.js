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
            price: priceFormatted,
            sku: sku
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
 
        // Update inventory policy to CONTINUE (allow selling when out of stock)
        try {
            console.log(`Updating inventory policy for product: ${createdProduct.id}`);
           
            // Query product to get variant ID
            const productQuery = `
                query ProductWithVariants($productId: ID!) {
                    product(id: $productId) {
                        id
                        title
                        variants(first: 10) {
                            nodes {
                                id
                                title
                            }
                        }
                    }
                }
            `;
           
            const productQueryResult = await shopify.graphql(productQuery, {
                productId: createdProduct.id
            });
           
            const variantId = productQueryResult?.product?.variants?.nodes?.[0]?.id;
           
            if (variantId) {
                // Update variant with inventory policy CONTINUE using bulk update
                const updateVariantMutation = `
                    mutation UpdateVariantFully($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
                        productVariantsBulkUpdate(
                            productId: $productId
                            variants: $variants
                        ) {
                            product {
                                id
                            }
                            productVariants {
                                id
                                inventoryPolicy
                                price
                            }
                            userErrors {
                                field
                                message
                            }
                        }
                    }
                `;
               
                const updateResult = await shopify.graphql(updateVariantMutation, {
                    productId: createdProduct.id,
                    variants: [{
                        id: variantId,
                        inventoryPolicy: 'CONTINUE'
                    }]
                });
               
                if (updateResult.productVariantsBulkUpdate?.userErrors?.length > 0) {
                    const errors = updateResult.productVariantsBulkUpdate.userErrors
                        .map(e => `${e.field}: ${e.message}`).join(', ');
                    console.warn(`⚠ Failed to update variant: ${errors}`);
                } else {
                    console.log(`✓ Variant updated successfully with CONTINUE policy: ${variantId}`);
                }
            }
        } catch (policyError) {
            console.warn(`⚠ Failed to update variant: ${policyError.message}`);
            // Don't fail the whole operation if variant update fails
        }
 
        // Add image separately if available
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
 
        try {
            console.log(`Attempting to publish product: ${createdProduct.id}`);
           
            const publishMutation = `
                mutation publishProduct($id: ID!, $input: [PublicationInput!]!) {
                    publishablePublish(id: $id, input: $input) {
                        publishable {
                            resourcePublicationsCount {
                                count
                            }
                        }
                        userErrors {
                            field
                            message
                        }
                    }
                }
            `;
 
            // Get publications and find Online Store
            const publicationsQuery = `
                query getPublications {
                    publications(first: 10) {
                        edges {
                            node {
                                id
                                catalog {
                                    id
                                    title
                                }
                                name
                            }
                        }
                    }
                }
            `;
 
            const publicationsResult = await shopify.graphql(publicationsQuery);
            const publications = publicationsResult?.publications?.edges || [];
           
            if (publications.length === 0) {
                console.warn(`⚠ No publications available to publish product`);
                return;
            }
 
            // Find Online Store publication
            const onlineStorePublication = publications.find(pub =>
                pub.node.catalog?.title === 'Online Store' ||
                pub.node.name === 'Online Store'
            );
           
            if (!onlineStorePublication) {
                console.warn(`⚠ Online Store publication not found`);
                // Fallback to first publication
                const firstPublication = publications[0];
                console.log(`Using fallback publication: ${firstPublication.node.name}`);
               
                const publishResult = await shopify.graphql(publishMutation, {
                    id: createdProduct.id,
                    input: [{
                        publicationId: firstPublication.node.id
                    }]
                });
 
                if (publishResult.publishablePublish?.userErrors?.length > 0) {
                    const errors = publishResult.publishablePublish.userErrors
                        .map(e => `${e.field}: ${e.message}`).join(', ');
                    console.warn(`⚠ Failed to publish product: ${errors}`);
                } else {
                    const count = publishResult.publishablePublish?.publishable?.resourcePublicationsCount?.count || 0;
                    console.log(`✓ Product published successfully (${count} channels)`);
                }
                return;
            }
 
            console.log(`Found Online Store publication: ${onlineStorePublication.node.id}`);
 
            const publishResult = await shopify.graphql(publishMutation, {
                id: createdProduct.id,
                input: [{
                    publicationId: onlineStorePublication.node.id
                }]
            });
 
            console.log('Publish result:', JSON.stringify(publishResult, null, 2));
 
            if (publishResult.publishablePublish?.userErrors?.length > 0) {
                const errors = publishResult.publishablePublish.userErrors
                    .map(e => `${e.field}: ${e.message}`).join(', ');
                console.warn(`⚠ Failed to publish product: ${errors}`);
            } else {
                const count = publishResult.publishablePublish?.publishable?.resourcePublicationsCount?.count || 0;
                console.log(`✓ Product published to Online Store successfully (${count} channels)`);
            }
        } catch (publishError) {
            console.warn(`⚠ Failed to publish product: ${publishError.message}`);
            console.error('Publish error details:', publishError);
            // Don't fail the whole operation if publish fails
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