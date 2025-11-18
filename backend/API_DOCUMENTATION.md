API Documentation

Tiki Backend API with AI Evaluation

Base URL: http://localhost:3000


Table of Contents:
1. Overview
2. Endpoints
   2.1. Scrape Products with AI Evaluation
   2.2. Shopify Integration
3. Request/Response Formats
4. Error Handling
5. Configuration


1. Overview
This API provides product scraping and AI evaluation services for e-commerce platforms. The system scrapes product data from Tiki or eBay, applies mathematical scoring, evaluates the top products using Google Gemini AI, and returns a simplified JSON response optimized for frontend consumption.

Key Features:
- Multi-platform scraping (Tiki, eBay)
- Automatic mathematical scoring based on profit, reviews, and trends
- AI evaluation using Google Gemini 2.0 Flash
- Direct JSON response without Firebase storage
- Simplified product format for easy integration

Processing Pipeline:
1. Scraping: Extract products from selected platform (2-5 seconds)
2. Mathematical Scoring: Calculate profit, review, and trend scores (1-2 seconds)
3. AI Evaluation: Gemini analyzes top 10 scored products (10-20 seconds)
4. Response Formatting: Transform to simplified JSON format (instant)

Total Response Time: 15-30 seconds


2. Endpoints

2.1. Scrape Products with AI Evaluation

Endpoint: POST /api/crawl-products

Description: Scrapes products from the specified platform and automatically evaluates them using AI. Returns only the top 10 products that passed quality thresholds and were evaluated by Gemini AI.

Request Body:

{
  "productName": "tai nghe bluetooth",
  "platform": "tiki",
  "criteria": {
    "weights": {
      "profitWeight": 0.6,
      "reviewWeight": 0.4,
      "trendWeight": 0.0
    },
    "thresholds": {
      "minReviewScore": 2.0,
      "minReviewCount": 10,
      "minProfitMargin": 0.20,
      "minFinalScore": 0.50
    }
  }
}

Request Parameters:

Parameter: productName
Type: string
Required: Yes
Description: Search query string (e.g., "tai nghe", "iphone", "laptop")

Parameter: platform
Type: string
Required: Yes
Description: Platform to scrape. Supported values: "tiki", "ebay"

Parameter: criteria
Type: object
Required: No
Description: Custom AI evaluation criteria. If not provided, uses defaults from ai-config.js

Parameter: criteria.weights
Type: object
Required: No
Description: Scoring weights for final score calculation. Must sum to 1.0.
Fields:
  - profitWeight: Weight for profit score (0-1)
  - reviewWeight: Weight for review score (0-1)
  - trendWeight: Weight for trend score (0-1)

Parameter: criteria.thresholds
Type: object
Required: No
Description: Quality thresholds for filtering products
Fields:
  - minReviewScore: Minimum rating (0-5)
  - minReviewCount: Minimum number of reviews
  - minProfitMargin: Minimum profit margin (0-1, e.g., 0.20 = 20%)
  - minFinalScore: Minimum final score (0-1)

Success Response (200 OK):

{
  "success": true,
  "message": "Scraping and AI evaluation completed successfully",
  "platform": "tiki",
  "query": "tai nghe bluetooth",
  "totalProducts": 10,
  "products": [
    {
      "id": "183743642",
      "name": "Lenovo ThinkPad L460",
      "price": 8036000,
      "avgRating": 4.6,
      "ratingNum": 8,
      "imageUrl": "https://salt.tikicdn.com/cache/280x280/ts/product/14/8c/81/fb9e28fb39287ef103ee0e9765f98564.png",
      "url": "https://tiki.vn/lenovo-thinkpad-l460-p183743642.html"
    }
  ]
}

Response Fields:

Field: success
Type: boolean
Description: Indicates whether the request was successful

Field: message
Type: string
Description: Human-readable status message

Field: platform
Type: string
Description: Platform that was scraped

Field: query
Type: string
Description: Search query that was used

Field: totalProducts
Type: number
Description: Number of products returned (maximum 10)

Field: products
Type: array
Description: Array of simplified product objects

Product Object Structure:

Field: id
Type: string
Description: Unique product identifier

Field: name
Type: string
Description: Product name or title

Field: price
Type: number
Description: AI-calculated suggested selling price in VND (includes markup and fees). This is NOT the cost price. Rounded to nearest integer.

Field: avgRating
Type: number
Description: Average customer rating (0-5)

Field: ratingNum
Type: number
Description: Total number of ratings/reviews

Field: imageUrl
Type: string
Description: Product thumbnail image URL

Field: url
Type: string
Description: Direct link to product page on original platform

Error Response - Missing Required Fields (400 Bad Request):

{
  "success": false,
  "error": "Missing required fields"
}

Error Response - Invalid Platform (400 Bad Request):

{
  "success": false,
  "error": "Unsupported platform"
}

Error Response - Server Error (500 Internal Server Error):

{
  "success": false,
  "error": "Scraping failed or AI evaluation error"
}

Error Response - No Products Found (200 OK):

{
  "success": true,
  "message": "Scraping completed (no AI evaluation)",
  "platform": "tiki",
  "query": "nonexistent product",
  "totalProducts": 0,
  "products": []
}

Notes:
- Only top 10 scored products are sent to AI for evaluation
- Products must pass quality thresholds before AI evaluation
- Response contains ONLY AI-evaluated products (not all scraped products)
- Price is the suggested selling price calculated by AI, not the cost price
- All prices are rounded to integers (no decimal places)
- Firebase storage has been removed - no evaluation IDs returned


2.2. Shopify Integration

Endpoint: POST /api/products

Description: Batch create products in Shopify store. This endpoint is separate from the scraping/evaluation pipeline and is used for direct product import to Shopify.

Note: This endpoint requires Shopify configuration in environment variables.



3. Request/Response Formats

Example Request 1: Basic Scraping with Default Criteria

POST /api/crawl-products
Content-Type: application/json

{
  "productName": "tai nghe",
  "platform": "tiki"
}

Result: Uses default criteria from ai-config.js

Example Request 2: Custom Criteria - High Profit Focus

POST /api/crawl-products
Content-Type: application/json

{
  "productName": "laptop gaming",
  "platform": "tiki",
  "criteria": {
    "weights": {
      "profitWeight": 0.7,
      "reviewWeight": 0.3,
      "trendWeight": 0.0
    },
    "thresholds": {
      "minReviewScore": 3.0,
      "minReviewCount": 5,
      "minProfitMargin": 0.25,
      "minFinalScore": 0.60
    }
  }
}

Result: Prioritizes profit (70%) over reviews (30%), requires higher profit margin (25%)

Example Request 3: Custom Criteria - Review Focus

POST /api/crawl-products
Content-Type: application/json

{
  "productName": "iphone 15",
  "platform": "tiki",
  "criteria": {
    "weights": {
      "profitWeight": 0.3,
      "reviewWeight": 0.7,
      "trendWeight": 0.0
    },
    "thresholds": {
      "minReviewScore": 4.5,
      "minReviewCount": 50,
      "minProfitMargin": 0.15,
      "minFinalScore": 0.50
    }
  }
}

Result: Prioritizes reviews (70%) over profit (30%), requires high rating (4.5+) and many reviews (50+)



4. Error Handling

Standard Error Response Format:

{
  "success": false,
  "error": "Error message describing what went wrong"
}

HTTP Status Codes:

Code: 200
Description: Successful request. Check "success" field in response body.

Code: 400
Description: Bad Request. Invalid input parameters or missing required fields.

Code: 500
Description: Internal Server Error. Server or service failure (scraping, AI, database).

Common Error Scenarios:

Scenario: Missing productName
Status: 400
Response: {"success": false, "error": "Missing required fields"}

Scenario: Invalid platform
Status: 400
Response: {"success": false, "error": "Unsupported platform"}

Scenario: Scraping service failed
Status: 500
Response: {"success": false, "error": "Scraping failed"}

Scenario: AI evaluation failed
Status: 500
Response: {"success": false, "error": "AI evaluation failed"}

Scenario: No products meet thresholds
Status: 200
Response: {"success": true, "totalProducts": 0, "products": []}



5. Configuration

Default Criteria (from ai-config.js):

Weights:
- profitWeight: 0.6 (60%)
- reviewWeight: 0.4 (40%)
- trendWeight: 0.0 (0%)

Thresholds:
- minReviewScore: 2.0 stars
- minReviewCount: 10 reviews
- minProfitMargin: 0.20 (20%)
- minFinalScore: 0.50 (50%)

Pricing Strategy (Markup Calculation):

Products 1-50,000 VND: 20% markup
Products 51,000-200,000 VND: 30% markup
Products 200,001+ VND: 40% markup

Shopify Fees:
- Transaction fee: 2.9% of selling price
- Fixed fee: 0.30 USD per transaction (~7,500 VND)

AI Model Configuration:

Model: gemini-2.0-flash-exp (Google Gemini 2.0 Flash Experimental)
Temperature: 0.7
Max Output Tokens: 16384
Response Format: JSON

Performance Limits:

Maximum products scraped per request: 150 (3 pages x 50 products)
Maximum products scored: All that pass basic validation
Maximum products evaluated by AI: 10 (top scored products)
Maximum products returned: 10
Request timeout: 60 seconds
Expected response time: 15-30 seconds

Platform-Specific Notes:

Tiki:
- API-based scraping (faster, more reliable)
- Returns structured data with ratings and reviews
- URL format: https://tiki.vn/{url_key}.html

eBay:
- Puppeteer-based scraping (slower, less reliable)
- May have fewer reviews than Tiki
- Scoring adjusted for lower review counts

Environment Variables Required:

GEMINI_API_KEY: Google Gemini API key (required for AI evaluation)
PORT: Server port (default: 3000)
NODE_ENV: Environment mode (development/production)

Optional:
SHOPIFY_SHOP_NAME: Shopify store name (for /api/products endpoint)
SHOPIFY_ACCESS_TOKEN: Shopify API token (for /api/products endpoint)