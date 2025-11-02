import puppeteer from "puppeteer";
import fs from "fs";
import { CHOTOT_BASE_URL } from "../../const/const.js";
import { randomDelay } from "../../helpers/helpers.js";

export function getCategoryByText(text) {
  if (!text || typeof text !== "string") return null;

  const normalizedText = text.toLowerCase().trim();

  const categoryMap = {
    "điện thoại": "5010",
    phone: "5010",
    "di động": "5010",
    iphone: "5010",
    smartphone: "5010",

    "máy tính bảng": "5020",
    tablet: "5020",
    ipad: "5020",

    laptop: "5030",
    macbook: "5030",
    "máy tính xách tay": "5030",

    "máy tính để bàn": "5040",
    pc: "5040",
    desktop: "5040",

    "máy ảnh": "5070",
    camera: "5070",

    tivi: "5080",
    tv: "5080",
    television: "5080",

    "thiết bị điện tử": "5000",
    "đồ điện tử": "5000",

    // Xe cộ
    "xe máy": "2000",
    moto: "2000",
    "xe mô tô": "2000",
    scooter: "2000",

    "xe đạp": "2020",
    bicycle: "2020",

    "ô tô": "1000",
    "xe hơi": "1000",
    car: "1000",
    auto: "1000",

    "xe tải": "1020",
    truck: "1020",

    // Bất động sản
    "nhà đất": "10000",
    "bất động sản": "10000",
    "real estate": "10000",

    "căn hộ": "10010",
    apartment: "10010",
    "chung cư": "10010",

    "nhà riêng": "10020",
    house: "10020",

    "đất nền": "10030",
    land: "10030",

    "văn phòng": "10040",
    office: "10040",

    "mặt bằng": "10050",
    shop: "10050",

    // Đồ gia dụng - Nội thất
    "đồ gia dụng": "3000",
    "gia dụng": "3000",
    "home appliance": "3000",

    "nội thất": "4000",
    furniture: "4000",
    "đồ nội thất": "4000",

    "bàn ghế": "4010",
    chair: "4010",
    table: "4010",

    giường: "4020",
    bed: "4020",

    tủ: "4030",
    cabinet: "4030",
    wardrobe: "4030",

    // Thời trang - Đồ dùng cá nhân
    "thời trang": "6000",
    fashion: "6000",
    "quần áo": "6000",
    clothes: "6000",

    "giày dép": "6010",
    shoes: "6010",

    "túi xách": "6020",
    bag: "6020",
    backpack: "6020",

    "đồng hồ": "6030",
    watch: "6030",

    // Mẹ và bé
    "mẹ và bé": "11000",
    baby: "11000",
    "em bé": "11000",

    "đồ chơi": "11010",
    toy: "11010",
    toys: "11010",

    "xe đẩy": "11020",
    stroller: "11020",

    // Thú cưng
    "thú cưng": "12000",
    pet: "12000",
    pets: "12000",

    chó: "12010",
    dog: "12010",

    mèo: "12020",
    cat: "12020",

    // Dịch vụ
    "dịch vụ": "13000",
    service: "13000",

    // Việc làm
    "việc làm": "14000",
    job: "14000",
    "tuyển dụng": "14000",
  };

  if (categoryMap[normalizedText]) {
    return categoryMap[normalizedText];
  }

  for (const [keyword, categoryId] of Object.entries(categoryMap)) {
    if (normalizedText.includes(keyword)) {
      return categoryId;
    }
  }

  return null;
}

export async function scrapeChototWithPuppeteer({category, options = {}}) {
  const {
    region = "12000",
    limit = 100,
    minDelay = 2000,
    maxDelay = 4000,
    headless = true,
    timeout = 30000,
  } = options;

  const results = [];
  let browser;
  let page = 1;

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

    const browserPage = await browser.newPage();

    await browserPage.setViewport({ width: 1920, height: 1080 });

    await browserPage.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    );

    await browserPage.setExtraHTTPHeaders({
      "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      Accept: "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
    });

    await browserPage.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      window.navigator.chrome = { runtime: {} };
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });
      Object.defineProperty(navigator, "languages", {
        get: () => ["vi-VN", "vi", "en-US", "en"],
      });
    });

    while (results.length < limit) {
      const offset = (page - 1) * 20;
      const apiUrl = `${CHOTOT_BASE_URL}?region_v2=${region}&cg=${category}&st=s&f=p&limit=20&o=${offset}`;

      try {
        if (page > 1) {
          const delay =
            Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
          await randomDelay(minDelay, maxDelay);
        }

        const response = await browserPage.goto(apiUrl, {
          waitUntil: "networkidle2",
          timeout: timeout,
        });

        if (!response.ok()) {
          break;
        }

        const data = await response.json();
        const ads = data.ads || [];

        if (ads.length === 0) {
          break;
        }

        ads.forEach((ad) => {
          const processedAd = {
            ad_id: ad.ad_id || ad.list_id,
            subject: ad.subject,
            body: ad.body,
            cost_price: ad.price,
            region_name: ad.region_name,
            area_name: ad.area_name,
            category_name: ad.category_name,
            date: ad.date,
            image: ad.image,
            images: ad.images,
            account_name: ad.account?.name,
            account_phone: ad.account?.phone,
            type: ad.type,
            url: `https://www.chotot.com/${ad.ad_id || ad.list_id}.htm`,
          };

          results.push(processedAd);
        });

        if (results.length >= limit) {
          break;
        }

        page++;
      } catch (err) {
        console.error(err);
        break;
      }
    }
  } catch (err) {
    console.error( err.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  const finalResults = results.slice(0, limit);
  fs.writeFileSync(
    "chotot_products.json",
    JSON.stringify(finalResults, null, 2)
  );

  return finalResults;
}
