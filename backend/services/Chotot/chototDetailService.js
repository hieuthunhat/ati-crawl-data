import puppeteer from "puppeteer";
import { randomDelay } from "../../helpers/helpers.js";

/**
 * Lấy rating và thông tin chi tiết từ 1 sản phẩm cụ thể
 * @param {string} adId - ID của sản phẩm (VD: "128487791")
 * @param {object} options - Các tùy chọn (headless, timeout)
 * @returns {object} - Object chứa rating và thông tin chi tiết
 */
async function getProductRating(adId, options = {}) {
  const {
    headless = true,
    timeout = 30000,
  } = options;

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: headless ? "new" : false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    );

    await page.setExtraHTTPHeaders({
      "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
    });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      window.navigator.chrome = { runtime: {} };
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });
      Object.defineProperty(navigator, "languages", {
        get: () => ["vi-VN", "vi", "en-US", "en"],
      });
    });

    const url = `https://www.chotot.com/${adId}.htm`;
    
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: timeout,
    });

    // Extract rating từ JSON-LD schema và page content
    const productData = await page.evaluate(() => {
      const data = {
        ad_id: null,
        subject: null,
        price: null,
        rating: null,
        reviewCount: null,
        sellerName: null,
        sellerRating: null,
        category: null,
        region: null,
      };

      try {
        // Method 1: Tìm trong __NEXT_DATA__ (React data) - Đây là nguồn chính xác nhất
        const nextDataScript = document.getElementById('__NEXT_DATA__');
        if (nextDataScript) {
          const nextData = JSON.parse(nextDataScript.textContent);
          const initialProps = nextData?.props?.pageProps?.initialProps;
          const adData = initialProps?.paramsData?.ad;
          
          if (adData) {
            data.ad_id = adData.ad_id;
            data.subject = adData.subject;
            data.price = adData.price;
            data.rating = adData.average_rating || adData.average_rating_for_seller || null;
            data.reviewCount = adData.total_rating || adData.total_rating_for_seller || null;
            data.sellerName = adData.account_name;
            data.sellerRating = adData.average_rating_for_seller;
            data.category = adData.category_name;
            data.region = adData.region_name;
          }
        }

        // Method 2: Tìm trong JSON-LD schema (fallback)
        if (!data.rating || !data.reviewCount) {
          const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
          if (jsonLdScript) {
            const jsonData = JSON.parse(jsonLdScript.textContent);
            if (jsonData.aggregateRating) {
              if (!data.rating) {
                data.rating = parseFloat(jsonData.aggregateRating.ratingValue);
              }
              if (!data.reviewCount) {
                data.reviewCount = parseInt(jsonData.aggregateRating.reviewCount);
              }
            }
            if (jsonData.offers?.seller?.name && !data.sellerName) {
              data.sellerName = jsonData.offers.seller.name;
            }
          }
        }

      } catch (err) {
        console.error('Error extracting rating:', err.message);
      }

      return data;
    });

    return {
      success: true,
      data: productData,
      url: url,
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Lấy rating cho nhiều sản phẩm (batch)
 * @param {Array<string>} adIds - Mảng các ad_id
 * @param {object} options - Các tùy chọn (headless, timeout, minDelay, maxDelay)
 * @returns {Array<object>} - Mảng các object chứa rating
 */
async function getMultipleProductRatings(adIds, options = {}) {
  const {
    headless = true,
    timeout = 30000,
    minDelay = 2000,
    maxDelay = 4000,
  } = options;

  const results = [];
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: headless ? "new" : false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    );

    await page.setExtraHTTPHeaders({
      "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
    });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      window.navigator.chrome = { runtime: {} };
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });
      Object.defineProperty(navigator, "languages", {
        get: () => ["vi-VN", "vi", "en-US", "en"],
      });
    });

    console.log(`\n🔍 Bắt đầu lấy rating cho ${adIds.length} sản phẩm...\n`);

    for (let i = 0; i < adIds.length; i++) {
      const adId = adIds[i];
      
      try {
        if (i > 0) {
          const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
          console.log(`   ⏳ Chờ ${(delay / 1000).toFixed(1)}s...`);
          await randomDelay(minDelay, maxDelay);
        }

        const url = `https://www.chotot.com/${adId}.htm`;
        
        await page.goto(url, {
          waitUntil: "networkidle2",
          timeout: timeout,
        });

        const productData = await page.evaluate(() => {
          const data = {
            ad_id: null,
            subject: null,
            price: null,
            rating: null,
            reviewCount: null,
            sellerName: null,
            category: null,
            region: null,
          };

          try {
            // Tìm trong __NEXT_DATA__
            const nextDataScript = document.getElementById('__NEXT_DATA__');
            if (nextDataScript) {
              const nextData = JSON.parse(nextDataScript.textContent);
              const initialProps = nextData?.props?.pageProps?.initialProps;
              const adData = initialProps?.paramsData?.ad;
              
              if (adData) {
                data.ad_id = adData.ad_id;
                data.subject = adData.subject;
                data.price = adData.price;
                data.rating = adData.average_rating || adData.average_rating_for_seller || null;
                data.reviewCount = adData.total_rating || adData.total_rating_for_seller || null;
                data.sellerName = adData.account_name;
                data.category = adData.category_name;
                data.region = adData.region_name;
              }
            }

            // Fallback: JSON-LD schema
            if (!data.rating || !data.reviewCount) {
              const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
              if (jsonLdScript) {
                const jsonData = JSON.parse(jsonLdScript.textContent);
                if (jsonData.aggregateRating) {
                  if (!data.rating) {
                    data.rating = parseFloat(jsonData.aggregateRating.ratingValue);
                  }
                  if (!data.reviewCount) {
                    data.reviewCount = parseInt(jsonData.aggregateRating.reviewCount);
                  }
                }
              }
            }
          } catch (err) {
            console.error('Error extracting rating:', err.message);
          }

          return data;
        });

        results.push({
          ad_id: adId,
          ...productData,
          success: true,
        });

        console.log(`   ✅ [${i + 1}/${adIds.length}] ID: ${adId} - Rating: ${productData.rating || 'N/A'}⭐ (${productData.reviewCount || 0} đánh giá)`);

      } catch (error) {
        results.push({
          ad_id: adId,
          success: false,
          error: error.message,
        });
        console.log(`   ❌ [${i + 1}/${adIds.length}] ID: ${adId} - Lỗi: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Lỗi nghiêm trọng:', error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n🔒 Đã đóng browser');
    }
  }

  // Tính thống kê
  const successCount = results.filter(r => r.success).length;
  const withRating = results.filter(r => r.rating && r.rating > 0);
  
  console.log(`\n📊 Thống kê:`);
  console.log(`   - Thành công: ${successCount}/${adIds.length}`);
  console.log(`   - Có rating: ${withRating.length}/${successCount}`);
  
  if (withRating.length > 0) {
    const avgRating = withRating.reduce((sum, r) => sum + r.rating, 0) / withRating.length;
    const totalReviews = withRating.reduce((sum, r) => sum + (r.reviewCount || 0), 0);
    console.log(`   - Rating trung bình: ${avgRating.toFixed(2)}⭐`);
    console.log(`   - Tổng đánh giá: ${totalReviews}`);
  }

  return results;
}

export { getProductRating, getMultipleProductRatings };
