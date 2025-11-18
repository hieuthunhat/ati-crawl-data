export const transformToSimplifiedFormat = (evaluationData) => {
  if (
    !evaluationData.scoredProducts ||
    evaluationData.scoredProducts.length === 0
  ) {
    return [];
  }

  const scrapedProductsMap = new Map();
  if (evaluationData.scrapedProducts) {
    evaluationData.scrapedProducts.forEach((p) => {
      const id = p.id || p.productId || p.name || p.title;
      if (id) scrapedProductsMap.set(String(id), p);
    });
  }

  return evaluationData.scoredProducts
    .filter((scoredProduct) => scoredProduct.meetsThresholds === true)
    .map((scoredProduct, index) => {
      const originalProduct =
        scrapedProductsMap.get(String(scoredProduct.productId)) || {};

      const price = scoredProduct.sellingPrice || scoredProduct.costPrice || 0;

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
