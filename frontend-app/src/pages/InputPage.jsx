import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './InputPage.css'

function InputPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    productName: 'tai nghe bluetooth',
    platform: 'tiki',
    criteria: {
      weights: {
        profitWeight: 0.4,
        reviewWeight: 0.4,
        trendWeight: 0.2
      },
      thresholds: {
        minReviewScore: 4.0,
        minReviewCount: 10,
        minProfitMargin: 0.20,
        minFinalScore: 0.50
      }
    },
    storeResults: true
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleWeightChange = (weight, value) => {
    setFormData(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        weights: {
          ...prev.criteria.weights,
          [weight]: parseFloat(value)
        }
      }
    }))
  }

  const handleThresholdChange = (threshold, value) => {
    setFormData(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        thresholds: {
          ...prev.criteria.thresholds,
          [threshold]: parseFloat(value)
        }
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:3000/api/crawl-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Navigate to products page with data
      navigate('/products', { state: { data } })
    } catch (err) {
      setError(err.message)
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="input-container">
      <h1>Product Scraper & Analyzer</h1>
      <p className="subtitle">Tìm kiếm và phân tích sản phẩm từ các sàn thương mại điện tử</p>

      {error && (
        <div className="error-message">
          ❌ Lỗi: {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="scraper-form">
        {/* Basic Info */}
        <div className="form-section">
          <h2>Thông tin cơ bản</h2>
          
          <div className="form-group">
            <label htmlFor="productName">Tên sản phẩm:</label>
            <input
              type="text"
              id="productName"
              value={formData.productName}
              onChange={(e) => handleInputChange('productName', e.target.value)}
              placeholder="Nhập tên sản phẩm..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="platform">Platform:</label>
            <select
              id="platform"
              value={formData.platform}
              onChange={(e) => handleInputChange('platform', e.target.value)}
            >
              <option value="tiki">Tiki</option>
              <option value="ebay">eBay</option>
              <option value="chotot">Chợ Tốt</option>
            </select>
          </div>
        </div>

        {/* Weights */}
        <div className="form-section">
          <h2>Trọng số đánh giá</h2>
          
          <div className="form-group">
            <label htmlFor="profitWeight">
              Profit Weight: {formData.criteria.weights.profitWeight}
            </label>
            <input
              type="range"
              id="profitWeight"
              min="0"
              max="1"
              step="0.1"
              value={formData.criteria.weights.profitWeight}
              onChange={(e) => handleWeightChange('profitWeight', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reviewWeight">
              Review Weight: {formData.criteria.weights.reviewWeight}
            </label>
            <input
              type="range"
              id="reviewWeight"
              min="0"
              max="1"
              step="0.1"
              value={formData.criteria.weights.reviewWeight}
              onChange={(e) => handleWeightChange('reviewWeight', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="trendWeight">
              Trend Weight: {formData.criteria.weights.trendWeight}
            </label>
            <input
              type="range"
              id="trendWeight"
              min="0"
              max="1"
              step="0.1"
              value={formData.criteria.weights.trendWeight}
              onChange={(e) => handleWeightChange('trendWeight', e.target.value)}
            />
          </div>
        </div>

        {/* Thresholds */}
        <div className="form-section">
          <h2>Ngưỡng lọc</h2>
          
          <div className="form-group">
            <label htmlFor="minReviewScore">Min Review Score:</label>
            <input
              type="number"
              id="minReviewScore"
              min="0"
              max="5"
              step="0.1"
              value={formData.criteria.thresholds.minReviewScore}
              onChange={(e) => handleThresholdChange('minReviewScore', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="minReviewCount">Min Review Count:</label>
            <input
              type="number"
              id="minReviewCount"
              min="0"
              step="1"
              value={formData.criteria.thresholds.minReviewCount}
              onChange={(e) => handleThresholdChange('minReviewCount', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="minProfitMargin">Min Profit Margin:</label>
            <input
              type="number"
              id="minProfitMargin"
              min="0"
              max="1"
              step="0.05"
              value={formData.criteria.thresholds.minProfitMargin}
              onChange={(e) => handleThresholdChange('minProfitMargin', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="minFinalScore">Min Final Score:</label>
            <input
              type="number"
              id="minFinalScore"
              min="0"
              max="1"
              step="0.05"
              value={formData.criteria.thresholds.minFinalScore}
              onChange={(e) => handleThresholdChange('minFinalScore', e.target.value)}
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={loading}
        >
          {loading ? '⏳ Đang xử lý...' : '🔍 Bắt đầu scraping'}
        </button>
      </form>
    </div>
  )
}

export default InputPage
