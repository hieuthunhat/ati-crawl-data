let selectedProducts = new Set();

// ✅ Cấu hình API backend
const API_BASE_URL = "http://localhost:3000"; // sửa lại nếu port/host khác

// Initialize slider values
const sliders = [
    { id: 'profitWeight', valueId: 'profitWeightValue' },
    { id: 'reviewWeight', valueId: 'reviewWeightValue' },
    { id: 'trendWeight', valueId: 'trendWeightValue' },
    { id: 'minReviewScore', valueId: 'minReviewScoreValue' },
    { id: 'minReviewCount', valueId: 'minReviewCountValue' },
    { id: 'minProfitMargin', valueId: 'minProfitMarginValue' },
    { id: 'minFinalScore', valueId: 'minFinalScoreValue' }
];

sliders.forEach(slider => {
    const input = document.getElementById(slider.id);
    const valueDisplay = document.getElementById(slider.valueId);

    input.addEventListener('input', (e) => {
        let value = e.target.value;
        if (slider.id === 'minProfitMargin') {
            valueDisplay.textContent = `${value} (${Math.round(value * 100)}%)`;
        } else {
            valueDisplay.textContent = value;
        }
    });
});

// Toggle advanced configuration
document.getElementById('btnAdvanced').addEventListener('click', () => {
    const section = document.getElementById('advancedSection');
    section.classList.toggle('active');
});

// Search form - Crawl & AI Analysis
document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const productName = document.getElementById('productName').value;
    const platform = document.getElementById('platform').value;
    const storeResults = document.getElementById('storeResults').checked;

    if (!productName || !platform) {
        showToast('Vui lòng nhập đầy đủ thông tin!', 'error');
        return;
    }

    // Get criteria from sliders (giữ lại để sau có thể gửi kèm lên backend)
    const criteria = {
        weights: {
            profitWeight: parseFloat(document.getElementById('profitWeight').value),
            reviewWeight: parseFloat(document.getElementById('reviewWeight').value),
            trendWeight: parseFloat(document.getElementById('trendWeight').value)
        },
        thresholds: {
            minReviewScore: parseFloat(document.getElementById('minReviewScore').value),
            minReviewCount: parseInt(document.getElementById('minReviewCount').value),
            minProfitMargin: parseFloat(document.getElementById('minProfitMargin').value),
            minFinalScore: parseFloat(document.getElementById('minFinalScore').value)
        }
    };

    const requestData = {
        productName,
        platform,
        criteria,
        storeResults
    };

    console.log('Request data (frontend):', requestData);

    const loading = document.getElementById('loading');
    const productsSection = document.getElementById('productsSection');
    const statsBar = document.getElementById('statsBar');

    loading.classList.add('active');
    document.getElementById('loadingText').textContent = 'Đang lấy dữ liệu sản phẩm từ backend...';

    try {
        // ✅ GỌI API BACKEND /product (GET)
        // Nếu backend là app.use("/product", productRoutes) thì endpoint là /product
        // const res = await fetch(`${API_BASE_URL}/product`);
        const res = await fetch(`http://localhost:3000/products`);


        if (!res.ok) {
            throw new Error(`Request failed with status ${res.status}`);
        }

        const data = await res.json();
        // kỳ vọng backend trả về { products: [...] }
        const products = data.products || [];

        if (!products.length) {
            showToast('Không tìm thấy sản phẩm nào!', 'error');
            productsSection.style.display = 'none';
            statsBar.style.display = 'none';
            return;
        }

        displayProducts(products);
        productsSection.style.display = 'block';
        statsBar.style.display = 'flex';
        document.getElementById('totalProducts').textContent = products.length;

        showToast(`Tìm thấy ${products.length} sản phẩm từ backend!`, 'success');
    } catch (err) {
        console.error('Lỗi khi gọi API :', err);
        showToast('Có lỗi khi gọi API.', 'error');
    } finally {
        loading.classList.remove('active');
    }
});

// Display products
function displayProducts(products) {
    const grid = document.getElementById('productsGrid');

    grid.innerHTML = products.map(product => {
        // hỗ trợ cả field từ backend (avgRating, ratingNum, imageUrl, ...)
        const rating = product.rating ?? product.avgRating ?? 'N/A';
        const reviews = product.reviews ?? product.ratingNum ?? 0;
        const score = product.score ?? product.finalScore ?? null;

        return `
            <div class="product-card" data-id="${product.id}" onclick="toggleProduct('${product.id}')">
                <div class="product-info">
                    <h3>${product.name || product.productId || 'Sản phẩm chưa đặt tên'}</h3>
                    <p>💰 Giá: ${product.price != null ? formatPrice(product.price) + 'đ' : 'Liên hệ'}</p>
                    <p>⭐ Đánh giá: ${rating}/5 (${reviews} reviews)</p>
                    ${score !== null
            ? `<span class="product-score">AI Score: ${(score * 100).toFixed(0)}%</span>`
            : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Toggle product selection
function toggleProduct(productId) {
    const card = document.querySelector(`[data-id="${productId}"]`);

    if (selectedProducts.has(productId)) {
        selectedProducts.delete(productId);
        card.classList.remove('selected');
    } else {
        selectedProducts.add(productId);
        card.classList.add('selected');
    }

    document.getElementById('selectedCount').textContent = selectedProducts.size;
}

// Clear selection
document.getElementById('btnClear').addEventListener('click', () => {
    selectedProducts.clear();
    document.querySelectorAll('.product-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.getElementById('selectedCount').textContent = '0';
    showToast('Đã bỏ chọn tất cả sản phẩm', 'success');
});

// Submit selected products
document.getElementById('btnSubmitSelected').addEventListener('click', async () => {
    if (selectedProducts.size === 0) {
        showToast('Vui lòng chọn ít nhất 1 sản phẩm!', 'error');
        return;
    }

    const loading = document.getElementById('loading');
    loading.classList.add('active');
    document.getElementById('loadingText').textContent = 'Đang submit sản phẩm...';

    const selectedProductIds = Array.from(selectedProducts);
    console.log('Submitting products:', selectedProductIds);

    // TODO: sau này có thể POST lên backend nếu cần
    // await fetch(`${API_BASE_URL}/submit-products`, {...})

    setTimeout(() => {
        loading.classList.remove('active');

        document.getElementById('productsSection').style.display = 'none';

        const successSection = document.getElementById('successSection');
        successSection.style.display = 'block';
        document.getElementById('submittedCount').textContent = selectedProducts.size;

        successSection.scrollIntoView({ behavior: 'smooth' });

        showToast('Submit thành công!', 'success');
    }, 1500);
});

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `alert ${type}`;

    // reset hidden class đề phòng lần trước đã thêm
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Format price
function formatPrice(price) {
    return Math.round(price).toLocaleString('vi-VN');
}
