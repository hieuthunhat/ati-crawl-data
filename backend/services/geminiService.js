import { GoogleGenerativeAI } from '@google/generative-ai';
import aiConfig from '../config/ai-config.js';

let genAI = null;
let model = null;

/**
 * Initialize Gemini AI
 */
export const initializeGemini = () => {
  if (!aiConfig.gemini.apiKey) {
    console.warn('Gemini API key not configured - AI evaluation disabled');
    return null;
  }

  if (!genAI) {
    try {
      genAI = new GoogleGenerativeAI(aiConfig.gemini.apiKey);
      model = genAI.getGenerativeModel({ 
        model: aiConfig.gemini.model,
        generationConfig: {
          temperature: aiConfig.gemini.temperature,
          maxOutputTokens: aiConfig.gemini.maxTokens,
        },
      });
      console.log('Gemini AI initialized');
    } catch (error) {
      console.error('Gemini initialization failed:', error.message);
      return null;
    }
  }
  return model;
};

/**
 * Build evaluation prompt for Gemini
 */
const buildEvaluationPrompt = (products, criteria) => {
  const {
    weights = aiConfig.defaultWeights,
    thresholds = aiConfig.defaultThresholds,
  } = criteria;

  const formattedProducts = products.map((p, i) => {
    const price = p.price || 0;
    const originalPrice = p.original_price || p.list_price || price;
    const discount = p.discount_rate || ((originalPrice - price) / originalPrice * 100);
    const rating = p.rating_average || p.rating || 0;
    const reviews = p.review_count || p.reviews || 0;
    const seller = p.seller?.name || p.current_seller?.name || 'N/A';
    const sold = p.quantity_sold?.text || p.all_time_quantity_sold || 'N/A';

    return `
Product ${i + 1}:
- ID: ${p.id || p._id}
- Name: ${p.name || p.title}
- Price: ${price.toLocaleString()} VND
- Original Price: ${originalPrice.toLocaleString()} VND
- Discount: ${discount.toFixed(1)}%
- Rating: ${rating}/5 (${reviews} reviews)
- Seller: ${seller}
- Quantity Sold: ${sold}
- URL: ${p.url_path || p.short_url || 'N/A'}
    `.trim();
  }).join('\n\n');

  return `
You are a professional Vietnamese e-commerce product analyst specializing in dropshipping for Shopify merchants.

EVALUATION CRITERIA:
- Profit Potential Weight: ${(weights.profitWeight * 100).toFixed(0)}%
- Review Quality Weight: ${(weights.reviewWeight * 100).toFixed(0)}%
- Market Trend Weight: ${(weights.trendWeight * 100).toFixed(0)}%

QUALITY THRESHOLDS:
- Minimum Rating: ${thresholds.minReviewScore}/5 stars
- Minimum Reviews: ${thresholds.minReviewCount}
- Minimum Profit Margin: ${(thresholds.minProfitMargin * 100)}%
- Minimum Final Score: ${(thresholds.minFinalScore * 100)}%

PRICING STRATEGY:
- Products 1-50k VND: 20% markup
- Products 51-200k VND: 30% markup  
- Products 201k+ VND: 40% markup
- Shopify fees: 2.9% + $0.30 per transaction

PRODUCTS TO EVALUATE (${products.length} total):
${formattedProducts}

TASK:
Evaluate each product for dropshipping potential. Calculate profit margins after Shopify fees.
Rank products by final score (profit × ${weights.profitWeight} + reviews × ${weights.reviewWeight} + trend × ${weights.trendWeight}).

Return ONLY valid JSON (no markdown, no explanations):

{
  "evaluatedProducts": [
    {
      "productId": number,
      "productName": string,
      "rank": number,
      "scores": {
        "profitScore": number (0-1),
        "reviewScore": number (0-1),
        "trendScore": number (0-1),
        "finalScore": number (0-1)
      },
      "pricing": {
        "costPrice": number,
        "suggestedSellingPrice": number,
        "shopifyFee": number,
        "netProfit": number,
        "profitMargin": number (percentage)
      },
      "analysis": {
        "strengths": [string, string],
        "weaknesses": [string, string],
        "riskLevel": "low" | "medium" | "high",
        "recommendation": string (1-2 sentences)
      }
    }
  ],
  "summary": {
    "totalEvaluated": number,
    "totalRecommended": number,
    "averageScore": number,
    "averageProfitMargin": number,
    "priceRange": {"min": number, "max": number},
    "topCategory": string,
    "marketInsights": [string, string, string]
  }
}

Only return the JSON object. No markdown code blocks.
  `.trim();
};

/**
 * Evaluate products with Gemini AI
 */
export const evaluateProducts = async (products, criteria = {}) => {
  try {
    const aiModel = initializeGemini();
    
    if (!aiModel) {
      throw new Error('Gemini AI not initialized - check GEMINI_API_KEY in .env');
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      throw new Error('Products array is required and must not be empty');
    }

    console.log(`Evaluating ${products.length} products with Gemini AI...`);
    
    const prompt = buildEvaluationPrompt(products, criteria);
    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean response (remove markdown if present)
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse JSON
    const evaluation = JSON.parse(text);
    
    const evaluatedCount = evaluation.evaluatedProducts?.length || 0;
    console.log(`Gemini evaluation complete: ${evaluatedCount} products analyzed`);

    return {
      success: true,
      evaluation,
      metadata: {
        timestamp: new Date().toISOString(),
        productsEvaluated: products.length,
        criteria,
        model: aiConfig.gemini.model,
      },
    };
  } catch (error) {
    console.error('Gemini evaluation error:', error.message);
    
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse AI response - invalid JSON format');
    }
    
    throw error;
  }
};

/**
 * Check if Gemini is available
 */
export const isGeminiAvailable = () => {
  return !!aiConfig.gemini.apiKey;
};

export default {
  initializeGemini,
  evaluateProducts,
  isGeminiAvailable,
};
