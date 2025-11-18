import { scrapeEbayWithPuppeteer } from "../services/eBay/ebayScrapeService.js";
import { scrapeTikiWithAPI } from "../services/Tiki/tikiScrapeService.js";
import geminiService from "../services/evaluation/geminiService.js";
import scoringService from "../services/evaluation/productScoringService.js";

const transformToSimplifiedFormat = (evaluationData) => {
  if (!evaluationData.scoredProducts || evaluationData.scoredProducts.length === 0) {
    return [];
  }

  const scrapedProductsMap = new Map();
  if (evaluationData.scrapedProducts) {
    evaluationData.scrapedProducts.forEach(p => {
      const id = p.id || p.productId || (p.name || p.title);
      if (id) scrapedProductsMap.set(String(id), p);
    });
  }

  return evaluationData.scoredProducts
    .filter(scoredProduct => scoredProduct.meetsThresholds === true)
    .map((scoredProduct, index) => {
      const originalProduct = scrapedProductsMap.get(String(scoredProduct.productId)) || {};
      const price = scoredProduct.sellingPrice || scoredProduct.costPrice || 0;
      const imageUrl = originalProduct.thumbnail_url || 
                       originalProduct.image || 
                       originalProduct.imageUrl || 
                       'https://via.placeholder.com/150';
      const productUrl = originalProduct.link || 
                         originalProduct.url || 
                         originalProduct.productUrl || 
                         '';

      return {
        id: String(scoredProduct.productId || `sp${index + 1}`),
        name: scoredProduct.productName || 'Unknown Product',
        price: Math.round(Number(price)),
        avgRating: Number(scoredProduct.rating || 0),
        ratingNum: Number(scoredProduct.reviewCount || 0),
        imageUrl,
        url: productUrl,
      };
    });
};


export const getProductsData = async (req, res) => {
  const { 
    productName, 
    platform,
    criteria = {},
  } = req.body;
  
  try {
    let scrapedProducts = [];

    console.log(`\nStarting ${platform} scraping for: ${productName}`);
    
    switch (platform) {
      case "ebay":
        scrapedProducts = await scrapeEbayWithPuppeteer({
          keyword: productName,
          pages: 3,
        });
        break;
      case "tiki":
        scrapedProducts = await scrapeTikiWithAPI({ keyword: productName, pages: 3 });
        break;
      default:
        throw new Error("Unsupported platform");
    }

    console.log(`Scraping completed: ${scrapedProducts.length} products found`);

    let aiEvaluationResult = null;
    
    if (scrapedProducts.length > 0) {
      try {
        console.log(`\nStarting automatic AI evaluation...`);
        
        console.log('Step 1/3: Mathematical scoring...');
        const scoredProducts = scoringService.scoreProducts(scrapedProducts, criteria);
        console.log(`${scoredProducts.length} products passed quality thresholds`);

        if (scoredProducts.length > 0) {
          console.log('Step 2/3: AI evaluation with Gemini 2.0 Flash...');
          const topProducts = scoredProducts.slice(0, 10);

          const productsForAI = topProducts.map(sp => {
            let original = scrapedProducts.find(p => p.id === sp.productId);

            if (!original) {
              original = scrapedProducts.find(p => 
                (p.name || p.title) === sp.productName
              );
            }
            if (!original && sp.productId) {
              original = scrapedProducts.find(p => 
                p.link && p.link.includes(sp.productId)
              );
            }
            
            return original;
          }).filter(p => p !== undefined);
          
          if (productsForAI.length === 0) {
            throw new Error('Failed to map scored products to original products');
          }
          
          const aiEvaluation = await geminiService.evaluateProducts(
            productsForAI,
            criteria
          );

          const cleanedScrapedProducts = scrapedProducts.map(product => {
            const cleaned = {};
            Object.keys(product).forEach(key => {
              if (product[key] !== undefined) {
                cleaned[key] = product[key];
              }
            });
            return cleaned;
          });

          const evaluationData = {
            evaluation: aiEvaluation.evaluation,
            scoredProducts: topProducts,
            scrapedProducts: cleanedScrapedProducts,
            metadata: {
              ...aiEvaluation.metadata,
              platform,
              searchQuery: productName,
              totalProducts: scrapedProducts.length,
              qualifiedProducts: scoredProducts.length,
              criteria,
            },
          };

          aiEvaluationResult = {
            evaluationData,
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

    if (aiEvaluationResult && aiEvaluationResult.evaluationData) {
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


