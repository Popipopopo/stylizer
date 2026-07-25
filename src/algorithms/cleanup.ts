function colorDistance(palette: Uint8ClampedArray, a: number, b: number): number {
  const ai = a * 3
  const bi = b * 3
  return Math.sqrt(
    (palette[ai] - palette[bi]) ** 2 +
      (palette[ai + 1] - palette[bi + 1]) ** 2 +
      (palette[ai + 2] - palette[bi + 2]) ** 2,
  )
}

export function cleanupSmallRegions(
  input: Uint16Array,
  width: number,
  height: number,
  minimumArea: number,
  palette: Uint8ClampedArray,
): Uint16Array {
  if (minimumArea <= 1) return input.slice()
  const labels = input.slice()
  const visited = new Uint8Array(labels.length)
  const queue = new Int32Array(labels.length)
  const component: number[] = []
  const neighbors = new Map<number, number>()

  for (let start = 0; start < labels.length; start += 1) {
    if (visited[start]) continue
    const ownLabel = labels[start]
    component.length = 0
    neighbors.clear()
    let read = 0
    let write = 0
    queue[write++] = start
    visited[start] = 1

    while (read < write) {
      const pixel = queue[read++]
      component.push(pixel)
      const x = pixel % width
      const y = Math.floor(pixel / width)
      const adjacent = [
        x > 0 ? pixel - 1 : -1,
        x + 1 < width ? pixel + 1 : -1,
        y > 0 ? pixel - width : -1,
        y + 1 < height ? pixel + width : -1,
      ]
      for (const next of adjacent) {
        if (next < 0) continue
        if (labels[next] === ownLabel) {
          if (!visited[next]) {
            visited[next] = 1
            queue[write++] = next
          }
        } else {
          neighbors.set(labels[next], (neighbors.get(labels[next]) ?? 0) + 1)
        }
      }
    }

    if (component.length >= minimumArea || neighbors.size === 0) continue
    let replacement = ownLabel
    let bestScore = -1
    for (const [candidate, sharedBoundary] of neighbors) {
      const score = sharedBoundary / (1 + colorDistance(palette, ownLabel, candidate) * 0.04)
      if (score > bestScore) {
        replacement = candidate
        bestScore = score
      }
    }
    for (const pixel of component) labels[pixel] = replacement
  }
  return labels
}

export function majorityFilter(
  input: Uint16Array,
  width: number,
  height: number,
  radius: number,
  passes: number,
): Uint16Array {
  if (radius <= 0 || passes <= 0) return input.slice()
  let current = input.slice()
  for (let pass = 0; pass < passes; pass += 1) {
    const output = current.slice()
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const counts = new Map<number, number>()
        let samples = 0
        for (let dy = -radius; dy <= radius; dy += 1) {
          const yy = y + dy
          if (yy < 0 || yy >= height) continue
          for (let dx = -radius; dx <= radius; dx += 1) {
            const xx = x + dx
            if (xx < 0 || xx >= width) continue
            const label = current[yy * width + xx]
            counts.set(label, (counts.get(label) ?? 0) + 1)
            samples += 1
          }
        }
        let winner = current[y * width + x]
        let winnerCount = counts.get(winner) ?? 0
        for (const [label, count] of counts) {
          if (count > winnerCount) {
            winner = label
            winnerCount = count
          }
        }
        if (winnerCount > samples / 2) output[y * width + x] = winner
      }
    }
    current = output
  }
  return current
}
