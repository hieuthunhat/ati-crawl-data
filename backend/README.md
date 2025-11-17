# Tiki Backend API with AI Evaluation

**AI-Powered Product Scraping and Evaluation System**

A comprehensive backend system for scraping products from Tiki, Chotot, and eBay, with integrated AI evaluation using Google Gemini for dropshipping profitability analysis.

---

## Features

### **Core Features**
- **Multi-Platform Scraping** - Tiki, Chotot, eBay product data extraction
- **Automatic AI Evaluation** - Every scrape automatically analyzed by Gemini 2.0 Flash
- **Mathematical Scoring** - Automated profit, review, and trend scoring
- **Firebase Cloud Storage** - Persistent evaluation history
- **RESTful API** - Single endpoint for scraping + AI evaluation
- **Automated Rate Limiting** - Prevents scraping blocks

### **AI Evaluation**
- **Automatic Processing** - No separate API call needed, happens after every scrape
- **Profit Calculation** - Shopify fees, markup tiers, net profit
- **Review Analysis** - Rating quality and volume scoring
- **Trend Detection** - Sales volume and discount indicators
- **Smart Recommendations** - AI-powered product insights
- **Risk Assessment** - Low/medium/high risk classification
- **Gemini 2.0 Flash** - Latest Google AI model for faster, better analysis

### **Scoring Algorithm**
- **Profit Potential (40%)** - Margin calculation with Shopify fees
- **Review Quality (40%)** - Rating + review count analysis
- **Market Trend (20%)** - Sales volume + discount signals

---

## Quick Start

### **Prerequisites**
- Node.js v18+
- Firebase account with Firestore
- Google Gemini API key
- Tiki/Chotot/eBay access

### **Installation**

````bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Add Firebase service account
# Place service-account.json in backend/config/

# 5. Start server
npm start
````

### **Quick Test**

````bash
# Test server health
curl http://localhost:3000

# Test scraping with automatic AI evaluation
curl -X POST http://localhost:3000/api/crawledProducts \
  -H "Content-Type: application/json" \
  -d "{\"productName\":\"tai nghe\",\"platform\":\"tiki\"}"
````

---

## Project Structure

````
backend/
├── config/
│   ├── ai-config.js          # AI configuration & thresholds
│   ├── firebase-db.js        # Firebase initialization
│   ├── add-data.js           # Data management utilities
│   └── service-account.json  # Firebase credentials (not in git)
├── controllers/
│   ├── controllers.js        # Main scraping controllers
│   └── aiEvaluationControllers.js  # AI evaluation handlers
├── services/
│   ├── Tiki/
│   │   └── tikiScrapeService.js    # Tiki scraper
│   ├── Chotot/
│   │   ├── chototScrapeService.js  # Chotot scraper
│   │   ├── chototDetailService.js  # Product details
│   │   └── chototWithRatings.js    # Rating extraction
│   ├── eBay/
│   │   └── ebayScrapeService.js    # eBay scraper
│   ├── geminiService.js      # Google Gemini AI integration
│   └── productScoringService.js   # Mathematical scoring
├── routes/
│   └── routes.js             # API route definitions
├── helpers/
│   └── helpers.js            # Utility functions
├── const/
│   └── const.js              # Constants & configurations
├── handlers.js               # Express app setup
├── server.js                 # Server entry point
├── package.json              # Dependencies
├── .env                      # Environment variables (not in git)
└── .gitignore               # Git ignore rules
````

---

## Configuration

### **Environment Variables**

Create `.env` file in `backend/` directory:

````env
# Server Configuration
PORT=3000
NODE_ENV=development

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=2048

# Firebase
FIREBASE_AI_COLLECTION=ai-evaluations

# Scoring Weights (0-1, must sum to 1.0)
PROFIT_WEIGHT=0.40
REVIEW_WEIGHT=0.40
TREND_WEIGHT=0.20

# Quality Thresholds
MIN_REVIEW_SCORE=2.0
MIN_REVIEW_COUNT=10
MIN_PROFIT_MARGIN=0.20
MIN_FINAL_SCORE=0.50
````

### **Firebase Setup**

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com
   - Create new project: `tiki-ai-evaluation-db`
   - Enable Firestore Database

2. **Get Service Account**
   - Project Settings → Service Accounts
   - Generate new private key
   - Save as `backend/config/service-account.json`

3. **Configure Firestore**
   - Create collection: `ai-evaluations`
   - Set rules for read/write access

### **Gemini API Setup**

1. **Get API Key**
   - Visit https://makersuite.google.com/app/apikey
   - Create new API key
   - Copy to `.env` as `GEMINI_API_KEY`

---

## Usage

### **Product Scraping with Automatic AI Evaluation**

The system automatically evaluates products after scraping. Just send one request:

````javascript
// Scrape products from Tiki/Chotot/eBay
// AI evaluation happens automatically
POST /api/crawledProducts

{
  "productName": "tai nghe bluetooth",
  "platform": "tiki",
  // Optional: AI evaluation parameters
  "criteria": {
    "weights": {
      "profitWeight": 0.4,
      "reviewWeight": 0.4,
      "trendWeight": 0.2
    },
    "thresholds": {
      "minReviewScore": 4.0,
      "minReviewCount": 10,
      "minProfitMargin": 0.20,
      "minFinalScore": 0.50
    }
  },
  "storeResults": true,  // Optional: save to Firebase (default: true)
  "userId": "user123",   // Optional: for filtering
  "sessionId": "session456" // Optional: for grouping
}
````

**How It Works:**
1. **Scraping** - Extracts products from selected platform (2-5 seconds)
2. **Mathematical Scoring** - Calculates profit, review, and trend scores (1-2 seconds)
3. **AI Evaluation** - Gemini analyzes top 10 products (10-20 seconds)
4. **Response Formatting** - Transforms to clean JSON format (instant)
5. **Response** - Returns formatted evaluated products directly

**Note:** All AI parameters are optional. If not provided, default values from `ai-config.js` are used.

---

## API Endpoints

### **1. Scrape & Evaluate Products**

````http
POST /api/crawledProducts
````

Scrapes products and automatically evaluates them with AI. Returns evaluated products from Firebase.

**Response includes:**
- ✅ **Evaluation ID** - For retrieving results later
- ✅ **AI-evaluated products** - With pricing, analysis, recommendations
- ✅ **Scored products** - Mathematical scoring results
- ✅ **Summary statistics** - Totals and averages
- ✅ **Metadata** - Platform, query, criteria used

### **2. Retrieve Evaluation by ID**

````http
GET /api/evaluations/:id
````

Retrieves previously stored evaluation results from Firebase.

**Example:**
````bash
GET /api/evaluations/eval_abc123xyz
````

**Use cases:**
- Retrieve historical evaluations without re-scraping
- Compare evaluations from different time periods
- Share evaluation results using the ID
- Reduce API calls by caching evaluation IDs

---

## API Response Examples

### **Successful Scraping with AI Evaluation**

````json
{
  "success": true,
  "message": "Scraping and AI evaluation completed successfully",
  "platform": "tiki",
  "query": "tai nghe bluetooth",
  "totalProducts": 50,
  "products": [
    {
      "id": "123456",
      "name": "Tai nghe Bluetooth Sony WH-1000XM5",
      "price": 8000000,
      "avgRating": 4.8,
      "ratingNum": 500,
      "imageUrl": "https://salt.tikicdn.com/cache/280x280/ts/product/abc123.jpg"
    },
    {
      "id": "123457",
      "name": "Tai nghe Bluetooth JBL Tune 510BT",
      "price": 890000,
      "avgRating": 4.5,
      "ratingNum": 1250,
      "imageUrl": "https://salt.tikicdn.com/cache/280x280/ts/product/def456.jpg"
    },
    {
      "id": "123458",
      "name": "Tai nghe Bluetooth Apple AirPods Pro",
      "price": 5990000,
      "avgRating": 4.9,
      "ratingNum": 3200,
      "imageUrl": "https://salt.tikicdn.com/cache/280x280/ts/product/ghi789.jpg"
    }
    // ... 47 more products
  ]
}
````

**Response Structure**:
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Operation success status |
| `message` | string | Human-readable message |
| `evaluationId` | string | Firebase document ID for retrieval |
| `platform` | string | Source platform (tiki/ebay/chotot) |
| `query` | string | Search query used |
| `totalProducts` | number | Number of products returned |
| `products` | array | Simplified product array |

**Product Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique product identifier |
| `name` | string | Product name/title |
| `price` | number | **Suggested selling price** (AI-calculated with optimal markup) in VND |
| `avgRating` | number | Average rating (0-5) |
| `ratingNum` | number | Number of ratings/reviews |
| `imageUrl` | string | Product image URL |

**Key Points:**
- ✅ **Simplified format**: Clean product array ready for frontend display
- ✅ **Consistent field names**: `avgRating`, `ratingNum` across all platforms
- ✅ **Smart pricing**: Returns AI-optimized selling prices (includes markup + Shopify fees)
- ✅ **Evaluation ID** included for retrieving results later
- ✅ **Reduced payload**: Only essential product data returned
- ✅ **AI evaluation data**: Stored in Firebase but not in response (keeps it clean)

---

## Scoring Algorithm Details

### **Profit Score Calculation**

````
1. Calculate selling price based on cost tiers:
   - 1k-50k VND: 20% markup
   - 51k-200k VND: 30% markup
   - 201k+ VND: 40% markup

2. Deduct Shopify fees:
   - Transaction fee: 2.9% of selling price
   - Fixed fee: $0.30 per transaction

3. Calculate profit margin:
   Margin = (Selling Price - Cost - Fees) / Selling Price × 100

4. Score (0-1):
   - Below 20% margin: 0
   - 20-40% margin: Linear scale
   - Above 40% margin: 1.0
````

### **Review Score Calculation**

````
1. Check minimum thresholds:
   - Rating ≥ 4.0/5
   - Review count ≥ 10

2. Base score from rating:
   Rating Score = Rating / 5

3. Add review bonus:
   Bonus = min(log10(reviewCount) / 2, 0.2)

4. Final score = Rating Score + Bonus (capped at 1.0)
````

### **Trend Score Calculation**

````
1. Discount signals (0-0.3):
   - 30%+ discount: +0.3
   - 20-29% discount: +0.2
   - 10-19% discount: +0.1

2. Sales volume (0-0.4):
   - 1000+ sold: +0.4
   - 500-999 sold: +0.3
   - 100-499 sold: +0.2

3. Badges (0-0.3):
   - Best seller: +0.2
   - New arrival: +0.1

Total capped at 1.0
````

---

## Testing

### **Manual Testing**

See `MANUAL_TESTING.md` for complete Postman collection and test scenarios.

### **Automated Testing**

````bash
# Run test suite
npm test

# Test individual features
node test-ai-integration.js
````

---

## Documentation

- **README.md** (this file) - Overview and setup
- **API_DOCUMENTATION.md** - Complete API reference
- **MANUAL_TESTING.md** - Postman test guide
- **DEPLOYMENT.md** - Production deployment guide

---

## Security

### **Best Practices**
- `.env` file not committed to git
- Firebase service account secured
- API keys encrypted in transit
- Input validation on all endpoints
- Rate limiting on scraping endpoints

### **Firestore Security Rules**

````javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ai-evaluations/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      allow delete: if request.auth != null 
        && request.auth.uid == resource.data.metadata.userId;
    }
  }
}
````

---
## Troubleshooting

### **Common Issues**

**1. Gemini API Key Error**
````
Error: Gemini API not initialized
Solution: Check GEMINI_API_KEY in .env file
````

**2. Firebase Connection Failed**
````
Error: Firebase initialization failed
Solution: Verify service-account.json exists in config/
````

**3. No Products Meet Criteria**
````
Message: "No products met the quality thresholds"
Solution: Lower thresholds in evaluation criteria
````

**4. Port Already in Use**
````
Error: EADDRINUSE: address already in use :::3000
Solution: Change PORT in .env or kill process on port 3000
````

---

## Performance

- **Scraping Speed**: ~2-3 products/second (with delays)
- **AI Evaluation**: ~5-10 seconds for 20 products
- **Firebase Storage**: <1 second per evaluation
- **Memory Usage**: ~150MB average
- **Concurrent Requests**: Supports 10+ simultaneous evaluations

---

## Roadmap

- [ ] Add more scraping platforms (Shopee, Lazada)
- [ ] Real-time evaluation streaming
- [ ] Batch processing for large datasets
- [ ] Custom scoring weights per user
- [ ] Historical trend analysis
- [ ] Product comparison features
- [ ] Export to CSV/Excel
- [ ] Web dashboard UI

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## License

MIT License - see LICENSE file for details

---

## Support

- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Email**: support@example.com

---

## Acknowledgments

- Google Gemini AI for product analysis
- Firebase for cloud storage
- Puppeteer for web scraping
- Express.js for API framework

---

**Version**: 2.0.0  
**Last Updated**: November 6, 2025  
