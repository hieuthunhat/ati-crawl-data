import app from "./handlers.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening: http://localhost:${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
