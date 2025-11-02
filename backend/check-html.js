import axios from "axios";
import fs from "fs";

async function checkHTML() {
  try {
    const { data } = await axios.get("https://www.ebay.com/sch/i.html?_nkw=iphone%2015&_pgn=1", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
      }
    });

    fs.writeFileSync("ebay-check.html", data);
    console.log("✅ Đã lưu HTML vào ebay-check.html");
    console.log("HTML length:", data.length);
    
    const hasCards = data.includes('class="s-card');
    const hasBlocked = data.includes('blocked') || data.includes('captcha') || data.includes('security');
    
    console.log("Has s-card class:", hasCards);
    console.log("Might be blocked:", hasBlocked);
    
  } catch (err) {
    console.error("Error:", err.message);
  }
}

checkHTML();


