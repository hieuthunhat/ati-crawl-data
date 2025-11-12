import Shopify from "shopify-api-node"

const shopify = new Shopify({
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
    shopName: process.env.SHOPIFY_DOMAIN,
})

export const createShopifyProduct = ({product, shopifyDomain}) => {
    return shopify.product.create(product)
}