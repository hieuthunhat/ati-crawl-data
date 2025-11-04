import { db, admin } from "./firebase-db.js";

async function addToCollections() {
    try {
        const crawledRef = await db.collection("crawled products").add({
            productId: "SP001",
            name: "Chili Red",
            price: 95000,
            stock: 200,
            origin: "Vietnam",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log("Thêm vào 'crawled products' với ID:", crawledRef.id);

        const filteredRef = await db.collection("filtered products").add({
            productId: "SP001",
            name: "Chili Red",
            price: 95000,
            stock: 200,
            isFiltered: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log("Thêm vào 'filtered products' với ID:", filteredRef.id);

        console.log("Hoàn tất thêm dữ liệu vào cả hai collection!");
    } catch (err) {
        console.error("Lỗi khi thêm dữ liệu:", err);
    }
}

addToCollections();
