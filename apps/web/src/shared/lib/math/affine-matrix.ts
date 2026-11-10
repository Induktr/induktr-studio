/**
 * ============================================================================
 * Induktr Studio v2.0 — Pure 2D Affine Matrix & Pythagorean Geometry Engine
 * Zero-Dependency Linear Algebra & Subpixel Compositor
 * ============================================================================
 * 2D Affine Transformation Matrix layout matching CSS matrix(a, b, c, d, tx, ty):
 * [0] a  : Scale X & Rotation (basis vector i.x)
 * [1] b  : Skew Y  & Rotation (basis vector i.y)
 * [2] c  : Skew X  & Rotation (basis vector j.x)
 * [3] d  : Scale Y & Rotation (basis vector j.y)
 * [4] tx : Translation X (horizontal cathetus displacement)
 * [5] ty : Translation Y (vertical cathetus displacement)
 *
 * Equivalent 3x3 homogeneous coordinate representation:
 * [ a  c  tx ] [ x ]   [ a*x + c*y + tx ]
 * [ b  d  ty ] [ y ] = [ b*x + d*y + ty ]
 * [ 0  0   1 ] [ 1 ]   [       1        ]
 */

export type AffineMatrix = readonly [
  a: number,
  b: number,
  c: number,
  d: number,
  tx: number,
  ty: number,
];

export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export interface Dimensions2D {
  readonly width: number;
  readonly height: number;
}

export interface Bounds2D {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

export interface ClampingOptions {
  /** Safe margin / padding in pixels inside container edges. Defaults to 0. */
  readonly padding?: number;
  /** Centers content along an axis when scaled content is smaller than container. Defaults to true. */
  readonly centerWhenSmaller?: boolean;
  /**
   * Maximum allowed Euclidean / Pythagorean hypotenuse overscroll distance
   * beyond the catheti bounds. Defaults to 0 (strict clamp).
   */
  readonly maxHypotenuseOverscroll?: number;
}

/**
 * Standard Identity 2D Affine Matrix: [1, 0, 0, 1, 0, 0]
 */
export const IDENTITY_AFFINE_MATRIX: AffineMatrix = [1, 0, 0, 1, 0, 0] as const;

/**
 * Factory for a new identity affine matrix.
 */
export function createIdentityMatrix(): AffineMatrix {
  return [1, 0, 0, 1, 0, 0];
}

/**
 * Creates a pure translation affine matrix:
 * [ 1  0  tx ]
 * [ 0  1  ty ]
 * [ 0  0   1 ]
 */
export function createTranslationMatrix(tx: number, ty: number): AffineMatrix {
  return [1, 0, 0, 1, tx, ty];
}

/**
 * Creates a pure scale affine matrix:
 * [ sx  0   0 ]
 * [ 0   sy  0 ]
 * [ 0   0   1 ]
 */
export function createScaleMatrix(scaleX: number, scaleY: number = scaleX): AffineMatrix {
  return [scaleX, 0, 0, scaleY, 0, 0];
}

/**
 * Creates an arbitrary 2D Affine Matrix from 6 parameters.
 */
export function createAffineMatrix(
  a: number,
  b: number,
  c: number,
  d: number,
  tx: number,
  ty: number,
): AffineMatrix {
  return [a, b, c, d, tx, ty];
}

/**
 * Multiplies two 2D Affine Transformation Matrices (m1 * m2).
 * The resulting matrix represents applying transformation m2 followed by m1:
 * (m1 * m2) * v = m1 * (m2 * v)
 *
 * Multiplies two 3x3 matrices:
 * [ a1 c1 tx1 ] [ a2 c2 tx2 ]   [ a1*a2+c1*b2  a1*c2+c1*d2  a1*tx2+c1*ty2+tx1 ]
 * [ b1 d1 ty1 ]*[ b2 d2 ty2 ] = [ b1*a2+d1*b2  b1*c2+d1*d2  b1*tx2+d1*ty2+ty1 ]
 * [  0  0   1 ] [  0  0   1 ]   [      0            0                1         ]
 */
export function multiplyAffineMatrices(m1: AffineMatrix, m2: AffineMatrix): AffineMatrix {
  const [a1, b1, c1, d1, tx1, ty1] = m1;
  const [a2, b2, c2, d2, tx2, ty2] = m2;

  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * tx2 + c1 * ty2 + tx1,
    b1 * tx2 + d1 * ty2 + ty1,
  ];
}

/**
 * Sequentially multiplies an array of affine matrices: (...((m0 * m1) * m2)...)
 */
export function multiplyMany(...matrices: readonly AffineMatrix[]): AffineMatrix {
  return matrices.reduce(multiplyAffineMatrices, IDENTITY_AFFINE_MATRIX);
}

/**
 * Applies an affine matrix transformation to a 2D vector / point.
 */
export function transformPoint(m: AffineMatrix, p: Point2D): Point2D {
  return {
    x: m[0] * p.x + m[2] * p.y + m[4],
    y: m[1] * p.x + m[3] * p.y + m[5],
  };
}

/**
 * Computes the inverse of a 2D affine matrix.
 * Returns null if the matrix is singular (determinant = 0).
 */
export function invertAffineMatrix(m: AffineMatrix): AffineMatrix | null {
  const [a, b, c, d, tx, ty] = m;
  const det = a * d - b * c;
  if (Math.abs(det) < 1e-12) return null;
  const invDet = 1 / det;
  return [
    d * invDet,
    -b * invDet,
    -c * invDet,
    a * invDet,
    (c * ty - d * tx) * invDet,
    (b * tx - a * ty) * invDet,
  ];
}

/**
 * Creates an affine matrix for zooming around an anchor point (anchorX, anchorY) by a scale factor.
 * Pure mathematical composition:
 * Translation(+anchor) * Scale(scaleFactor) * Translation(-anchor)
 *
 * Multiplying this matrix onto existing coordinates keeps (anchorX, anchorY) stationary.
 */
export function createAnchorZoomMatrix(
  anchorX: number,
  anchorY: number,
  scaleFactor: number,
): AffineMatrix {
  const tNeg = createTranslationMatrix(-anchorX, -anchorY);
  const s = createScaleMatrix(scaleFactor, scaleFactor);
  const tPos = createTranslationMatrix(anchorX, anchorY);

  // T(anchor) * S(scaleFactor) * T(-anchor)
  return multiplyAffineMatrices(tPos, multiplyAffineMatrices(s, tNeg));
}

/**
 * Zooms an existing affine matrix around cursor coordinates (anchorX, anchorY).
 * Matrix multiplication:
 * Translation(anchorX, anchorY) * Scale(scaleFactor) * Translation(-anchorX, -anchorY) * currentMatrix
 *
 * Guarantees the point at (anchorX, anchorY) in container coordinates remains invariant.
 */
export function zoomAroundAnchor(
  currentMatrix: AffineMatrix,
  anchorX: number,
  anchorY: number,
  scaleFactor: number,
): AffineMatrix {
  const zoomMatrix = createAnchorZoomMatrix(anchorX, anchorY, scaleFactor);
  return multiplyAffineMatrices(zoomMatrix, currentMatrix);
}

/**
 * Computes Euclidean scale factor of an affine matrix along basis vector i using Math.hypot.
 * Math.hypot guarantees IEEE 754 precision without intermediate overflow/underflow.
 */
export function getMatrixScale(m: AffineMatrix): number {
  return Math.hypot(m[0], m[1]);
}

/**
 * Computes Euclidean scale factor of an affine matrix along basis vector j using Math.hypot.
 */
export function getMatrixScaleY(m: AffineMatrix): number {
  return Math.hypot(m[2], m[3]);
}

/**
 * Calculates Euclidean / Pythagorean distance between two 2D points using Math.hypot.
 * Math.hypot(dx, dy) guarantees IEEE 754 precision without intermediate underflow or overflow
 * when calculating sqrt(dx^2 + dy^2).
 */
export function calculatePythagoreanDistance(
  p1: Point2D | { readonly x: number; readonly y: number },
  p2: Point2D | { readonly x: number; readonly y: number },
): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Calculates vector magnitude (hypotenuse) given orthogonal catheti dx and dy.
 */
export function pythagoreanHypotenuse(dx: number, dy: number): number {
  return Math.hypot(dx, dy);
}

/**
 * Clamps a vector displacement (dx, dy) to a maximum allowable hypotenuse length.
 * If Math.hypot(dx, dy) exceeds maxHypotenuse, scales down proportionally.
 */
export function clampVectorHypotenuse(dx: number, dy: number, maxHypotenuse: number): Point2D {
  if (maxHypotenuse <= 0) return { x: 0, y: 0 };
  const currentHypot = Math.hypot(dx, dy);
  if (currentHypot <= maxHypotenuse || currentHypot === 0) {
    return { x: dx, y: dy };
  }
  const ratio = maxHypotenuse / currentHypot;
  return {
    x: dx * ratio,
    y: dy * ratio,
  };
}

/**
 * Computes safe translation bounds (catheti limits) for content inside a container.
 * Container width represents the horizontal cathetus, and container height represents
 * the vertical cathetus.
 */
export function calculateSafeBounds(
  container: Dimensions2D,
  content: Dimensions2D,
  scale: number,
  padding = 0,
  centerWhenSmaller = true,
): Bounds2D {
  const scaledWidth = content.width * scale;
  const scaledHeight = content.height * scale;

  let minX: number;
  let maxX: number;
  if (scaledWidth >= container.width) {
    minX = container.width - scaledWidth - padding;
    maxX = padding;
  } else {
    if (centerWhenSmaller) {
      const cx = (container.width - scaledWidth) / 2;
      minX = cx - padding;
      maxX = cx + padding;
    } else {
      minX = padding;
      maxX = container.width - scaledWidth - padding;
      if (minX > maxX) {
        const mid = (minX + maxX) / 2;
        minX = mid;
        maxX = mid;
      }
    }
  }

  let minY: number;
  let maxY: number;
  if (scaledHeight >= container.height) {
    minY = container.height - scaledHeight - padding;
    maxY = padding;
  } else {
    if (centerWhenSmaller) {
      const cy = (container.height - scaledHeight) / 2;
      minY = cy - padding;
      maxY = cy + padding;
    } else {
      minY = padding;
      maxY = container.height - scaledHeight - padding;
      if (minY > maxY) {
        const mid = (minY + maxY) / 2;
        minY = mid;
        maxY = mid;
      }
    }
  }

  return { minX, maxX, minY, maxY };
}

/**
 * Clamps coordinates against window/container catheti (orthogonal X/Y limits)
 * and container hypotenuse (maximum diagonal displacement / overscroll safe box).
 * Ensures dragged content boundaries do not leave the safe bounding box.
 */
export function clampCoordinatesAgainstCathetiAndHypotenuse(
  targetX: number,
  targetY: number,
  container: Dimensions2D,
  content: Dimensions2D,
  scale: number,
  options: ClampingOptions = {},
): Point2D {
  const {
    padding = 0,
    centerWhenSmaller = true,
    maxHypotenuseOverscroll = 0,
  } = options;

  const bounds = calculateSafeBounds(container, content, scale, padding, centerWhenSmaller);

  // 1. Clamp against orthogonal catheti
  const clampedX = Math.min(Math.max(targetX, bounds.minX), bounds.maxX);
  const clampedY = Math.min(Math.max(targetY, bounds.minY), bounds.maxY);

  if (maxHypotenuseOverscroll <= 0) {
    return { x: clampedX, y: clampedY };
  }

  // 2. Vector displacement beyond catheti
  const dx = targetX - clampedX;
  const dy = targetY - clampedY;
  const displacementHypot = Math.hypot(dx, dy);

  if (displacementHypot <= maxHypotenuseOverscroll) {
    return { x: targetX, y: targetY };
  }

  // Clamp radial hypotenuse overscroll along the vector angle
  const ratio = maxHypotenuseOverscroll / displacementHypot;
  return {
    x: clampedX + dx * ratio,
    y: clampedY + dy * ratio,
  };
}

/**
 * Clamps an AffineMatrix's translation components against window/container catheti and hypotenuse,
 * guaranteeing the transformed content stays within safe viewport bounds.
 */
export function clampMatrixTranslation(
  matrix: AffineMatrix,
  container: Dimensions2D,
  content: Dimensions2D,
  options?: ClampingOptions,
): AffineMatrix {
  const scale = getMatrixScale(matrix);
  const clamped = clampCoordinatesAgainstCathetiAndHypotenuse(
    matrix[4],
    matrix[5],
    container,
    content,
    scale,
    options,
  );
  return [matrix[0], matrix[1], matrix[2], matrix[3], clamped.x, clamped.y];
}

/**
 * Accurate float rounding with subpixel stabilization.
 * Utilizes Math.f16round (IEEE 754-2008 half precision rounding) where available to eliminate
 * micro-precision 64-bit float drift, alongside device subpixel grid alignment.
 */
export function stabilizeFloat(value: number, dpr = 1): number {
  if (!Number.isFinite(value)) return 0;
  const effectiveDpr = dpr > 0 ? dpr : 1;
  const subpixelStep = 1 / effectiveDpr;
  const snapped = Math.round(value / subpixelStep) * subpixelStep;

  if (typeof Math.f16round === 'function') {
    return Math.f16round(snapped);
  }
  return Math.round(snapped * 10000) / 10000;
}

/**
 * Stabilizes subpixel displacement between previous and current points using Math.hypot.
 * If the Pythagorean distance is within the deadband jitter threshold, returns previous
 * coordinates to eliminate micro-jitter and subpixel blur during panning.
 */
export function stabilizeSubpixelDisplacement(
  current: Point2D,
  previous: Point2D,
  jitterThreshold = 0.05,
  dpr = 1,
): Point2D {
  const dx = current.x - previous.x;
  const dy = current.y - previous.y;
  const distance = Math.hypot(dx, dy);

  if (distance < jitterThreshold) {
    return previous;
  }

  return {
    x: stabilizeFloat(current.x, dpr),
    y: stabilizeFloat(current.y, dpr),
  };
}

/**
 * Stabilizes translation components of an AffineMatrix to avoid subpixel blur.
 */
export function stabilizeMatrix(matrix: AffineMatrix, dpr = 1): AffineMatrix {
  return [
    matrix[0],
    matrix[1],
    matrix[2],
    matrix[3],
    stabilizeFloat(matrix[4], dpr),
    stabilizeFloat(matrix[5], dpr),
  ];
}

/**
 * Serializes an AffineMatrix to CSS transform string: matrix(a, b, c, d, tx, ty)
 */
export function toCSSMatrix(matrix: AffineMatrix): string {
  return `matrix(${matrix[0]}, ${matrix[1]}, ${matrix[2]}, ${matrix[3]}, ${matrix[4]}, ${matrix[5]})`;
}

/**
 * Compares two AffineMatrices with an epsilon tolerance.
 */
export function isAffineMatrixEqual(
  m1: AffineMatrix,
  m2: AffineMatrix,
  epsilon = 1e-5,
): boolean {
  for (let i = 0; i < 6; i++) {
    if (Math.abs((m1[i] ?? 0) - (m2[i] ?? 0)) > epsilon) {
      return false;
    }
  }
  return true;
}
