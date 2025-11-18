/**
 * Test script to verify Shopify product publish functionality
 * 
 * Usage:
 * node test-publish.js <shop-domain> <access-token> <product-id>
 * 
 * Example:
 * node test-publish.js mystore shpat_xxxxx gid://shopify/Product/123456789
 */

import Shopify from 'shopify-api-node';

const [shopDomain, accessToken, productId] = process.argv.slice(2);

if (!shopDomain || !accessToken || !productId) {
  console.error('Usage: node test-publish.js <shop-domain> <access-token> <product-id>');
  console.error('Example: node test-publish.js mystore shpat_xxxxx gid://shopify/Product/123456789');
  process.exit(1);
}

const shopify = new Shopify({
  shopName: shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').replace('.myshopify.com', ''),
  accessToken: accessToken.trim()
});

async function testPublish() {
  try {
    console.log('🔍 Step 1: Querying available publications...');
    
    const publicationsQuery = `
      query {
        publications(first: 10) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    `;

    const publicationsResult = await shopify.graphql(publicationsQuery);
    const publications = publicationsResult?.publications?.edges || [];
    
    console.log(`✓ Found ${publications.length} publication(s):`);
    publications.forEach((pub, i) => {
      console.log(`  ${i + 1}. ${pub.node.name} (${pub.node.id})`);
    });

    if (publications.length === 0) {
      console.error('❌ No publications available! Check your access token permissions.');
      process.exit(1);
    }

    console.log('\n📤 Step 2: Publishing product to all channels...');
    
    const publishMutation = `
      mutation productPublish($id: ID!, $input: [PublicationInput!]!) {
        productPublish(id: $id, input: $input) {
          product {
            id
            title
          }
          productPublications {
            publication {
              id
              name
            }
            publishDate
            isPublished
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const publicationInputs = publications.map(pub => ({
      publicationId: pub.node.id
    }));

    const publishResult = await shopify.graphql(publishMutation, {
      id: productId,
      input: publicationInputs
    });

    console.log('\n📊 Publish Result:');
    console.log(JSON.stringify(publishResult, null, 2));

    if (publishResult.productPublish?.userErrors?.length > 0) {
      console.error('\n❌ Publish failed with errors:');
      publishResult.productPublish.userErrors.forEach(err => {
        console.error(`  - ${err.field}: ${err.message}`);
      });
      process.exit(1);
    }

    console.log('\n✅ Product published successfully!');
    console.log(`Product: ${publishResult.productPublish.product.title}`);
    console.log(`Channels: ${publishResult.productPublish.productPublications.length}`);
    
    publishResult.productPublish.productPublications.forEach((pub, i) => {
      console.log(`  ${i + 1}. ${pub.publication.name} - Published: ${pub.isPublished} (${pub.publishDate})`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

testPublish();
