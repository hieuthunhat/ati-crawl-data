import { scrapeEbayWithPuppeteer } from "../services/eBay/ebayScrapeService.js";
import {
  getCategoryByText,
  scrapeChototWithPuppeteer,
} from "../services/Chotot/chototScrapeService.js";
import { scrapeTikiWithAPI } from "../services/Tiki/tikiScrapeService.js";
import geminiService from "../services/geminiService.js";
import scoringService from "../services/productScoringService.js";
import { getEvaluationById } from "../config/firebase-db.js"; // Keep only for GET endpoint
import aiConfig from "../config/ai-config.js";

/**
 * Transform evaluation data to simplified format
 * Converts complex evaluation structure to simple product array
 * Uses suggested selling price from AI scoring
 * Only returns products that passed quality thresholds
 */
const transformToSimplifiedFormat = (evaluationData) => {
  if (!evaluationData.scoredProducts || evaluationData.scoredProducts.length === 0) {
    return [];
  }

  // Create a map of scraped products for quick lookup of additional data
  const scrapedProductsMap = new Map();
  if (evaluationData.scrapedProducts) {
    evaluationData.scrapedProducts.forEach(p => {
      const id = p.id || p.productId || (p.name || p.title);
      if (id) scrapedProductsMap.set(String(id), p);
    });
  }

  return evaluationData.scoredProducts
    .filter(scoredProduct => scoredProduct.meetsThresholds === true) // Only scored products that passed quality checks
    .map((scoredProduct, index) => {
      // Get original scraped product for image and other details
      const originalProduct = scrapedProductsMap.get(String(scoredProduct.productId)) || {};
      
      // Use suggested selling price instead of cost price
      const price = scoredProduct.sellingPrice || scoredProduct.costPrice || 0;
      
      // Handle different image field names from original product
      const imageUrl = originalProduct.thumbnail_url || 
                       originalProduct.image || 
                       originalProduct.imageUrl || 
                       'https://via.placeholder.com/150';

      return {
        id: String(scoredProduct.productId || `sp${index + 1}`),
        name: scoredProduct.productName || 'Unknown Product',
        price: Math.round(Number(price)),
        avgRating: Number(scoredProduct.rating || 0),
        ratingNum: Number(scoredProduct.reviewCount || 0),
        imageUrl,
      };
    });
};


export const getProductsData = async (req, res) => {
  const { 
    productName, 
    platform,
    // AI evaluation parameters (optional)
    criteria = {},
    // Optional metadata for tracking
    userId,
    sessionId,
  } = req.body;
  
  try {
    let scrapedProducts = [];
    
    //Scrape products based on platform
    console.log(`\nStarting ${platform} scraping for: ${productName}`);
    
    switch (platform) {
      case "ebay":
        scrapedProducts = await scrapeEbayWithPuppeteer({
          keyword: productName,
          pages: 3,
        });
        break;
      case "chotot":
        const category = getCategoryByText(productName);
        scrapedProducts = await scrapeChototWithPuppeteer({ category });
        break;
      case "tiki":
        scrapedProducts = await scrapeTikiWithAPI({ keyword: productName, pages: 3 });
        break;
      default:
        throw new Error("Unsupported platform");
    }

    console.log(`Scraping completed: ${scrapedProducts.length} products found`);

    //Automatic AI Evaluation
    let aiEvaluationResult = null;
    
    if (scrapedProducts.length > 0) {
      try {
        console.log(`\nStarting automatic AI evaluation...`);
        
        // Mathematical scoring
        console.log('Step 1/3: Mathematical scoring...');
        const scoredProducts = scoringService.scoreProducts(scrapedProducts, criteria);
        console.log(`${scoredProducts.length} products passed quality thresholds`);

        if (scoredProducts.length > 0) {
          // AI evaluation (top 10 products to avoid response truncation)
          console.log('Step 2/3: AI evaluation with Gemini...');
          const topProducts = scoredProducts.slice(0, 10);
          
          // Map scored products back to original products
          const productsForAI = topProducts.map(sp => {
            // Try to find by ID first (Tiki products)
            let original = scrapedProducts.find(p => p.id === sp.productId);
            
            // If not found by ID, try matching by name/title (eBay/Chotot products)
            if (!original) {
              original = scrapedProducts.find(p => 
                (p.name || p.title) === sp.productName
              );
            }
            
            // If still not found, try matching by link (extract ID from link)
            if (!original && sp.productId) {
              original = scrapedProducts.find(p => 
                p.link && p.link.includes(sp.productId)
              );
            }
            
            return original;
          }).filter(p => p !== undefined); // Remove any unmatched products
          
          if (productsForAI.length === 0) {
            throw new Error('Failed to map scored products to original products');
          }
          
          const aiEvaluation = await geminiService.evaluateProducts(
            productsForAI,
            criteria
          );

          // Clean scraped products - remove undefined values
          const cleanedScrapedProducts = scrapedProducts.map(product => {
            const cleaned = {};
            Object.keys(product).forEach(key => {
              if (product[key] !== undefined) {
                cleaned[key] = product[key];
              }
            });
            return cleaned;
          });

          // Prepare evaluation data structure (same format as Firebase)
          const evaluationData = {
            evaluation: aiEvaluation.evaluation,
            scoredProducts: topProducts,
            scrapedProducts: cleanedScrapedProducts,
            metadata: {
              ...aiEvaluation.metadata,
              platform,
              searchQuery: productName,
              userId: userId || 'anonymous',
              sessionId: sessionId || `session-${Date.now()}`,
              totalProducts: scrapedProducts.length,
              qualifiedProducts: scoredProducts.length,
              criteria,
              timestamp: new Date().toISOString(),
              source: 'auto-evaluation',
            },
          };

          aiEvaluationResult = {
            evaluationData,
            scoredProducts,
            aiEvaluation: aiEvaluation.evaluation,
            metadata: evaluationData.metadata,
          };

          console.log('Step 3/3: Formatting response...');
          console.log('AI evaluation complete!\n');
        } else {
          console.log('No products met quality thresholds for AI evaluation');
          aiEvaluationResult = {
            message: 'No products met the quality thresholds',
            scoredProducts: [],
            aiEvaluation: null,
          };
        }

      } catch (aiError) {
        console.error('AI evaluation failed:', aiError.message);
        aiEvaluationResult = {
          error: 'AI evaluation failed',
          details: aiError.message,
        };
      }
    }

    // Return formatted results directly (same format as Firebase retrieval)
    if (aiEvaluationResult && aiEvaluationResult.evaluationData) {
      // Transform to simplified format
      const products = transformToSimplifiedFormat(aiEvaluationResult.evaluationData);
      
      res.status(200).json({
        success: true,
        message: "Scraping and AI evaluation completed successfully",
        platform,
        query: productName,
        totalProducts: products.length,
        products,
      });
      return;
    }

    // Fallback response if AI evaluation was skipped
    res.status(200).json({
      success: true,
      message: "Scraping completed (no AI evaluation)",
      platform,
      query: productName,
      totalProducts: 0,
      products: [],
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

/**
 * Retrieve evaluation by ID from Firebase
 * GET /api/evaluations/:id
 */
export const getEvaluationByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Evaluation ID is required'
      });
    }

    console.log(`Retrieving evaluation ${id} from Firebase...`);
    const evaluationData = await getEvaluationById(id);

    // Transform to simplified format
    const products = transformToSimplifiedFormat(evaluationData);

    res.status(200).json({
      success: true,
      message: 'Evaluation retrieved successfully',
      evaluationId: id,
      platform: evaluationData.metadata?.platform,
      query: evaluationData.metadata?.searchQuery,
      totalProducts: products.length,
      products,
    });

  } catch (error) {
    console.error('Error retrieving evaluation:', error.message);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Evaluation not found',
        details: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve evaluation',
      details: error.message
    });
  }
};
