// Member 2 – Item Management
import { apiUpload, setAuthToken, setUnauthorizedHandler } from '../src/services/api';

const response = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

beforeEach(() => {
  globalThis.fetch = jest.fn();
  setAuthToken('test-token');
  setUnauthorizedHandler(null);
});

afterEach(() => {
  setAuthToken(null);
  setUnauthorizedHandler(null);
});

test('uploads multipart data with the auth token and no manual content type', async () => {
  (globalThis.fetch as jest.Mock).mockResolvedValueOnce(
    response(201, {
      success: true,
      message: 'Item images uploaded',
      data: ['http://localhost:5000/uploads/photo.png'],
      error: null,
    }),
  );
  const form = new FormData();

  await expect(apiUpload<string[]>('/items/item-1/images', form)).resolves.toEqual([
    'http://localhost:5000/uploads/photo.png',
  ]);

  const [url, options] = (globalThis.fetch as jest.Mock).mock.calls[0];
  expect(url).toBe('http://localhost:5000/api/items/item-1/images');
  expect(options.method).toBe('POST');
  expect(options.headers).toEqual({ Accept: 'application/json', Authorization: 'Bearer test-token' });
  expect(options.headers['Content-Type']).toBeUndefined();
  expect(options.body).toBe(form);
});

test('a 401 upload response triggers the shared unauthorized handler', async () => {
  const unauthorizedHandler = jest.fn();
  setUnauthorizedHandler(unauthorizedHandler);
  (globalThis.fetch as jest.Mock).mockResolvedValueOnce(
    response(401, {
      success: false,
      message: 'Authentication token has expired',
      data: null,
      error: { code: 'UNAUTHORIZED', details: [] },
    }),
  );

  await expect(apiUpload('/items/item-1/images', new FormData())).rejects.toMatchObject({
    status: 401,
    code: 'UNAUTHORIZED',
  });
  expect(unauthorizedHandler).toHaveBeenCalledTimes(1);
});
