export type MaybeAsyncIterable<T> = Iterable<T> | AsyncIterable<T>;

async function* generateAsync<T, U>(
  iterable: MaybeAsyncIterable<T>,
  cb: (value: T, index: number) => Promise<U>,
) {
  let index = 0;
  for await (const value of iterable) {
    yield await cb(value, index++);
  }
}

export async function mapAsync<T, U>(
  iterable: MaybeAsyncIterable<T>,
  cb: (value: T, index: number) => Promise<U>,
) {
  const generator = generateAsync(iterable, cb);
  const items: U[] = [];
  for await (const item of generator) {
    items.push(item);
  }
  return items;
}
