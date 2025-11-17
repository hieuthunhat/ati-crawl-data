export const transformToSimplifiedFormat = (evaluationData) => {
  if (
    !evaluationData.scoredProducts ||
    evaluationData.scoredProducts.length === 0
  ) {
    return [];
  }

  // Create a map of scraped products for quick lookup of additional data
  const scrapedProductsMap = new Map();
  if (evaluationData.scrapedProducts) {
    evaluationData.scrapedProducts.forEach((p) => {
      const id = p.id || p.productId || p.name || p.title;
      if (id) scrapedProductsMap.set(String(id), p);
    });
  }

  return evaluationData.scoredProducts
    .filter((scoredProduct) => scoredProduct.meetsThresholds === true) // Only scored products that passed quality checks
    .map((scoredProduct, index) => {
      // Get original scraped product for image and other details
      const originalProduct =
        scrapedProductsMap.get(String(scoredProduct.productId)) || {};

      // Use suggested selling price instead of cost price
      const price = scoredProduct.sellingPrice || scoredProduct.costPrice || 0;

      // Handle different image field names from original product
      const imageUrl =
        originalProduct.thumbnail_url ||
        originalProduct.image ||
        originalProduct.imageUrl ||
        "https://via.placeholder.com/150";

      return {
        id: String(scoredProduct.productId || `sp${index + 1}`),
        name: scoredProduct.productName || "Unknown Product",
        price: Math.round(Number(price)),
        avgRating: Number(scoredProduct.rating || 0),
        ratingNum: Number(scoredProduct.reviewCount || 0),
        imageUrl,
      };
    });
};
