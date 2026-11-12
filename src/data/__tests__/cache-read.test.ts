import { readCacheFirst } from '../cache-read';

test('returns the cached value without touching the server when cache is non-empty', async () => {
  const server = jest.fn(async () => 'from-server');
  const result = await readCacheFirst(async () => 'from-cache', server);
  expect(result).toBe('from-cache');
  expect(server).not.toHaveBeenCalled();
});

test('falls back to the server when the cache is empty (first launch, online)', async () => {
  const result = await readCacheFirst(
    async () => [] as number[],
    async () => [1, 2, 3],
    (v) => v.length === 0,
  );
  expect(result).toEqual([1, 2, 3]);
});

test('returns the empty cache result when the server is unreachable (offline)', async () => {
  const result = await readCacheFirst(
    async () => [] as number[],
    async () => {
      throw new Error('offline');
    },
    (v) => v.length === 0,
  );
  expect(result).toEqual([]);
});

test('falls back to the server when the cache read throws', async () => {
  const result = await readCacheFirst(
    async () => {
      throw new Error('cache unavailable');
    },
    async () => 'from-server',
  );
  expect(result).toBe('from-server');
});

test('throws when both cache and server are unavailable', async () => {
  await expect(
    readCacheFirst(
      async () => {
        throw new Error('cache unavailable');
      },
      async () => {
        throw new Error('offline');
      },
    ),
  ).rejects.toThrow('offline');
});
