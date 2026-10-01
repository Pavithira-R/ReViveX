const cors = require('cors');
const express = require('express');

const app = express();
const PORT = 5000;
const HOST = '0.0.0.0';
const DEMO_USER = {
  id: 'demo-user-123',
  name: 'Demo User',
  email: 'demo@revivex.app',
};

app.use(cors());
app.use(express.json());

const categories = [
  { id: 'c1', name: 'Mobile Phones' },
  { id: 'c2', name: 'Laptops' },
  { id: 'c3', name: 'Monitors' },
  { id: 'c4', name: 'Printers' },
  { id: 'c5', name: 'Headphones' },
];

const now = new Date().toISOString();
const items = [
  {
    id: '1',
    name: 'Old Laptop',
    brand: 'Dell',
    condition: 'DAMAGED',
    action: 'REPAIR',
    status: 'POSTED',
    description: 'Screen cracked, powers on fine.',
    images: [],
    ownerId: 'demo-user-123',
    categoryId: 'c2',
    category: { id: 'c2', name: 'Laptops' },
    owner: { ...DEMO_USER },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: '2',
    name: 'Broken Phone',
    brand: 'Samsung',
    condition: 'BROKEN',
    action: 'RECYCLE',
    status: 'MATCHED',
    description: 'Wont turn on. Recycling for parts.',
    images: [],
    ownerId: 'demo-user-123',
    categoryId: 'c1',
    category: { id: 'c1', name: 'Mobile Phones' },
    owner: { ...DEMO_USER },
    createdAt: now,
    updatedAt: now,
  },
];

function send(res, status, message, data, error = null) {
  return res.status(status).json({ success: status < 400, message, data, error });
}

app.get('/api/health', (_req, res) => {
  send(res, 200, 'API is healthy', { status: 'healthy' });
});

app.get('/api/categories', (_req, res) => {
  send(res, 200, 'Categories retrieved', categories);
});

app.get('/api/items', (req, res) => {
  const { categoryId, action, condition, search } = req.query;
  const normalizedSearch = typeof search === 'string' ? search.trim().toLowerCase() : '';
  const filtered = items.filter((item) => {
    if (typeof categoryId === 'string' && item.categoryId !== categoryId) return false;
    if (typeof action === 'string' && item.action.toLowerCase() !== action.toLowerCase()) return false;
    if (typeof condition === 'string' && item.condition.toLowerCase() !== condition.toLowerCase()) return false;
    if (
      normalizedSearch
      && ![item.name, item.brand, item.description]
        .some((value) => value?.toLowerCase().includes(normalizedSearch))
    ) {
      return false;
    }
    return true;
  });
  send(res, 200, 'Items retrieved', { items: filtered });
});

app.get('/api/items/:id', (req, res) => {
  const item = items.find((candidate) => candidate.id === req.params.id);
  if (!item) {
    return send(res, 404, 'Item not found', null, { code: 'NOT_FOUND' });
  }
  return send(res, 200, 'Item retrieved', item);
});

app.get('/api/users/me/items', (_req, res) => {
  send(res, 200, 'Your items retrieved', items.filter((item) => item.ownerId === DEMO_USER.id));
});

app.post('/api/items', (req, res) => {
  const { name, condition, action, categoryId } = req.body ?? {};
  if (
    typeof name !== 'string' || !name.trim()
    || typeof condition !== 'string' || !condition.trim()
    || typeof action !== 'string' || !action.trim()
    || typeof categoryId !== 'string' || !categoryId.trim()
  ) {
    return send(res, 400, 'name, condition, action, and categoryId are required', null, {
      code: 'VALIDATION_ERROR',
    });
  }

  const category = categories.find((candidate) => candidate.id === categoryId);
  if (!category) {
    return send(res, 400, 'categoryId is not a valid category', null, {
      code: 'INVALID_CATEGORY',
    });
  }

  const createdAt = new Date().toISOString();
  const newItem = {
    id: String(Date.now()),
    name: name.trim(),
    brand: typeof req.body.brand === 'string' ? req.body.brand.trim() : '',
    condition: condition.trim(),
    action: action.trim(),
    status: 'POSTED',
    description: typeof req.body.description === 'string' ? req.body.description.trim() : '',
    images: [],
    ownerId: DEMO_USER.id,
    categoryId,
    category: { ...category },
    owner: { ...DEMO_USER },
    createdAt,
    updatedAt: createdAt,
  };
  items.unshift(newItem);
  return send(res, 201, 'Item created', newItem);
});

app.delete('/api/items/:id', (req, res) => {
  const index = items.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    return send(res, 404, 'Item not found', null, { code: 'NOT_FOUND' });
  }
  items.splice(index, 1);
  return send(res, 200, 'Item deleted', null);
});

app.use((error, _req, res, _next) => {
  console.error(error);
  return send(res, 500, 'An unexpected error occurred', null, {
    code: 'INTERNAL_SERVER_ERROR',
  });
});

app.listen(PORT, HOST, () => {
  console.log(`Mock backend on http://${HOST}:${PORT}`);
});
