export type ROI = { x: number; y: number; width: number; height: number };

export function countPixelsInRoi(image: ImageData, roi: ROI): number {
  const x0 = Math.max(0, Math.floor(roi.x * image.width));
  const y0 = Math.max(0, Math.floor(roi.y * image.height));
  const x1 = Math.min(image.width, Math.ceil((roi.x + roi.width) * image.width));
  const y1 = Math.min(image.height, Math.ceil((roi.y + roi.height) * image.height));
  let count = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (image.data[(y * image.width + x) * 4] > 0) count++;
  return count;
}
