let counter = 0;

export function generateId(prefix) {
  counter += 1;
  const ts = Date.now();
  return `${prefix}_${ts}_${counter}`;
}

