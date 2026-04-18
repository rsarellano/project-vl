export const generateGridPositions = (
  min: number,
  max: number,
  stepSize: number,
) => {
  return Array.from({ length: max - min + 1 }, (_, i) => (min + i) * stepSize);
};
