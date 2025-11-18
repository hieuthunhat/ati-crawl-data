import axios from "axios";
import fs from "fs";
import { randomDelay } from "../../helpers/helpers.js";
import { TIKI_BASE_URL } from "../../const/const.js";

async function scrapeTikiWithAPI({ keyword = null, categoryId = null, pages = 3, options = {} }) {
  const {
    minDelay = 2000,
    maxDelay = 4000,
    timeout = 30000,
    limit = 40,
  } = options;

  const results = [];
  let totalProducts = 0;

  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  ];

  const getRandomUserAgent = () => {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  };

  const createAxiosInstance = () => {
    return axios.create({
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "DNT": "1",
        "Connection": "keep-alive",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Referer": "https://tiki.vn/",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": getRandomUserAgent(),
      },
      timeout: timeout,
    });
  };

  try {
    const axiosInstance = createAxiosInstance();

    for (let page = 1; page <= pages; page++) {
      try {
        if (page > 1) {
          await randomDelay(minDelay, maxDelay);
        }

        const params = {
          limit: limit,
          page: page,
          include: "advertisement",
          aggregations: 2,
        };

        if (keyword) {
          params.q = keyword;
        } else if (categoryId) {
          params.category = categoryId;
        }

        const response = await axiosInstance.get(TIKI_BASE_URL, { params });
        
        if (!response.data || !response.data.data) {
          break;
        }

        const products = response.data.data || [];
        
        if (products.length === 0) {
          break;
        }

        products.forEach(product => {
          const processedProduct = {
            id: product.id,
            name: product.name || product.short_name,
            price: product.price,
            original_price: product.original_price,
            discount: product.discount,
            discount_rate: product.discount_rate,
            rating_average: product.rating_average,
            review_count: product.review_count,
            thumbnail_url: product.thumbnail_url,
            short_url: product.short_url,
            url_key: product.url_key,
            url: `https://tiki.vn/${product.url_key}.html`,
            seller: product.seller?.name || product.current_seller?.name,
            brand_name: product.brand_name,
            categories: product.categories,
            badges: product.badges,
          };

          results.push(processedProduct);
        });

        totalProducts = response.data.paging?.total || results.length;
        const lastPage = response.data.paging?.last_page || pages;

        console.log(`   ✅ Lấy được ${products.length} sản phẩm (Tổng: ${results.length}/${totalProducts})`);

        if (page >= lastPage) {
          console.log(`   ℹ️  Đã đến trang cuối: ${lastPage}`);
          break;
        }

      } catch (err) {
        console.error(`   ❌ Lỗi khi scrape trang ${page}:`, err.message);
        if (err.response) {
          console.error(`   Status: ${err.response.status}`);
        }
        break;
      }
    }

  } catch (err) {
    console.error(`❌ Lỗi nghiêm trọng:`, err.message);
  }

  // const outputFile = "tiki_products.json";
  // fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  // console.log(`\n✅ Đã lưu ${results.length} sản phẩm vào ${outputFile}`);

  return results;
}

export { scrapeTikiWithAPI };

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  scrapeTikiWithAPI({
    keyword: "iphone 15",
    pages: 3,
    options: {
      minDelay: 2000,
      maxDelay: 4000,
      limit: 40,
    }
  }).catch(console.error);
}
