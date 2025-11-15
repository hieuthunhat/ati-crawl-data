import puppeteer from "puppeteer";
import fs from "fs";
import { randomDelay } from "../../helpers/helpers.js";
import { EBAY_BASE_URL } from "../../const/const.js";

async function scrapeEbayWithPuppeteer({keyword, pages = 3, options = {}}) {
  const {
    minDelay = 3000,
    maxDelay = 6000, 
    headless = true,
    timeout = 30000
  } = options;

  const results = [];
  let browser;

  try {
  
    browser = await puppeteer.launch({
      headless: headless ? "new" : false, 
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      window.navigator.chrome = { runtime: {} };
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });

    for (let pageNum = 1; pageNum <= pages; pageNum++) {
      const searchUrl = `${EBAY_BASE_URL}_nkw=${encodeURIComponent(keyword)}&_pgn=${pageNum}`;

      try {
        if (pageNum > 1) {
          await randomDelay(minDelay, maxDelay);
        }

        await page.goto(searchUrl, {
          waitUntil: 'networkidle2',
          timeout: timeout
        });

        try {
          await page.waitForSelector('.s-card', { timeout: 10000 });
        } catch (err) {
          const isBlocked = await page.evaluate(() => {
            return document.body.innerHTML.includes('Pardon Our Interruption') ||
                   document.body.innerHTML.includes('Checking your browser');
          });

          if (isBlocked) {
            console.log(`Page number ${pageNum} is blocked eBay!`);
            break;
          }
          continue;
        }

        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight / 2);
        });
        await randomDelay(500, 1000);

        const pageResults = await page.evaluate(() => {
          const items = [];
          const cards = document.querySelectorAll('.s-card');

          cards.forEach(card => {
            const titleEl = card.querySelector('.s-card__title .su-styled-text');
            const priceEl = card.querySelector('.s-card__price');
            const linkEl = card.querySelector('a[href*="/itm/"]');
            const imageEl = card.querySelector('.s-card__image');
            const ratingEl = card.querySelector('.x-star-rating');
            let rating = null;
            let reviewCount = null;
            
            if (ratingEl) {
              const filledStars = ratingEl.querySelectorAll('svg use[href*="star-filled"]').length;
              const halfStars = ratingEl.querySelectorAll('svg use[href*="star-half"]').length;
              rating = filledStars + (halfStars * 0.5);

              const reviewEl = card.querySelector('.s-card__product-reviews');
              if (reviewEl) {
                const reviewText = reviewEl.textContent.trim();
                // Extract number before "product ratings" text
                // Format: "5.0 out of 5 stars.3 product ratings - ..."
                const match = reviewText.match(/(\d+[\d,]*)\s+product\s+ratings?/i);
                if (match) {
                  reviewCount = parseInt(match[1].replace(/,/g, ''));
                }
              }
            }

            const title = titleEl?.textContent?.trim();
            const price = priceEl?.textContent?.trim();
            const link = linkEl?.href;
            const image = imageEl?.src || imageEl?.dataset?.deferLoad;

            if (title && price && link) {
              items.push({ 
                title, 
                price, 
                link, 
                image,
                rating: rating ? parseFloat(rating.toFixed(1)) : null,
                reviewCount: reviewCount ? parseInt(reviewCount) : null
              });
            }
          });

          return items;
        });

        results.push(...pageResults);
        console.log(`Found ${pageResults.length} products (Total: ${results.length})`);

      } catch (err) {
        console.error(`Error when scraping trang ${pageNum}:`, err.message);
      }
    }

  } catch (err) {
    console.error(`Critical error:`, err.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\nClosed browser');
    }
  }

  // Normalize product data before returning
  const normalizedProducts = normalizeEbayProducts(results);
  
  // fs.writeFileSync("ebay_products.json", JSON.stringify(normalizedProducts, null, 2));

  return normalizedProducts;
}

/**
 * Normalize eBay product data to match expected format
 * - Parse price strings to numbers
 * - Filter out junk/banner products
 * - Handle null values
 */
function normalizeEbayProducts(products) {
  const junkTitlePatterns = [
    /^shop on ebay$/i,
    /^ebay$/i,
    /^banner$/i,
    /^advertisement$/i,
    /^sponsored$/i
  ];

  return products
    .map(product => {
      // Parse price string to number
      let priceNum = 0;
      if (product.price) {
        // Remove currency symbols, commas, spaces
        const priceStr = product.price.replace(/[$£€,\s]/g, '');
        priceNum = parseFloat(priceStr);
      }

      return {
        title: product.title,
        name: product.title, // Add name alias for compatibility
        price: priceNum || 0,
        link: product.link,
        image: product.image,
        rating: product.rating || 0,
        reviewCount: product.reviewCount || 0
      };
    })
    .filter(product => {
      // Filter out junk products
      if (!product.title || product.title.length < 3) return false;
      
      // Check against junk patterns
      const isJunk = junkTitlePatterns.some(pattern => pattern.test(product.title));
      if (isJunk) return false;

      // Require valid price
      if (!product.price || product.price <= 0) return false;

      // Require valid link
      if (!product.link) return false;

      return true;
    });
}

scrapeEbayWithPuppeteer("iphone 15", 5, {
  minDelay: 4000,
  maxDelay: 8000,
  headless: true, 
  timeout: 30000
});

export { scrapeEbayWithPuppeteer };