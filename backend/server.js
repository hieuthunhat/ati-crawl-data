import app from "./handlers.js";
import filestoreRouter from "./routes/filestore.route.js";
import express from "express";
import cors from "cors";
import path from "path";
import {fileURLToPath} from "url"; // chú ý .js
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening: http://localhost:${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
app.use("/api/firestore", filestoreRouter);

app.use(cors());
app.use(express.json());

// Để dùng __dirname trong ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static frontend: ./frontend/src (home-page.html, main.css, main.js)
app.use(express.static(path.join(__dirname, "../frontend/src")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/src/index.html"));
});

app.post('/products', async (req, res) => {
  try {

    const {productName, platform, criteria, storeResults} = req.body;
    console.log("Data ", {productName, platform, criteria, storeResults});


    // 🟩 Dữ liệu giả (mock) để test frontend
    const mockProducts = [
      {
        id: "sp1",
        name: `${productName} - Bản tiêu chuẩn`,
        price: 299000,
        avgRating: 4.6,
        ratingNum: 128,
        imageUrl: "https://via.placeholder.com/150",
      },
      {
        id: "sp2",
        name: `${productName} - Bản cao cấp`,
        price: 499000,
        avgRating: 4.8,
        ratingNum: 315,
        imageUrl: "https://via.placeholder.com/150",
      },
      {
        id: "sp3",
        name: `${productName} - Phiên bản giới hạn`,
        price: 899000,
        avgRating: 4.9,
        ratingNum: 780,
        imageUrl: "https://via.placeholder.com/150",
      },
    ];

    // 🟩 In log ra console để kiểm tra
    console.log("➡️ Gửi về frontend:", mockProducts.length, "sản phẩm");

    // 🟩 Gửi phản hồi về frontend đúng format
    return res.json({
      products: mockProducts,
      total: mockProducts.length,
      source: platform,
    });

  } catch (err) {
    console.error("Lỗi /products:", err);
    res.status(500).json({message: "Lỗi server khi lấy sản phẩm"});
  }
});


app.post('/submit-products', async (req, res) => {
  try {
    const {productIds} = req.body;

    console.log('Nhận productIds từ frontend:', productIds);

    // TODO:
    //  - Lưu productIds vào Firestore / DB
    //  - Gọi AI phân tích thêm
    //  - Tạo report, v.v.

    return res.json({
      success: true,
      message: 'Đã nhận danh sách sản phẩm',
      count: Array.isArray(productIds) ? productIds.length : 0,
    });
  } catch (err) {
    console.error('Lỗi /submit-products:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý submit-products',
    });
  }
});
