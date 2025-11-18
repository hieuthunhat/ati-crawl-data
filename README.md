Product Scraping and AI Evaluation System

A comprehensive full-stack application for scraping e-commerce products from multiple platforms (Tiki, eBay) with integrated AI evaluation using Google Gemini for dropshipping profitability analysis and Shopify export capabilities.

SYSTEM OVERVIEW

This system consists of two main components:

1. Backend API Server
   - RESTful API built with Express.js
   - Multi-platform web scraping (Tiki API-based, eBay Puppeteer-based)
   - AI-powered product evaluation using Google Gemini 2.0 Flash
   - Mathematical scoring algorithm for profit, review, and trend analysis
   - Shopify product creation via GraphQL API

2. Frontend Web Application
   - React-based user interface with Vite build system
   - Product search and filtering interface
   - Real-time scraping and evaluation visualization
   - Shopify export management with inventory control
   - Selective URL inclusion for product descriptions

FEATURES

Backend Features

Multi-Platform Scraping
- Tiki: API-based scraping (fast, reliable, 3 pages per request)
- eBay: Puppeteer-based scraping (browser automation, 3 pages per request)
- Configurable page limits and delay settings
- Anti-detection measures and rate limiting

AI Evaluation System
- Automatic processing after every scrape
- Google Gemini 2.0 Flash Experimental integration
- Top 10 products evaluated based on scoring thresholds
- Profit calculation with Shopify fee consideration
- Review quality and quantity analysis
- Market trend detection
- Risk assessment and recommendations

Scoring Algorithm
- Profit Score (60%): Net profit margin after Shopify fees and markup
- Review Score (40%): Rating quality and review count
- Trend Score (0%): Sales volume and discount signals (configurable)
- Quality thresholds: Minimum rating, review count, profit margin
- Final score filtering: Only products above threshold returned

Shopify Integration
- GraphQL API product creation
- Automatic SKU generation
- Image upload support
- Inventory management
- Tiered pricing strategy
- Product description with rating and original URL

Frontend Features

User Interface
- Clean, modern design with responsive layout
- Real-time loading states and error handling
- Product search by keyword and platform selection
- Pagination support for large result sets

Product Management
- Visual product cards with images, pricing, ratings
- Batch selection with "Select All" functionality
- Individual quantity control for inventory
- URL visibility toggle for Shopify export
- Product data filtering and sorting

Export Capabilities
- JSON download of selected products
- Shopify bulk export with progress tracking
- Custom inventory quantities per product
- Selective URL inclusion in product descriptions
- Export summary with success/failure reporting

ARCHITECTURE

Technology Stack

Backend
- Runtime: Node.js v18+
- Framework: Express.js
- Scraping: Puppeteer (eBay), HTTP requests (Tiki)
- AI: Google Gemini API
- E-commerce: Shopify GraphQL API
- Module System: ES6 modules

Frontend
- Framework: React 18
- Build Tool: Vite
- Routing: React Router v6
- HTTP Client: Fetch API
- Styling: CSS3 with custom properties

Project Structure

Root Directory
crawl-data-tiki-app/
├── backend/
│   ├── config/
│   │   └── ai-config.js
│   ├── controllers/
│   │   ├── controllers.js
│   │   └── shopifyController.js
│   ├── services/
│   │   ├── evaluation/
│   │   │   ├── geminiService.js
│   │   │   └── productScoringService.js
│   │   ├── Tiki/
│   │   │   └── tikiScrapeService.js
│   │   ├── eBay/
│   │   │   └── ebayScrapeService.js
│   │   └── shopifyService/
│   │       └── shopifyService.js
│   ├── presenters/
│   │   └── productPresenter.js
│   ├── routes/
│   │   └── routes.js
│   ├── helpers/
│   │   └── helpers.js
│   ├── const/
│   │   └── const.js
│   ├── handlers.js
│   ├── server.js
│   └── package.json
├── frontend-app/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── HomePage.css
│   │   │   ├── ProductsPage.jsx
│   │   │   └── ProductsPage.css
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md

INSTALLATION AND SETUP

Prerequisites

System Requirements
- Node.js version 18.0.0 or higher
- npm version 8.0.0 or higher
- Git version 2.0.0 or higher
- Minimum 4GB RAM
- 500MB free disk space

External Services
- Google Gemini API key (https://makersuite.google.com/app/apikey)
- Shopify store with Admin API access
- Shopify Admin API access token with required scopes

Backend Setup

1. Navigate to Backend Directory

cd backend

2. Install Dependencies

npm install

3. Configure Environment Variables

Create .env file in backend directory with the following configuration:

PORT=3000
NODE_ENV=development

GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=16384

4. Start Backend Server

npm start

Server will start on http://localhost:3000

5. Verify Backend Installation

Test server health endpoint:

curl http://localhost:3000

Expected response:
{
  "message": "Backend API with AI Evaluation",
  "version": "2.0.0",
  "endpoints": {
    "crawling": {
      "products": "POST /api/crawledProducts"
    }
  }
}

Frontend Setup

1. Navigate to Frontend Directory

cd frontend-app

2. Install Dependencies

npm install

3. Configure API Endpoint

The frontend is configured to connect to backend at http://localhost:3000
To change this, edit the API URLs in:
- src/pages/HomePage.jsx
- src/pages/ProductsPage.jsx

4. Start Development Server

npm run dev

Application will start on http://localhost:5173

5. Build for Production

npm run build

Production files will be generated in dist/ directory

USAGE

Backend API Usage

1. Scrape and Evaluate Products

Endpoint: POST /api/crawl-products
Description: Scrapes products from specified platform and evaluates with AI

Request Body:
{
  "productName": "wireless headphones",
  "platform": "tiki",
  "criteria": {
    "weights": {
      "profitWeight": 0.60,
      "reviewWeight": 0.40,
      "trendWeight": 0.00
    },
    "thresholds": {
      "minReviewScore": 2.0,
      "minReviewCount": 5,
      "minProfitMargin": 0.15,
      "minFinalScore": 0.40
    }
  }
}

Parameters:
- productName (required): Search keyword
- platform (required): "tiki" or "ebay"
- criteria (optional): Custom scoring configuration

Response Structure:
{
  "success": true,
  "message": "Scraping and AI evaluation completed successfully",
  "platform": "tiki",
  "query": "wireless headphones",
  "totalProducts": 10,
  "products": [
    {
      "id": "183743642",
      "name": "Product Name",
      "price": 8036000,
      "avgRating": 4.6,
      "ratingNum": 8,
      "imageUrl": "https://...",
      "url": "https://tiki.vn/product-p183743642.html"
    }
  ]
}

2. Export to Shopify

Endpoint: POST /api/products
Description: Creates products in Shopify store

Request Body:
{
  "shopDomain": "yourstore",
  "accessToken": "shpat_xxxxxxxxxxxxxxxx",
  "products": [
    {
      "id": "183743642",
      "name": "Product Name",
      "price": 8036000,
      "avgRating": 4.6,
      "ratingNum": 8,
      "imageUrl": "https://...",
      "url": "https://tiki.vn/product-p183743642.html",
      "inventoryQuantity": 100
    }
  ]
}

Parameters:
- shopDomain (required): Shopify store domain (without .myshopify.com)
- accessToken (required): Shopify Admin API access token
- products (required): Array of product objects

Response Structure:
{
  "success": true,
  "message": "Successfully created 5 out of 5 products",
  "summary": {
    "total": 5,
    "successful": 5,
    "failed": 0
  },
  "results": [
    {
      "index": 0,
      "productId": "183743642",
      "productName": "Product Name",
      "inventoryQuantity": 100,
      "success": true,
      "shopifyProductId": "gid://shopify/Product/...",
      "shopifyHandle": "product-name"
    }
  ]
}

Frontend Application Usage

1. Search Products

Step 1: Open application at http://localhost:5173
Step 2: Enter search keyword in text input
Step 3: Select platform (Tiki or eBay)
Step 4: Click "Tim kiem san pham" button
Step 5: Wait for scraping and AI evaluation (10-30 seconds)

2. Manage Product Selection

Step 1: Review product list with images, prices, ratings
Step 2: Use checkboxes to select individual products
Step 3: Use "Select All" checkbox for batch selection
Step 4: Adjust inventory quantity for each product
Step 5: Toggle "Them URL vao Shopify" checkbox to include/exclude original URL

3. Download Product Data

Step 1: Select one or more products
Step 2: Click "Download JSON" button
Step 3: JSON file will be downloaded with selected products
Step 4: File name format: products_YYYYMMDD_HHMMSS.json

4. Export to Shopify

Step 1: Select products to export
Step 2: Click "Export to Shopify" button
Step 3: Enter Shopify store domain (without .myshopify.com)
Step 4: Enter Admin API access token (starts with shpat_, shpca_, or shpss_)
Step 5: Click "Bat dau Export" button
Step 6: Monitor progress and view results
Step 7: Review success/failure summary

CONFIGURATION

Backend Configuration

AI Configuration (config/ai-config.js)

Gemini Settings
- Model: gemini-2.0-flash-exp (configurable via GEMINI_MODEL)
- Temperature: 0.7 (controls response randomness)
- Max Tokens: 16384 (maximum response length)

Scoring Weights
- Profit Weight: 0.60 (60% of final score)
- Review Weight: 0.40 (40% of final score)
- Trend Weight: 0.00 (0% of final score)

Quality Thresholds
- Minimum Review Score: 2.0 stars
- Minimum Review Count: 5 reviews
- Minimum Profit Margin: 15%
- Minimum Final Score: 0.40

Price Tiers for Markup
- Tier 1: Price 1-50 USD, Markup 20%
- Tier 2: Price 51-200 USD, Markup 30%
- Tier 3: Price 201+ USD, Markup 40%

Shopify Fees
- Transaction Fee: 2.9%
- Fixed Fee: 0.30 USD per transaction

Scraping Configuration (const/const.js)

Tiki Settings
- Base URL: https://tiki.vn/api/v2/products
- Pages per Request: 3
- Products per Page: 50
- Total Products: 150 maximum

eBay Settings
- Base URL: https://www.ebay.com/sch/i.html
- Pages per Request: 3
- Scraping Method: Puppeteer browser automation
- Minimum Delay: 3000ms
- Maximum Delay: 6000ms
- Timeout: 30000ms

Frontend Configuration

Vite Configuration (vite.config.js)

Server Settings
- Port: 5173 (default)
- Host: localhost
- Hot Module Replacement: Enabled

Build Settings
- Output Directory: dist/
- Asset Directory: assets/
- Source Maps: Enabled in development

API Endpoints
- Backend URL: http://localhost:3000
- Scraping Endpoint: /api/crawl-products
- Shopify Export Endpoint: /api/products

SCORING ALGORITHM

The system uses a multi-factor scoring algorithm to evaluate product profitability:

1. Profit Score Calculation

Formula: (Net Profit Margin / 100) capped at 1.0

Steps:
a. Calculate Selling Price using tiered markup strategy
b. Calculate Shopify transaction fees (2.9% + 0.30 USD)
c. Calculate net profit: Selling Price - Cost Price - Fees
d. Calculate profit margin: (Net Profit / Selling Price) * 100
e. Normalize to 0-1 range

Example:
Cost Price: 100 USD
Selling Price: 140 USD (40% markup for tier 3)
Shopify Fees: 4.36 USD (2.9% + 0.30)
Net Profit: 35.64 USD
Profit Margin: 25.46%
Profit Score: 0.25

2. Review Score Calculation

Formula: (Rating / 5.0) * Review Count Factor

Review Count Factor:
- 0 reviews: 1.0 (no penalty)
- 1-4 reviews: 0.8 (20% penalty)
- 5+ reviews: 1.0 (full score)

Minimum Rating Requirements:
- No reviews: Any rating accepted
- 1-4 reviews: Minimum 3.0 stars
- 5+ reviews: Minimum 2.0 stars

Example:
Rating: 4.5 stars
Review Count: 8
Review Score: (4.5 / 5.0) * 1.0 = 0.90

3. Trend Score Calculation

Currently disabled (weight = 0.0) but can be configured

Factors:
- Discount rate (0-100%)
- Quantity sold (0-10000+)
- Product badges (best seller, new arrival)

4. Final Score Calculation

Formula: (Profit Score * 0.60) + (Review Score * 0.40) + (Trend Score * 0.00)

Quality Checks:
- Review requirements must be met
- Profit margin must be >= 15%
- Final score must be >= 0.40

Only products passing all thresholds are evaluated by AI and returned to user.

AI EVALUATION

The system uses Google Gemini 2.0 Flash Experimental for intelligent product evaluation:

Evaluation Process

1. Pre-filtering
   - Mathematical scoring of all scraped products
   - Filter by quality thresholds
   - Select top 10 products by final score

2. AI Analysis
   - Send product data to Gemini API
   - Request structured JSON response
   - Analyze profitability, market position, risks

3. Response Processing
   - Parse JSON from AI response
   - Handle truncated or malformed responses
   - Recover partial data when possible
   - Transform to simplified format

AI Prompt Structure

The system provides Gemini with:
- Product details (name, price, rating, reviews)
- Scoring metrics (profit, review, trend scores)
- Evaluation criteria and thresholds
- Request for specific analysis format

AI Response Format

For each product:
- Recommendation: Accept or Reject
- Profitability: Low, Medium, or High
- Market Position: Description of competitive landscape
- Risks: Array of potential risk factors
- Final Decision: Overall recommendation with reasoning

ERROR HANDLING

Backend Error Handling

Scraping Errors
- Platform not supported: Returns 400 error
- Network timeout: Retries with exponential backoff
- Rate limiting detected: Pauses and retries
- Invalid product data: Skips product, continues scraping

AI Evaluation Errors
- API key missing: Returns scraped products without evaluation
- API quota exceeded: Returns error message with remaining products
- Response timeout: Retries once, then returns partial results
- Malformed JSON: Attempts recovery, falls back to raw text

Shopify Export Errors
- Invalid credentials: Returns 400 error with validation message
- Product creation failed: Continues with remaining products
- Image upload failed: Creates product without image
- Rate limit exceeded: Pauses and retries

Frontend Error Handling

Network Errors
- Connection timeout: Shows error message with retry option
- Server unreachable: Displays connection error
- Invalid response: Shows parsing error message

Validation Errors
- Empty search query: Prevents submission
- No platform selected: Shows validation message
- Invalid Shopify token: Shows format requirements
- No products selected: Disables export button

User Experience
- Loading states for all async operations
- Error messages with actionable feedback
- Success confirmation for completed actions
- Progress indicators for long operations

TESTING

Backend Testing

Manual API Testing

1. Test Scraping Endpoint

curl -X POST http://localhost:3000/api/crawl-products \
  -H "Content-Type: application/json" \
  -d '{"productName":"headphones","platform":"tiki"}'

Expected: 200 OK with product array

2. Test Shopify Export

curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"shopDomain":"teststore","accessToken":"shpat_xxx","products":[...]}'

Expected: 200 OK with export summary

Frontend Testing

Manual UI Testing

1. Test Product Search
   - Enter valid keyword, click search
   - Verify loading state appears
   - Verify products displayed after completion

2. Test Product Selection
   - Click individual checkboxes
   - Click "Select All" checkbox
   - Verify selection counter updates

3. Test Export Flow
   - Select products
   - Click "Export to Shopify"
   - Enter valid credentials
   - Verify progress tracking
   - Verify success/failure summary

DEPLOYMENT

Backend Deployment

Production Environment Variables

PORT=3000
NODE_ENV=production
GEMINI_API_KEY=production_key
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=16384

Build Steps

1. Install production dependencies

npm install --production

2. Start server with process manager

pm2 start server.js --name tiki-backend

3. Configure reverse proxy (nginx)

location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

Frontend Deployment

Build for Production

1. Build application

npm run build

2. Verify build output in dist/ directory

3. Test production build locally

npm run preview

Deployment Options

Static Hosting (Netlify, Vercel)
- Upload dist/ directory
- Configure API proxy for CORS
- Set environment variables

Traditional Hosting (nginx)
- Copy dist/ to web root
- Configure nginx to serve static files
- Set up reverse proxy for API

TROUBLESHOOTING

Common Backend Issues

Issue: "GEMINI_API_KEY not configured"
Solution: Add valid API key to .env file

Issue: "Cannot connect to Shopify"
Solution: Verify store domain and access token format

Issue: "Scraping timeout"
Solution: Increase timeout in configuration or reduce pages

Issue: "Rate limit exceeded"
Solution: Add delays between requests or reduce frequency

Common Frontend Issues

Issue: "Cannot connect to backend"
Solution: Verify backend is running on http://localhost:3000

Issue: "CORS error"
Solution: Backend CORS configuration allows all origins in development

Issue: "Export fails with invalid token"
Solution: Verify token starts with shpat_, shpca_, or shpss_

Issue: "Products not displaying"
Solution: Check browser console for JavaScript errors

PERFORMANCE OPTIMIZATION

Backend Optimization

Scraping Performance
- Use API-based scraping when available (Tiki)
- Implement connection pooling for HTTP requests
- Cache frequently accessed product data
- Use parallel scraping for multiple platforms

AI Evaluation Performance
- Batch evaluate products (max 10 per request)
- Implement response caching for similar queries
- Use streaming for large responses
- Set appropriate timeout values

Database Performance
- Index frequently queried fields
- Implement pagination for large result sets
- Use connection pooling
- Cache evaluation results

Frontend Optimization

Rendering Performance
- Implement virtual scrolling for large product lists
- Use React.memo for product cards
- Lazy load images
- Debounce search input

Network Performance
- Implement request caching
- Use compression for API responses
- Minimize payload size
- Implement request cancellation

SECURITY CONSIDERATIONS

Backend Security

API Security
- Validate all input parameters
- Sanitize user-provided search queries
- Implement rate limiting per IP
- Use HTTPS in production

Credentials Management
- Store API keys in environment variables
- Never commit .env file to version control
- Rotate API keys regularly
- Use separate keys for development and production

Frontend Security

User Input Validation
- Validate search queries
- Sanitize display text
- Prevent XSS attacks
- Validate Shopify credentials format

Data Protection
- Use HTTPS for all requests
- Never store sensitive data in localStorage
- Clear session data on logout
- Implement CSRF protection

MAINTENANCE

Regular Maintenance Tasks

Weekly Tasks
- Monitor API usage and quotas
- Check error logs for issues
- Verify scraping success rates
- Review AI evaluation quality

Monthly Tasks
- Update dependencies to latest versions
- Review and optimize database queries
- Analyze performance metrics
- Update documentation

Quarterly Tasks
- Security audit of dependencies
- Performance benchmarking
- API endpoint usage analysis
- User feedback review

SUPPORT AND DOCUMENTATION

Additional Resources

API Documentation
- Located in backend/API_DOCUMENTATION.md
- Detailed endpoint specifications
- Request/response examples
- Error code reference

Code Documentation
- Inline comments for complex logic
- Function parameter descriptions
- Module dependency documentation
- Architecture decision records

External Documentation
- Google Gemini API: https://ai.google.dev/docs
- Shopify Admin API: https://shopify.dev/docs/api/admin
- Puppeteer: https://pptr.dev/
- React: https://react.dev/

LICENSE AND ATTRIBUTION

This project is proprietary software developed for internal use.

Third-Party Dependencies

Backend
- Express.js: MIT License
- Puppeteer: Apache 2.0 License
- Shopify API Node: MIT License

Frontend
- React: MIT License
- Vite: MIT License
- React Router: MIT License

VERSION HISTORY

Version 2.0.0 (Current)
- Removed Firebase storage dependency
- Added direct response format
- Improved AI evaluation speed
- Added Shopify export functionality
- Created frontend application
- Enhanced error handling

Version 1.0.0
- Initial release
- Basic scraping functionality
- Firebase integration
- Simple AI evaluation
