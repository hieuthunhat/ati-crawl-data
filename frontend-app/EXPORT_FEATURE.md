# Export to Shopify Feature

## 🎯 Tính năng mới

Cho phép export các sản phẩm đã chọn lên Shopify store với credentials động.

## 🚀 Cách sử dụng

### 1. Chọn sản phẩm
- Chọn các sản phẩm bằng checkbox
- Hoặc dùng "Select All" để chọn tất cả

### 2. Export Options
Có 2 nút export:

#### 💾 Download JSON
- Download sản phẩm đã chọn dưới dạng file JSON
- Không cần credentials

#### 🚀 Export to Shopify
- Mở modal để nhập Shopify credentials
- Export trực tiếp lên Shopify store

### 3. Nhập Shopify Credentials

Modal sẽ yêu cầu:

**Shop Domain:**
- Format: `your-store.myshopify.com`
- Hoặc chỉ: `your-store` (tự động thêm .myshopify.com)

**Access Token:**
- Shopify Admin API access token
- Format: `shpat_xxxxxxxxxxxxx`
- Lấy từ: Shopify Admin → Apps → Develop apps

### 4. Xác nhận Export
- Click "🚀 Export ngay"
- Đợi quá trình export hoàn tất
- Modal sẽ hiển thị thông báo thành công

## 📡 API Endpoint

### POST `/api/products`

**Request Body:**
```json
{
  "shopDomain": "my-store.myshopify.com",
  "accessToken": "shpat_xxxxxxxxxxxxx",
  "products": [
    {
      "id": "276117054",
      "name": "Tai nghe Bluetooth Apple AirPods 4",
      "price": 4396000,
      "avgRating": 4.7,
      "ratingNum": 88,
      "imageUrl": "https://..."
    }
  ]
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Successfully created 3 out of 3 products",
  "summary": {
    "total": 3,
    "successful": 3,
    "failed": 0
  },
  "results": [
    {
      "index": 0,
      "productId": "276117054",
      "productName": "Tai nghe Bluetooth...",
      "success": true,
      "shopifyProductId": "8234567890"
    }
  ]
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Missing required fields: shopDomain and accessToken"
}
```

## 🔧 Product Transformation

Dữ liệu từ Tiki/eBay/Chotot sẽ được transform sang Shopify format:

```javascript
{
  title: product.name,           // Tên sản phẩm
  body_html: "",                  // Mô tả (có thể mở rộng)
  vendor: "Unknown",              // Nhà cung cấp
  product_type: "General",        // Loại sản phẩm
  variants: [{
    price: product.price,         // Giá
    sku: product.id,              // SKU
    inventory_quantity: 0         // Tồn kho
  }],
  images: [{
    src: product.imageUrl         // Hình ảnh
  }],
  tags: `rating:${product.avgRating}` // Tags với rating
}
```

## ✨ Features

- ✅ Modal popup đẹp mắt
- ✅ Validation input
- ✅ Loading state khi export
- ✅ Error handling
- ✅ Success notification
- ✅ Batch processing (từng sản phẩm một)
- ✅ Detailed result summary
- ✅ Auto-close modal sau khi thành công

## 🔐 Security Notes

**⚠️ Quan trọng:**
- Access token rất nhạy cảm
- Không lưu token ở frontend
- Chỉ gửi qua HTTPS trong production
- Nên implement token encryption ở backend

## 🧪 Testing

### Test với Shopify Development Store

1. Tạo development store: https://partners.shopify.com/
2. Tạo Custom App trong Admin
3. Enable Admin API access
4. Copy access token
5. Test với domain: `your-dev-store.myshopify.com`

### Sample Test Data

```javascript
// Good credentials
shopDomain: "my-test-store.myshopify.com"
accessToken: "shpat_1234567890abcdef"

// Bad credentials
shopDomain: "" // Error: Missing required fields
accessToken: "invalid" // Error: Unauthorized
```

## 📝 TODO / Improvements

- [ ] Bulk import với rate limiting
- [ ] Progress bar cho export nhiều sản phẩm
- [ ] Save credentials (encrypted) cho lần sau
- [ ] Preview trước khi export
- [ ] Edit product data trước khi export
- [ ] Mapping fields customize
- [ ] Export history log
- [ ] Rollback failed imports

## 🐛 Troubleshooting

**Error: "Unauthorized"**
- Check access token còn hạn không
- Kiểm tra permissions của app

**Error: "Shop not found"**
- Kiểm tra format shop domain
- Đảm bảo store còn active

**Error: "Rate limit exceeded"**
- Shopify có rate limit: 2 requests/second
- Thêm delay giữa các requests

## 📚 References

- [Shopify Admin API](https://shopify.dev/api/admin)
- [shopify-api-node Package](https://github.com/MONEI/Shopify-api-node)
- [Product API](https://shopify.dev/api/admin-rest/2024-01/resources/product)
