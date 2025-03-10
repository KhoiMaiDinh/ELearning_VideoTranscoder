export function removeExtension(key) {
  return key.replace(/\.[^.]+$/, ''); // Removes the last dot and extension
}
