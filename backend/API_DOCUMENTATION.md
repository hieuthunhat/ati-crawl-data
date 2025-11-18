# 📚 API Documentation
## Tiki Backend API with AI Evaluation - Complete Reference

**Base URL**: `http://localhost:3000`

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Main Endpoint - Scraping with AI Evaluation](#main-endpoint)
   - [Scrape Products with Automatic AI Evaluation](#scrape-products-with-automatic-ai-evaluation)
   - [Retrieve Evaluation by ID](#retrieve-evaluation-by-id)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [Response Formats](#response-formats)

---

## 🔐 Authentication

Currently, the API does not require authentication. Firebase-backed storage uses optional user IDs for filtering evaluation history.

**Future**: OAuth 2.0 / JWT authentication planned.

---

## 🛒 Main Endpoint

### **Scrape Products with Automatic AI Evaluation**

Scrapes products from supported platforms (Tiki, Chotot, eBay) and **automatically evaluates them with AI**.

**Endpoint**: `POST /api/crawledProducts`

**Request Body**:
````json
{
  "productName": "tai nghe bluetooth",
  "platform": "tiki",
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
  "storeResults": true,
  "userId": "user123",
  "sessionId": "session456"
}
````

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `productName` | string | Yes | Search query string (e.g., "tai nghe", "iphone") |
| `platform` | string | Yes | Platform to scrape: `tiki`, `chotot`, `ebay` |
| `criteria` | object | No | Custom AI evaluation criteria |
| `criteria.weights` | object | No | Scoring weights (must sum to 1.0) - defaults from config |
| `criteria.thresholds` | object | No | Quality threshold values - defaults from config |
| `userId` | string | No | User identifier for metadata tracking (optional) |
| `sessionId` | string | No | Session identifier for metadata tracking (optional) |

**Processing Pipeline**:
1. **Scraping** - Extracts products from selected platform (2-5 seconds)
2. **Mathematical Scoring** - Calculates profit, review, trend scores (1-2 seconds)
3. **AI Evaluation** - Gemini analyzes top 10 products (10-20 seconds)
4. **Response Formatting** - Transforms to clean JSON format (instant)
5. **Response** - Returns formatted evaluated products directly

**Key Feature**: Direct response without Firebase storage - faster and simpler pipeline.

**Response** (200 OK):
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
    // ... more products
  ]
}
````

**Key Changes from Previous Version**:
- ✅ **Evaluated products returned**: Instead of raw scraped products, the response now contains AI-evaluated products from Firebase
- ✅ **Firebase ID included**: `evaluationId` can be used to retrieve results later
- ✅ **Summary statistics**: Quick overview of scraping and evaluation results
- ✅ **No raw scraped data**: Scraped products are stored in Firebase but not returned (reduces response size)
- ✅ **Retrieved timestamp**: Shows when data was fetched from Firebase

**Error Responses**:
- `400 Bad Request` - Invalid platform, missing productName, or invalid criteria
- `500 Internal Server Error` - Scraping failed or AI evaluation error
- `503 Service Unavailable` - Gemini API unavailable (evaluation skipped, scraping still returns)

**Notes**:
- **All AI parameters are optional** - If not provided, uses defaults from `ai-config.js`
- **Partial criteria merge** - Provide only weights or thresholds you want to override
- **Response time**: Typically 15-30 seconds (scraping + AI evaluation)
- **Graceful degradation**: If AI fails, you still get scraped products
- **Top 10 rule**: Only top 10 scored products sent to AI (performance optimization)

---

### **Retrieve Evaluation by ID**

Get previously stored evaluation results from Firebase using the evaluation ID.

**Endpoint**: `GET /api/evaluations/:id`

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Firebase evaluation document ID (from previous response) |

**Example Request**:
````bash
GET /api/evaluations/eval_1730887800_abc123
````

**Response** (200 OK):
````json
{
  "success": true,
  "message": "Evaluation retrieved successfully",
  "evaluationId": "eval_1730887800_abc123",
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
    }
    // ... more products
  ]
}
````

**Product Object Structure**:
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique product identifier |
| `name` | string | Product name/title |
| `price` | number | **Suggested selling price** (AI-calculated with markup + fees) in VND |
| `avgRating` | number | Average rating (0-5) |
| `ratingNum` | number | Number of ratings/reviews |
| `imageUrl` | string | Product image URL |

**Key Changes from Previous Version**:
- ✅ **Simplified response**: Clean, flat product array instead of nested complex structure
- ✅ **Frontend-ready format**: Direct mapping to UI components
- ✅ **Consistent field names**: `avgRating` and `ratingNum` across all platforms
- ✅ **Smart pricing**: Returns AI-calculated suggested selling price (not cost price)
- ✅ **Reduced payload size**: Only essential product information returned
- ✅ **AI evaluation data**: Stored in Firebase but not returned (keeps response clean)

**Error Responses**:

**404 Not Found** - Evaluation ID doesn't exist:
````json
{
  "success": false,
  "error": "Evaluation not found",
  "details": "Evaluation with ID eval_invalid123 not found"
}
````

**400 Bad Request** - Missing evaluation ID:
````json
{
  "success": false,
  "error": "Evaluation ID is required"
}
````

**Use Cases**:
- 📥 **Retrieve historical evaluations** without re-scraping
- 📊 **Compare evaluations** from different time periods
- 🔄 **Share evaluation results** using the ID
- 💾 **Reduce API calls** by caching evaluation IDs

---

## 🚨 Error Handling

### **Standard Error Response Format**

````json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "details": "Additional error details (stack trace in development)"
}
````

### **HTTP Status Codes**

| Code | Meaning | When Used |
|------|---------|-----------|
| `200` | OK | Successful request |
| `400` | Bad Request | Invalid input parameters |
| `404` | Not Found | Resource doesn't exist |
| `500` | Internal Server Error | Server/service failure |
| `503` | Service Unavailable | External service down (Gemini, Firebase) |

---

## ⏱️ Rate Limiting

### **Scraping Endpoint**
- **Limit**: 20 requests per minute per IP
- **Response Time**: 15-30 seconds (includes AI evaluation)
- **Cooldown**: 1 minute after limit reached

### **Rate Limit Headers**
````
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1699282800
````

**Note**: AI evaluation is automatic and included in scraping time. No separate rate limit for AI.

---

## 📊 Response Formats

### **Product Object**

````json
{
  "id": number,
  "name": string,
  "price": number,
  "original_price": number,
  "discount_rate": number,
  "rating_average": number (0-5),
  "review_count": number,
  "quantity_sold": {
    "value": number,
    "text": string
  },
  "seller": {
    "name": string,
    "id": number
  },
  "thumbnail_url": string,
  "url_path": string,
  "badges": string[]
}
````

### **Scored Product Object**

````json
{
  "productId": number,
  "productName": string,
  "costPrice": number,
  "sellingPrice": number,
  "netProfit": number,
  "profitMargin": number,
  "scores": {
    "profitScore": number (0-1),
    "reviewScore": number (0-1),
    "trendScore": number (0-1),
    "finalScore": number (0-1)
  },
  "meetsThresholds": boolean,
  "rating": number,
  "reviewCount": number
}
````

### **AI Evaluated Product Object**

````json
{
  "productId": number,
  "productName": string,
  "rank": number,
  "scores": {
    "profitScore": number (0-1),
    "reviewScore": number (0-1),
    "trendScore": number (0-1),
    "finalScore": number (0-1)
  },
  "pricing": {
    "costPrice": number,
    "suggestedSellingPrice": number,
    "shopifyFee": number,
    "netProfit": number,
    "profitMargin": number
  },
  "analysis": {
    "strengths": string[],
    "weaknesses": string[],
    "riskLevel": "low" | "medium" | "high",
    "recommendation": string
  }
}
````

---

## 🔍 Query Examples

### **Example 1: Basic Scraping with Default AI Evaluation**

````bash
curl -X POST http://localhost:3000/api/crawledProducts \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "tai nghe",
    "platform": "tiki"
  }'
````

**Result**: Scrapes products + AI evaluation with default criteria

---

### **Example 2: Custom AI Criteria**

````bash
curl -X POST http://localhost:3000/api/crawledProducts \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "iphone 15",
    "platform": "tiki",
    "criteria": {
      "weights": {
        "profitWeight": 0.5,
        "reviewWeight": 0.3,
        "trendWeight": 0.2
      },
      "thresholds": {
        "minReviewScore": 4.5,
        "minReviewCount": 50,
        "minProfitMargin": 0.25
      }
    },
    "userId": "user123"
  }'
````

**Result**: Prioritizes profit (50%) over reviews (30%)

---

### **Example 3: Without Firebase Storage**

````bash
curl -X POST http://localhost:3000/api/crawledProducts \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "laptop",
    "platform": "chotot",
    "storeResults": false
  }'
````

**Result**: Scrapes + evaluates but doesn't save to Firebase

---

### **Example 4: With Session Tracking**

````bash
curl -X POST http://localhost:3000/api/crawledProducts \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "camera",
    "platform": "ebay",
    "userId": "user456",
    "sessionId": "research-session-001"
  }'
````

**Result**: Groups this evaluation under specific session for later filtering

---

## 📝 Notes

### **Automatic AI Integration**
- **AI evaluation runs automatically** after every scraping request
- **No separate endpoint needed** - One request does it all
- **Optional parameters** - All AI settings have sensible defaults
- **Graceful degradation** - If AI fails, you still get scraped products

### **Data Persistence**
- Evaluations stored in Firebase Firestore collection: `ai-evaluations`
- Each evaluation gets unique ID: `eval_{timestamp}_{random}`
- Stored indefinitely unless manually deleted
- Queryable by userId, sessionId, timestamp (via Firebase directly)

### **AI Model Behavior**
- **Model**: Gemini 2.0 Flash Experimental (`gemini-2.0-flash-exp`)
- **Temperature**: 0.7 provides balanced creativity/consistency
- **Top 20 limit**: Only top 20 scored products sent to AI (performance optimization)
- **Response time**: 10-20 seconds for AI analysis
- Mathematical scoring applied to all products first

### **Performance Considerations**
- **Total response time**: 15-30 seconds (scraping 2-5s + AI 10-20s + storage 1s)
- **Timeout**: Server configured for 60-second timeout
- **Concurrent requests**: System handles multiple simultaneous scrapes
- **Memory**: AI processing uses ~150MB additional RAM

### **Default Criteria**
If not provided in request, these defaults are used:
````json
{
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
}
````

---

**Version**: 2.0.0  
**Last Updated**: November 6, 2025  
**API Stability**: Beta
