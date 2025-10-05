export type DiffEntry = {
  path: string;
  type: 'added' | 'removed' | 'changed';
  before?: unknown;
  after?: unknown;
};

export function deepDiff(before: unknown, after: unknown, basePath = ''): DiffEntry[] {
  if (Object.is(before, after)) return [];

  const diffs: DiffEntry[] = [];

  const beforeIsObj = before && typeof before === 'object';
  const afterIsObj = after && typeof after === 'object';

  if (!beforeIsObj || !afterIsObj) {
    diffs.push({ path: basePath || '.', type: 'changed', before, after });
    return diffs;
  }

  // Arrays
  if (Array.isArray(before) || Array.isArray(after)) {
    const a1 = Array.isArray(before) ? before : [];
    const a2 = Array.isArray(after) ? after : [];
    const max = Math.max(a1.length, a2.length);
    for (let i = 0; i < max; i++) {
      const p = basePath ? `${basePath}[${i}]` : `[${i}]`;
      if (i >= a1.length) diffs.push({ path: p, type: 'added', after: a2[i] });
      else if (i >= a2.length) diffs.push({ path: p, type: 'removed', before: a1[i] });
      else diffs.push(...deepDiff(a1[i], a2[i], p));
    }
    return diffs;
  }

  // Objects
  const b = before as Record<string, unknown>;
  const a = after as Record<string, unknown>;
  const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
  for (const k of keys) {
    const p = basePath ? `${basePath}.${k}` : k;
    if (!(k in b)) diffs.push({ path: p, type: 'added', after: a[k] });
    else if (!(k in a)) diffs.push({ path: p, type: 'removed', before: b[k] });
    else diffs.push(...deepDiff(b[k], a[k], p));
  }
  return diffs;
}
