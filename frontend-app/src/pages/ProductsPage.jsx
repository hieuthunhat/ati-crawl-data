import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './ProductsPage.css'

function ProductsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const responseData = location.state?.data || {}
  
  const [selectedProducts, setSelectedProducts] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [productQuantities, setProductQuantities] = useState({})
  const [showUrlForProducts, setShowUrlForProducts] = useState({}) // Track quantity for each product
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [shopDomain, setShopDomain] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState(null)
  const [exportSuccess, setExportSuccess] = useState(false)
  
  const products = responseData.products || []
  const totalProducts = responseData.totalProducts || 0
  const platform = responseData.platform || ''
  const query = responseData.query || ''

  const handleSelectAll = (e) => {
    const checked = e.target.checked
    setSelectAll(checked)
    if (checked) {
      setSelectedProducts(products.map(p => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId)
      } else {
        return [...prev, productId]
      }
    })
  }

  const handleExportClick = () => {
    if (selectedProducts.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm để export')
      return
    }
    setShowModal(true)
    setExportError(null)
    setExportSuccess(false)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setShopDomain('')
    setAccessToken('')
    setExportError(null)
    setExportSuccess(false)
  }

  const handleQuantityChange = (productId, quantity) => {
    setProductQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, parseInt(quantity) || 0)
    }))
  }

  const getProductQuantity = (productId) => {
    return productQuantities[productId] || 100
  }

  const handleToggleShowUrl = (productId) => {
    setShowUrlForProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }))
  }

  const shouldShowUrl = (productId) => {
    return showUrlForProducts[productId] || false
  }

  const handleExportToShopify = async () => {
    // Clean and validate inputs
    const cleanShopDomain = shopDomain.trim().replace(/[\r\n\t]/g, '');
    const cleanAccessToken = accessToken.trim().replace(/[\r\n\t]/g, '');
    
    if (!cleanShopDomain || !cleanAccessToken) {
      setExportError('Vui lòng nhập đầy đủ Shop Domain và Access Token')
      return
    }
    
    // Validate token format (should start with shpat_ or shpca_ or shpss_)
    if (!cleanAccessToken.match(/^shp[a-z]{2}_[a-zA-Z0-9_]+$/)) {
      setExportError('Access Token không hợp lệ. Token phải bắt đầu với "shpat_", "shpca_", hoặc "shpss_"')
      return
    }

    setIsExporting(true)
    setExportError(null)

    try {
      const selectedData = products.filter(p => selectedProducts.includes(p.id))
      
      const productsWithInventory = selectedData.map(p => ({
        ...p,
        inventoryQuantity: getProductQuantity(p.id),
        url: shouldShowUrl(p.id) ? p.url : undefined
      }))
      
      console.log(`Sending ${productsWithInventory.length} products to Shopify`);
      console.log('First product:', productsWithInventory[0]?.name);
      console.log('Last product:', productsWithInventory[productsWithInventory.length - 1]?.name);
      
      const response = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopDomain: cleanShopDomain,
          accessToken: cleanAccessToken,
          products: productsWithInventory
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setExportSuccess(true)
      
      // Auto close modal after 2 seconds on success
      setTimeout(() => {
        handleCloseModal()
      }, 2000)
      
      console.log('Export success:', result)
    } catch (err) {
      setExportError(err.message)
      console.error('Export error:', err)
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadJSON = () => {
    const selectedData = products.filter(p => selectedProducts.includes(p.id))
    const blob = new Blob([JSON.stringify(selectedData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `selected-products-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
  }

  return (
    <div className="products-page">
      <div className="products-header">
        <div className="header-left">
          <button onClick={() => navigate('/')} className="back-btn">
            ← Quay lại
          </button>
          <h1>Danh sách sản phẩm</h1>
        </div>
        <div className="header-actions">
          {selectedProducts.length > 0 && (
            <>
              <button onClick={handleDownloadJSON} className="download-btn">
                💾 Download JSON ({selectedProducts.length})
              </button>
              <button onClick={handleExportClick} className="export-btn">
                � Export to Shopify ({selectedProducts.length})
              </button>
            </>
          )}
        </div>
      </div>

      <div className="products-info">
        <div className="info-card">
          <span className="info-label">Tổng số sản phẩm:</span>
          <span className="info-value">{totalProducts}</span>
        </div>
        <div className="info-card">
          <span className="info-label">Platform:</span>
          <span className="info-value">{platform}</span>
        </div>
        <div className="info-card">
          <span className="info-label">Từ khóa:</span>
          <span className="info-value">{query}</span>
        </div>
        {responseData.evaluationId && (
          <div className="info-card">
            <span className="info-label">Evaluation ID:</span>
            <span className="info-value">{responseData.evaluationId}</span>
          </div>
        )}
      </div>

      <div className="table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="image-col">Hình ảnh</th>
              <th className="name-col">Tên sản phẩm</th>
              <th className="price-col">Giá</th>
              <th className="rating-col">Rating</th>
              <th className="reviews-col">Số đánh giá</th>
              <th className="quantity-col">Số lượng kho</th>
              <th className="url-col">Link sản phẩm</th>
              <th className="show-url-col">Thêm URL vào Shopify</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr
                  key={product.id}
                  className={selectedProducts.includes(product.id) ? 'selected' : ''}
                >
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                    />
                  </td>
                  <td className="image-col">
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="product-thumbnail"
                      />
                    )}
                  </td>
                  <td className="name-col">
                    <div className="product-name">{product.name}</div>
                  </td>
                  <td className="price-col">
                    <span className="price-value">
                      {formatPrice(product.price)}
                    </span>
                  </td>
                  <td className="rating-col">
                    <span className="rating-badge">
                      ⭐ {product.avgRating?.toFixed(1) || 'N/A'}
                    </span>
                  </td>
                  <td className="reviews-col">
                    <span className="reviews-count">
                      {product.ratingNum || 0}
                    </span>
                  </td>
                  <td className="quantity-col">
                    <input
                      type="number"
                      className="quantity-input"
                      value={getProductQuantity(product.id)}
                      onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                      min="0"
                      placeholder="100"
                    />
                  </td>
                  <td className="url-col">
                    {product.url ? (
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="product-link"
                        title={product.url}
                      >
                        🔗 Xem
                      </a>
                    ) : (
                      <span className="no-link">N/A</span>
                    )}
                  </td>
                  <td className="show-url-col">
                    <input
                      type="checkbox"
                      checked={shouldShowUrl(product.id)}
                      onChange={() => handleToggleShowUrl(product.id)}
                      disabled={!product.url}
                      title={shouldShowUrl(product.id) ? "URL sẽ được thêm vào Shopify" : "URL sẽ không được thêm vào Shopify"}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <p>
          Đã chọn: <strong>{selectedProducts.length}</strong> / {products.length} sản phẩm
        </p>
      </div>

      {/* Shopify Export Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Export to Shopify</h2>
              <button onClick={handleCloseModal} className="modal-close">
                ✕
              </button>
            </div>

            <div className="modal-body">
              {exportSuccess ? (
                <div className="success-message">
                  ✅ Export thành công {selectedProducts.length} sản phẩm!
                </div>
              ) : (
                <>
                  {exportError && (
                    <div className="error-message-modal">
                      ❌ {exportError}
                    </div>
                  )}

                  <div className="form-group-modal">
                    <label htmlFor="shopDomain">
                      Shop Domain: <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="shopDomain"
                      value={shopDomain}
                      onChange={(e) => setShopDomain(e.target.value.trim())}
                      placeholder="your-store.myshopify.com"
                      disabled={isExporting}
                      autoComplete="off"
                    />
                    <small>Ví dụ: my-store.myshopify.com hoặc my-store</small>
                  </div>

                  <div className="form-group-modal">
                    <label htmlFor="accessToken">
                      Access Token: <span className="required">*</span>
                    </label>
                    <input
                      type="password"
                      id="accessToken"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value.trim())}
                      placeholder="shpat_xxxxxxxxxxxxx"
                      disabled={isExporting}
                      autoComplete="off"
                      spellCheck="false"
                    />
                    <small>Admin API access token của Shopify (bắt đầu với shpat_ hoặc shpca_)</small>
                  </div>

                  <div className="modal-info">
                    <p>📦 Sẽ export <strong>{selectedProducts.length}</strong> sản phẩm đã chọn</p>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              {!exportSuccess && (
                <>
                  <button
                    onClick={handleCloseModal}
                    className="btn-cancel"
                    disabled={isExporting}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleExportToShopify}
                    className="btn-submit"
                    disabled={isExporting}
                  >
                    {isExporting ? '⏳ Đang export...' : '🚀 Export ngay'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductsPage
