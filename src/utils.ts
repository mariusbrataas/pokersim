/**
 * Get all combinations of a subset of size groupSize from an array of items.
 * @param items - The array of items to generate combinations from.
 * @param groupSize - The size of each subset.
 * @returns An array of combinations, where each combination is an array of items.
 */
export function getCombinations<T>(items: T[], groupSize: number): T[][] {
  const results: T[][] = [];

  function combine(start: number, combination: T[]): void {
    if (combination.length === groupSize) {
      results.push([...combination]);
      return;
    }

    for (let i = start; i < items.length; i++) {
      combination.push(items[i]);
      combine(i + 1, combination);
      combination.pop();
    }
  }

  combine(0, []);
  return results;
}

/**
 * Shuffles the given array in-place, and returns the array.
 */
export function shuffle<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
