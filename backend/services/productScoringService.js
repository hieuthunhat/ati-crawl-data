import aiConfig from '../config/ai-config.js';


//Calculate selling price based on cost price
export const calculateSellingPrice = (costPrice) => {
  const tiers = aiConfig.priceTiers;
  let markup = 0.20; // Default 20%

  if (costPrice >= tiers.tier1.min && costPrice <= tiers.tier1.max) {
    markup = tiers.tier1.markup;
  } else if (costPrice >= tiers.tier2.min && costPrice <= tiers.tier2.max) {
    markup = tiers.tier2.markup;
  } else if (costPrice >= tiers.tier3.min) {
    markup = tiers.tier3.markup;
  }

  return costPrice * (1 + markup);
};

// Calculate Shopify fees
export const calculateShopifyFees = (sellingPrice) => {
  const fees = aiConfig.fees;
  return (sellingPrice * fees.shopifyTransactionFee) + fees.shopifyFixedFee;
};
 
// Calculate profit
export const calculateProfit = (costPrice, sellingPrice, shippingFee = 0) => {
  const shopifyFee = calculateShopifyFees(sellingPrice);
  const totalCost = costPrice + shopifyFee + shippingFee;
  const netProfit = sellingPrice - totalCost;
  const profitMargin = (netProfit / sellingPrice) * 100;

  return {
    sellingPrice,
    shopifyFee,
    shippingFee,
    totalCost,
    netProfit,
    profitMargin,
  };
};

// Calculate profit score (0-1)
export const calculateProfitScore = (profitMargin) => {
  const thresholds = aiConfig.defaultThresholds;
  const minMargin = thresholds.minProfitMargin * 100; // Convert to percentage
  const targetMargin = 40; // 40% is ideal

  if (profitMargin < minMargin) return 0;
  if (profitMargin >= targetMargin) return 1;

  return (profitMargin - minMargin) / (targetMargin - minMargin);
};

// Calculate review score (0-1)
export const calculateReviewScore = (rating, reviewCount) => {
  const thresholds = aiConfig.defaultThresholds;
  
  if (reviewCount < thresholds.minReviewCount) return 0;
  if (rating < thresholds.minReviewScore) return 0;

  const ratingScore = rating / 5;
  const reviewBonus = Math.min(Math.log10(reviewCount) / 2, 0.2);

  return Math.min(ratingScore + reviewBonus, 1);
};

// Calculate trend score (0-1)
export const calculateTrendScore = (product) => {
  let score = 0;

  const discount = product.discount_rate || 0;
  const sold = parseInt(product.quantity_sold?.value || product.all_time_quantity_sold || 0);

  // High discount = high demand
  if (discount >= 30) score += 0.3;
  else if (discount >= 20) score += 0.2;
  else if (discount >= 10) score += 0.1;

  // High sales volume
  if (sold >= 1000) score += 0.4;
  else if (sold >= 500) score += 0.3;
  else if (sold >= 100) score += 0.2;

  // Badges
  if (product.badges?.includes('best_seller')) score += 0.2;
  if (product.badges?.includes('new_arrival')) score += 0.1;

  return Math.min(score, 1);
};

/**
 * Calculate final score
 */
export const calculateFinalScore = (profitScore, reviewScore, trendScore, weights) => {
  const w = weights || aiConfig.defaultWeights;
  
  return (
    (profitScore * w.profitWeight) +
    (reviewScore * w.reviewWeight) +
    (trendScore * w.trendWeight)
  );
};

/**
 * Score a single product
 */
export const scoreProduct = (product, criteria = {}) => {
  const weights = criteria.weights || aiConfig.defaultWeights;
  const thresholds = criteria.thresholds || aiConfig.defaultThresholds;

  // Extract product data - handle both Tiki and eBay/Chotot field names
  const costPrice = product.price || 0;
  const rating = product.rating_average || product.rating || 0;
  const reviewCount = product.review_count || product.reviewCount || 0;

  // Calculate pricing
  const sellingPrice = calculateSellingPrice(costPrice);
  const profit = calculateProfit(costPrice, sellingPrice);

  // Calculate scores
  const profitScore = calculateProfitScore(profit.profitMargin);
  const reviewScore = calculateReviewScore(rating, reviewCount);
  const trendScore = calculateTrendScore(product);
  const finalScore = calculateFinalScore(profitScore, reviewScore, trendScore, weights);

  // Check if meets thresholds
  // For products with reviews: require minimum rating and review count
  // For products without reviews: only check profit margin and final score
  const hasReviews = reviewCount > 0;
  const meetsReviewThresholds = hasReviews 
    ? (rating >= thresholds.minReviewScore && reviewCount >= thresholds.minReviewCount)
    : true; // Allow products without reviews if other criteria are met
    
  const meetsThresholds = 
    meetsReviewThresholds &&
    profit.profitMargin >= (thresholds.minProfitMargin * 100) &&
    finalScore >= thresholds.minFinalScore;

  // Generate productId if missing (for eBay/Chotot products)
  const productId = product.id || 
                    (product.link ? product.link.split('/').pop() : null) ||
                    `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const productName = product.name || product.title || 'Unknown Product';

  return {
    productId,
    productName,
    costPrice,
    sellingPrice: profit.sellingPrice,
    netProfit: profit.netProfit,
    profitMargin: profit.profitMargin,
    scores: {
      profitScore,
      reviewScore,
      trendScore,
      finalScore,
    },
    meetsThresholds,
    rating,
    reviewCount,
  };
};

/**
 * Score multiple products
 */
export const scoreProducts = (products, criteria = {}) => {
  console.log(`Scoring ${products.length} products...`);
  
  // Debug: Show sample product data
  if (products.length > 0) {
    const sample = products[0];
    console.log('Sample product fields:', {
      hasRatingAverage: !!sample.rating_average,
      hasRating: !!sample.rating,
      hasReviewCount: !!sample.review_count,
      hasReviewCountAlt: !!sample.reviewCount,
      price: sample.price,
      name: sample.name || sample.title
    });
  }

  const scored = products
    .map(p => scoreProduct(p, criteria))
    .filter(p => p.meetsThresholds)
    .sort((a, b) => b.scores.finalScore - a.scores.finalScore);

  console.log(`${scored.length}/${products.length} products meet criteria`);
  
  // Debug: Show why products failed (first 3)
  if (scored.length === 0 && products.length > 0) {
    console.log('\n⚠️ DEBUG: First 3 products and why they failed:');
    products.slice(0, 3).forEach((p, i) => {
      const result = scoreProduct(p, criteria);
      const thresholds = criteria.thresholds || aiConfig.defaultThresholds;
      console.log(`\nProduct ${i + 1}: ${result.productName?.substring(0, 40) || 'N/A'}`);
      console.log('  Rating:', result.rating, '(need ≥', thresholds.minReviewScore + ')');
      console.log('  Reviews:', result.reviewCount, '(need ≥', thresholds.minReviewCount + ')');
      console.log('  Profit Margin:', result.profitMargin.toFixed(2) + '%', '(need ≥', (thresholds.minProfitMargin * 100) + '%)');
      console.log('  Final Score:', result.scores.finalScore.toFixed(2), '(need ≥', thresholds.minFinalScore + ')');
      console.log('  Failed because:', 
        result.rating < thresholds.minReviewScore ? '❌ Low rating' : '',
        result.reviewCount < thresholds.minReviewCount ? '❌ Low review count' : '',
        result.profitMargin < (thresholds.minProfitMargin * 100) ? '❌ Low profit' : '',
        result.scores.finalScore < thresholds.minFinalScore ? '❌ Low final score' : ''
      );
    });
    console.log('\n💡 TIP: Lower thresholds in ai-config.js or pass custom criteria\n');
  }

  return scored;
};

export default {
  calculateSellingPrice,
  calculateShopifyFees,
  calculateProfit,
  scoreProduct,
  scoreProducts,
};
