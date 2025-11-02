import { scrapeEbayWithPuppeteer } from "../services/eBay/ebayScrapeService.js";
import {
  getCategoryByText,
  scrapeChototWithPuppeteer,
} from "../services/Chotot/chototScrapeService.js";
import { scrapeTikiWithAPI } from "../services/Tiki/tikiScrapeService.js";

export const getProductsData = async (req, res) => {
  const { productName, platform } = req.body;
  try {
    switch (platform) {
      case "ebay":
        await scrapeEbayWithPuppeteer({
          keyword: productName,
          pages: 3,
        });
        res.status(200).json({ message: "Scraping completed successfully." });
        break;
      case "chotot":
        const category = getCategoryByText(productName);
        await scrapeChototWithPuppeteer({ category });
        res.status(200).json({ message: "Scraping completed successfully." });
        break;
      case "tiki":
        await scrapeTikiWithAPI({ keyword: productName, pages: 3 });
        res.status(200).json({ message: "Scraping completed successfully." });
        break;
      default:
        throw new Error("Unsupported platform");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
