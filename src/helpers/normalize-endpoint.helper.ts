export function normalizeEndpoint(path: string): string {
  let normalized = path.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{1,12}/gi,
    '/:id',
  );

  normalized = normalized.replace(/\/[0-9]+/g, '/:id');

  normalized = normalized.replace(/\/undefined/gi, '/:id');

  normalized = normalized.replace(/\/%7B\w+%7D/gi, '/:id');

  normalized = normalized.replace(/\/\[object%20Object\]/gi, '/:id');

  return normalized;
}
