/**
 * ============================================================================
 * Induktr Studio v2.0 — Affine Vector & Matrix Transform Engine
 * High-Performance Linear Algebra Compositor (Zero-Allocation Loop)
 * ============================================================================
 * 2D Affine Transformation Matrix layout in Float32Array (6 floats per entity):
 * [0] a  : Scale X & Rotation (basis vector i.x)
 * [1] b  : Skew Y  & Rotation (basis vector i.y)
 * [2] c  : Skew X  & Rotation (basis vector j.x)
 * [3] d  : Scale Y & Rotation (basis vector j.y)
 * [4] tx : Translation X
 * [5] ty : Translation Y
 */

export interface AffineMatrixEngine {
  readonly resetAll: () => void;
  readonly setTransform: (
    id: number,
    tx: number,
    ty: number,
    scaleX: number,
    scaleY: number,
    radians: number,
  ) => void;
  readonly multiply: (
    id: number,
    ma: number,
    mb: number,
    mc: number,
    md: number,
    mtx: number,
    mty: number,
  ) => void;
  readonly getMatrix: (id: number) => readonly [number, number, number, number, number, number];
  readonly applyToElement: (id: number, element: HTMLElement) => void;
}

/**
 * Functional Affine Matrix Engine Factory (Zero-Allocation Closure)
 * Replaces class with pure lexical closure and typed interfaces.
 */
export function createAffineMatrixEngine(maxEntities = 256): AffineMatrixEngine {
  // Flat contiguous memory allocation: 6 floats (24 bytes) per entity
  const buffer = new Float32Array(maxEntities * 6);

  const resetAll = (): void => {
    for (let i = 0; i < maxEntities; i++) {
      const o = i * 6;
      buffer[o + 0] = 1; // a
      buffer[o + 1] = 0; // b
      buffer[o + 2] = 0; // c
      buffer[o + 3] = 1; // d
      buffer[o + 4] = 0; // tx
      buffer[o + 5] = 0; // ty
    }
  };

  resetAll();

  const setTransform = (
    id: number,
    tx: number,
    ty: number,
    scaleX: number,
    scaleY: number,
    radians: number,
  ): void => {
    if (id < 0 || id >= maxEntities) return;
    const o = id * 6;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    // Transform basis vectors:
    // i' = scaleX * [cos, sin]
    // j' = scaleY * [-sin, cos]
    buffer[o + 0] = cos * scaleX;
    buffer[o + 1] = sin * scaleX;
    buffer[o + 2] = -sin * scaleY;
    buffer[o + 3] = cos * scaleY;
    buffer[o + 4] = tx;
    buffer[o + 5] = ty;
  };

  const multiply = (
    id: number,
    ma: number,
    mb: number,
    mc: number,
    md: number,
    mtx: number,
    mty: number,
  ): void => {
    if (id < 0 || id >= maxEntities) return;
    const o = id * 6;
    const a = buffer[o + 0] ?? 1;
    const b = buffer[o + 1] ?? 0;
    const c = buffer[o + 2] ?? 0;
    const d = buffer[o + 3] ?? 1;
    const tx = buffer[o + 4] ?? 0;
    const ty = buffer[o + 5] ?? 0;

    // Compute affine composition:
    buffer[o + 0] = a * ma + c * mb;
    buffer[o + 1] = b * ma + d * mb;
    buffer[o + 2] = a * mc + c * md;
    buffer[o + 3] = b * mc + d * md;
    buffer[o + 4] = a * mtx + c * mty + tx;
    buffer[o + 5] = b * mtx + d * mty + ty;
  };

  const getMatrix = (id: number): readonly [number, number, number, number, number, number] => {
    const o = id * 6;
    const a = buffer[o + 0] ?? 1;
    const b = buffer[o + 1] ?? 0;
    const c = buffer[o + 2] ?? 0;
    const d = buffer[o + 3] ?? 1;
    const tx = buffer[o + 4] ?? 0;
    const ty = buffer[o + 5] ?? 0;
    return [a, b, c, d, tx, ty] as const;
  };

  const applyToElement = (id: number, element: HTMLElement): void => {
    const o = id * 6;
    const a = buffer[o + 0] ?? 1;
    const b = buffer[o + 1] ?? 0;
    const c = buffer[o + 2] ?? 0;
    const d = buffer[o + 3] ?? 1;
    const tx = buffer[o + 4] ?? 0;
    const ty = buffer[o + 5] ?? 0;

    element.style.transform = `matrix(${a},${b},${c},${d},${tx},${ty})`;
  };

  return {
    resetAll,
    setTransform,
    multiply,
    getMatrix,
    applyToElement,
  };
}

// Global Singleton Engine for high performance across UI slices
export const globalMatrixEngine = createAffineMatrixEngine(512);
