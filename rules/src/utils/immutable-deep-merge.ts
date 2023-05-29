export function deepCloneValue<T>(val: T): T {
  if (isRecord(val)) {
    return deepCloneObject(val);
  } else if (Array.isArray(val)) {
    return deepCloneArray(val);
  } else {
    return val;
  }
}

export function deepCloneObject<T extends Record<string, unknown>>(a: T): T {
  const keys = new Set(Object.keys(a));
  const clone: Record<string, unknown> = {};

  for (const key of keys) {
    clone[key] = deepCloneValue(a[key]);
  }

  return clone as T;
}

function deepCloneArray<T extends Array<unknown>>(arr: T): T {
  const newArr = [];

  for (const val of arr) {
    newArr.push(deepCloneValue(val));
  }

  return newArr as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value);
}
