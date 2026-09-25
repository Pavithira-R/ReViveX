import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`ReViveX Backend Server running on port ${PORT}`);
  console.log(`Review Endpoints:`);
  console.log(`  POST http://localhost:${PORT}/api/reviews`);
  console.log(`  GET  http://localhost:${PORT}/api/providers/:id/reviews`);
});
