# Shopify Integration Documentation

## Product Creation Flow

Khi export sản phẩm lên Shopify, hệ thống thực hiện các bước sau:

### 1. **Tạo Product với GraphQL `productSet` Mutation**
```graphql
mutation CreateProductWithLocation {
  productSet(input: {
    title: "Product Name"
    descriptionHtml: "<p>Description</p>"
    variants: [{
      price: "100.00"
      sku: "SKU-123"
      inventoryQuantities: [{
        locationId: "gid://shopify/Location/xxxxx"
        quantity: 100
      }]
    }]
  })
}
```

**Features:**
- Tạo product với title, description
- Set giá và SKU cho variant
- Cấu hình inventory tại location cụ thể
- SKU tự động được tối ưu (max 255 ký tự)

### 2. **Upload Product Image (REST API)**
```javascript
await shopify.productImage.create(productId, {
  src: imageUrl
});
```

**Lý do dùng REST API:**
- GraphQL `productSet` không hỗ trợ upload image trực tiếp
- REST API cho phép upload image từ URL
- Lỗi upload image không làm fail toàn bộ quá trình

### 3. **Publish Product to Sales Channels**

**Step 1: Query Available Publications**
```graphql
query GetPublications {
  publications(first: 10) {
    edges {
      node {
        id
        name
      }
    }
  }
}
```

**Step 2: Publish to Channels**
```graphql
mutation productPublish($id: ID!, $input: [PublicationInput!]!) {
  productPublish(id: $id, input: $input) {
    product {
      id
      title
    }
    productPublications {
      publication {
        id
        name
      }
      publishDate
      isPublished
    }
    userErrors {
      field
      message
    }
  }
}
```

**Features:**
- Tự động query tất cả sales channels có sẵn (Online Store, POS, etc.)
- Publish product lên TẤT CẢ channels cùng lúc
- Kiểm tra `isPublished: true` để xác nhận thành công
- Product sẽ hiển thị ngay trên tất cả channels
- Lỗi publish không làm fail toàn bộ quá trình
- Detailed logging với tên channels được publish

## Error Handling

### 1. **SKU Too Long Error**
**Problem:** Shopify giới hạn SKU tối đa 255 ký tự

**Solution:**
- Nếu Product ID ≤ 200 chars: `SKU-{productId}`
- Nếu Product ID > 200 chars: `SKU-{hash}-{timestamp}`
- Nếu không có ID: `SKU-{timestamp}-{random}`

### 2. **Image Upload Failure**
**Behavior:** Warning log, không fail toàn bộ process

**Console Output:**
```
⚠ Failed to add image: [error message]
```

### 3. **Publish Failure**
**Behavior:** Warning log, không fail toàn bộ process

**Console Output:**
```
⚠ Failed to publish product: [error message]
```

## Success Flow Console Output

```
Creating product 1/10: Tai nghe bluetooth V9
Creating Shopify product: Tai nghe bluetooth V9 (Price: 120.00, Stock: 100, SKU: SKU-275350728)
✓ Image added for product: Tai nghe bluetooth V9
Attempting to publish product: gid://shopify/Product/123456789
Publish result: { ... }
✓ Product published to 2 channel(s): Online Store, Point of Sale
✓ Product created successfully: Tai nghe bluetooth V9 (ID: gid://shopify/Product/123456789)
```

## Required Shopify Permissions

Access Token cần có các permissions sau:
- `write_products` - Tạo và chỉnh sửa products
- `read_locations` - Đọc thông tin location cho inventory
- `write_inventory` - Cập nhật inventory quantities
- `write_publications` - Publish products lên sales channels
- `read_publications` - Đọc danh sách sales channels có sẵn

## API Rate Limits

- Shopify có rate limit cho API calls
- Products được tạo tuần tự (sequential) để tránh vượt limit
- Mỗi product tạo 4 API calls:
  1. GraphQL productSet mutation (tạo product)
  2. REST API image upload (upload hình)
  3. GraphQL publications query (lấy danh sách channels)
  4. GraphQL productPublish mutation (publish lên channels)

## Configuration

### Backend (`backend/handlers.js`)
```javascript
app.use(express.json({ limit: '50mb' }));
```
- Tăng payload limit để xử lý batch lớn

### Frontend Validation
```javascript
// Token format validation
cleanAccessToken.match(/^shp[a-z]{2}_[a-zA-Z0-9_]+$/)
```
- Validate token format trước khi gửi request

## Testing

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd frontend-app
   npm run dev
   ```

3. **Test Export:**
   - Select products
   - Click "Export to Shopify"
   - Enter credentials:
     - Shop Domain: `your-store` or `your-store.myshopify.com`
     - Access Token: Valid token starting with `shpat_` or `shpca_`

## Troubleshooting

### "Invalid character in header" Error
**Cause:** Access token có ký tự không hợp lệ (whitespace, newlines)

**Fix:** Token được tự động clean bằng:
```javascript
cleanAccessToken.trim().replace(/[\r\n\t]/g, '')
```

### "SKU is too long" Error
**Cause:** Product ID > 255 characters

**Fix:** Đã implement hash-based SKU generation

### Products Not Visible on Store
**Cause:** Product chưa được publish

**Fix:** Đã thêm auto-publish sau khi tạo product

## Future Enhancements

- [ ] Batch publish multiple products
- [ ] Support multiple sales channels
- [ ] Product collections assignment
- [ ] SEO metadata optimization
- [ ] Variant management (size, color, etc.)
