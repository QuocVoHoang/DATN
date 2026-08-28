import type { ROI } from './roi';

export type MovingObject = {
  id: number;
  bbox: { x: number; y: number; width: number; height: number };
  centroid: { x: number; y: number };
  area: number;
  meanIntensity: number;
  maxIntensity: number;
};

export function detectMovingObjects(mask: ImageData, roi: ROI, minArea: number): MovingObject[] {
  const { width, height, data } = mask;
  const x0 = Math.max(0, Math.floor(roi.x * width));
  const y0 = Math.max(0, Math.floor(roi.y * height));
  const x1 = Math.min(width, Math.ceil((roi.x + roi.width) * width));
  const y1 = Math.min(height, Math.ceil((roi.y + roi.height) * height));
  const visited = new Uint8Array(width * height);
  const objects: MovingObject[] = [];
  const stack: number[] = [];

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const start = y * width + x;
      if (visited[start] || data[start * 4] === 0) continue;

      visited[start] = 1;
      stack.push(start);
      let area = 0;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let sumX = 0;
      let sumY = 0;
      let sumIntensity = 0;
      let maxIntensity = 0;

      while (stack.length > 0) {
        const index = stack.pop()!;
        const currentX = index % width;
        const currentY = Math.floor(index / width);
        const intensity = data[index * 4];
        area++;
        sumX += currentX;
        sumY += currentY;
        sumIntensity += intensity;
        maxIntensity = Math.max(maxIntensity, intensity);
        minX = Math.min(minX, currentX);
        maxX = Math.max(maxX, currentX);
        minY = Math.min(minY, currentY);
        maxY = Math.max(maxY, currentY);

        for (const [nextX, nextY] of [[currentX - 1, currentY], [currentX + 1, currentY], [currentX, currentY - 1], [currentX, currentY + 1]]) {
          if (nextX < x0 || nextX >= x1 || nextY < y0 || nextY >= y1) continue;
          const next = nextY * width + nextX;
          if (!visited[next] && data[next * 4] > 0) {
            visited[next] = 1;
            stack.push(next);
          }
        }
      }

      if (area < minArea) continue;
      objects.push({
        id: objects.length + 1,
        bbox: { x: minX / width, y: minY / height, width: (maxX - minX + 1) / width, height: (maxY - minY + 1) / height },
        centroid: { x: sumX / area / width, y: sumY / area / height },
        area,
        meanIntensity: sumIntensity / area,
        maxIntensity,
      });
    }
  }

  return objects;
}
