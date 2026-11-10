import { describe, it, expect } from 'vitest';
import {
  createIdentityMatrix,
  createTranslationMatrix,
  createScaleMatrix,
  createAffineMatrix,
  multiplyAffineMatrices,
  multiplyMany,
  transformPoint,
  invertAffineMatrix,
  createAnchorZoomMatrix,
  zoomAroundAnchor,
  getMatrixScale,
  calculatePythagoreanDistance,
  pythagoreanHypotenuse,
  clampVectorHypotenuse,
  calculateSafeBounds,
  clampCoordinatesAgainstCathetiAndHypotenuse,
  clampMatrixTranslation,
  stabilizeFloat,
  stabilizeSubpixelDisplacement,
  stabilizeMatrix,
  toCSSMatrix,
  isAffineMatrixEqual,
  type AffineMatrix,
} from './affine-matrix';

describe('2D Affine Matrix Math Engine', () => {
  describe('Matrix Multiplication & Transformations', () => {
    it('creates identity matrix and preserves identity multiplication', () => {
      const identity = createIdentityMatrix();
      expect(identity).toEqual([1, 0, 0, 1, 0, 0]);

      const t = createTranslationMatrix(50, 100);
      const res1 = multiplyAffineMatrices(identity, t);
      const res2 = multiplyAffineMatrices(t, identity);

      expect(res1).toEqual([1, 0, 0, 1, 50, 100]);
      expect(res2).toEqual([1, 0, 0, 1, 50, 100]);
    });

    it('multiplies sequential translations accurately', () => {
      const t1 = createTranslationMatrix(20, 35);
      const t2 = createTranslationMatrix(30, 45);
      const combined = multiplyAffineMatrices(t1, t2);

      expect(combined[4]).toBe(50);
      expect(combined[5]).toBe(80);
    });

    it('correctly orders Scale * Translation vs Translation * Scale', () => {
      const t = createTranslationMatrix(10, 20);
      const s = createScaleMatrix(2, 2);

      // (T * S) applied to vector (1, 1): S first (2, 2), then T (12, 22)
      const t_times_s = multiplyAffineMatrices(t, s);
      const p1 = transformPoint(t_times_s, { x: 1, y: 1 });
      expect(p1.x).toBe(12);
      expect(p1.y).toBe(22);

      // (S * T) applied to vector (1, 1): T first (11, 21), then S (22, 42)
      const s_times_t = multiplyAffineMatrices(s, t);
      const p2 = transformPoint(s_times_t, { x: 1, y: 1 });
      expect(p2.x).toBe(22);
      expect(p2.y).toBe(42);
    });

    it('multiplies multiple matrices in sequence with multiplyMany', () => {
      const m1 = createTranslationMatrix(10, 0);
      const m2 = createScaleMatrix(3, 3);
      const m3 = createTranslationMatrix(5, 5);

      const result = multiplyMany(m1, m2, m3);
      // m1 * (m2 * m3):
      // p=(0,0) -> m3=(5,5) -> m2=(15,15) -> m1=(25,15)
      const transformed = transformPoint(result, { x: 0, y: 0 });
      expect(transformed.x).toBe(25);
      expect(transformed.y).toBe(15);
    });

    it('computes exact matrix inverse for non-singular matrices', () => {
      const matrix = createAffineMatrix(2, 0, 0, 3, 100, 200);
      const inverse = invertAffineMatrix(matrix);
      expect(inverse).not.toBeNull();

      const prod = multiplyAffineMatrices(matrix, inverse!);
      expect(isAffineMatrixEqual(prod, createIdentityMatrix())).toBe(true);
    });

    it('returns null when inverting a singular matrix', () => {
      const singular = createAffineMatrix(0, 0, 0, 0, 10, 20);
      expect(invertAffineMatrix(singular)).toBeNull();
    });
  });

  describe('Pythagorean Distance & Hypotenuse Clamping (Math.hypot)', () => {
    it('calculates Pythagorean distance for classical right triangles', () => {
      // 3-4-5 triangle
      const dist345 = calculatePythagoreanDistance({ x: 0, y: 0 }, { x: 3, y: 4 });
      expect(dist345).toBe(5);

      // 5-12-13 triangle
      const dist512 = calculatePythagoreanDistance({ x: 10, y: 20 }, { x: 15, y: 32 });
      expect(dist512).toBe(13);

      expect(pythagoreanHypotenuse(6, 8)).toBe(10);
    });

    it('guarantees IEEE 754 precision without overflow on extreme scales', () => {
      // Numbers where x^2 would overflow standard Number.MAX_VALUE if computed naively as (x*x + y*y)
      const largeX = 1e160;
      const largeY = 1e160;
      // Naive largeX*largeX is 1e320 which exceeds IEEE 754 float limit (Infinity)
      expect(largeX * largeX).toBe(Infinity);

      // Math.hypot handles this cleanly without overflow!
      const hypotResult = calculatePythagoreanDistance({ x: 0, y: 0 }, { x: largeX, y: largeY });
      expect(Number.isFinite(hypotResult)).toBe(true);
      expect(hypotResult).toBeCloseTo(Math.SQRT2 * 1e160, -150);
    });

    it('clamps vector hypotenuse while preserving angle and direction', () => {
      // Vector of length 10 (dx=6, dy=8), clamp to max hypotenuse 5
      const clamped = clampVectorHypotenuse(6, 8, 5);
      expect(clamped.x).toBeCloseTo(3);
      expect(clamped.y).toBeCloseTo(4);
      expect(Math.hypot(clamped.x, clamped.y)).toBeCloseTo(5);

      // Vector shorter than max hypotenuse remains unchanged
      const short = clampVectorHypotenuse(1, 2, 10);
      expect(short.x).toBe(1);
      expect(short.y).toBe(2);
    });

    it('clamps coordinates against container catheti boundaries', () => {
      const container = { width: 800, height: 600 };
      const content = { width: 1600, height: 1200 };
      const scale = 1;

      // When scaled content (1600x1200) is larger than container (800x600):
      // Safe bounds: minX = 800 - 1600 = -800, maxX = 0
      //              minY = 600 - 1200 = -600, maxY = 0
      const bounds = calculateSafeBounds(container, content, scale);
      expect(bounds.minX).toBe(-800);
      expect(bounds.maxX).toBe(0);
      expect(bounds.minY).toBe(-600);
      expect(bounds.maxY).toBe(0);

      // Out of bounds drag to positive X and Y should clamp to 0
      const clampedPositive = clampCoordinatesAgainstCathetiAndHypotenuse(100, 50, container, content, scale);
      expect(clampedPositive.x).toBe(0);
      expect(clampedPositive.y).toBe(0);

      // Out of bounds drag beyond negative limit should clamp to minX/minY
      const clampedNegative = clampCoordinatesAgainstCathetiAndHypotenuse(-950, -800, container, content, scale);
      expect(clampedNegative.x).toBe(-800);
      expect(clampedNegative.y).toBe(-600);

      // Inside safe range stays intact
      const valid = clampCoordinatesAgainstCathetiAndHypotenuse(-400, -300, container, content, scale);
      expect(valid.x).toBe(-400);
      expect(valid.y).toBe(-300);
    });

    it('centers content along catheti when content is smaller than container', () => {
      const container = { width: 1000, height: 800 };
      const content = { width: 400, height: 200 };
      const scale = 1;

      // Center: cx = (1000 - 400)/2 = 300, cy = (800 - 200)/2 = 300
      const bounds = calculateSafeBounds(container, content, scale, 0, true);
      expect(bounds.minX).toBe(300);
      expect(bounds.maxX).toBe(300);
      expect(bounds.minY).toBe(300);
      expect(bounds.maxY).toBe(300);

      const clamped = clampCoordinatesAgainstCathetiAndHypotenuse(0, 0, container, content, scale);
      expect(clamped.x).toBe(300);
      expect(clamped.y).toBe(300);
    });

    it('radially clamps hypotenuse overscroll beyond catheti limits', () => {
      const container = { width: 500, height: 500 };
      const content = { width: 1000, height: 1000 };
      const scale = 1;
      // Valid range: [-500, 0] along X and Y

      // Drag target is (30, 40) beyond max bounds (0, 0)
      // Vector offset is (30, 40), hypotenuse = 50. Max overscroll allowed is 25.
      const clamped = clampCoordinatesAgainstCathetiAndHypotenuse(
        30,
        40,
        container,
        content,
        scale,
        { maxHypotenuseOverscroll: 25 },
      );

      // Hypotenuse should be clamped to 25 along the (30:40) vector -> (15, 20)
      expect(clamped.x).toBeCloseTo(15);
      expect(clamped.y).toBeCloseTo(20);
      expect(Math.hypot(clamped.x, clamped.y)).toBeCloseTo(25);
    });

    it('clamps matrix translation while preserving scale', () => {
      const container = { width: 400, height: 400 };
      const content = { width: 800, height: 800 };
      const matrix: AffineMatrix = [2, 0, 0, 2, 50, 50]; // scale 2x -> content is 1600x1600

      const clampedMatrix = clampMatrixTranslation(matrix, container, content);
      expect(clampedMatrix[0]).toBe(2);
      expect(clampedMatrix[3]).toBe(2);
      expect(clampedMatrix[4]).toBe(0);
      expect(clampedMatrix[5]).toBe(0);
    });
  });

  describe('Anchor-Point Zoom (Translation * Scale * Translation)', () => {
    it('composes zoom matrix matching Translation * Scale * Translation', () => {
      const anchorX = 250;
      const anchorY = 150;
      const factor = 2;

      const zoomMatrix = createAnchorZoomMatrix(anchorX, anchorY, factor);

      // Expected matrix:
      // a = 2, d = 2
      // tx = (1 - factor) * anchorX = -1 * 250 = -250
      // ty = (1 - factor) * anchorY = -1 * 150 = -150
      expect(zoomMatrix[0]).toBe(2);
      expect(zoomMatrix[1]).toBe(0);
      expect(zoomMatrix[2]).toBe(0);
      expect(zoomMatrix[3]).toBe(2);
      expect(zoomMatrix[4]).toBe(-250);
      expect(zoomMatrix[5]).toBe(-150);
    });

    it('preserves anchor point position in container space during zoom', () => {
      const anchorX = 320;
      const anchorY = 240;
      const initialMatrix = createAffineMatrix(1.5, 0, 0, 1.5, -50, -80);

      // Point in content coordinates under the cursor (anchorX, anchorY) before zoom:
      // P = M^-1 * (anchorX, anchorY)
      const inv = invertAffineMatrix(initialMatrix)!;
      const contentPoint = transformPoint(inv, { x: anchorX, y: anchorY });

      // Apply 2x zoom around anchor (anchorX, anchorY)
      const zoomedMatrix = zoomAroundAnchor(initialMatrix, anchorX, anchorY, 2.0);

      // Verify scale doubled
      expect(getMatrixScale(zoomedMatrix)).toBeCloseTo(3.0);

      // Verify the same content point still maps exactly to the cursor anchor point!
      const mappedAfterZoom = transformPoint(zoomedMatrix, contentPoint);
      expect(mappedAfterZoom.x).toBeCloseTo(anchorX);
      expect(mappedAfterZoom.y).toBeCloseTo(anchorY);
    });

    it('reverses zoom cleanly when multiplied by inverse scale factor', () => {
      const initial = createAffineMatrix(1, 0, 0, 1, 100, 150);
      const anchorX = 400;
      const anchorY = 300;

      const zoomedIn = zoomAroundAnchor(initial, anchorX, anchorY, 2.5);
      const zoomedOut = zoomAroundAnchor(zoomedIn, anchorX, anchorY, 1 / 2.5);

      expect(isAffineMatrixEqual(zoomedOut, initial)).toBe(true);
    });

    it('correctly handles successive zooms around different cursor anchors', () => {
      let matrix = createIdentityMatrix();

      // First zoom 1.5x at (100, 100)
      matrix = zoomAroundAnchor(matrix, 100, 100, 1.5);
      expect(matrix[4]).toBeCloseTo((1 - 1.5) * 100); // -50
      expect(matrix[5]).toBeCloseTo((1 - 1.5) * 100); // -50

      // Second zoom 2x at (300, 200)
      matrix = zoomAroundAnchor(matrix, 300, 200, 2.0);
      expect(getMatrixScale(matrix)).toBeCloseTo(3.0);

      // Test that anchor (300, 200) remained stationary during the second zoom
      // Point under cursor before second zoom:
      const invBefore = invertAffineMatrix(createAffineMatrix(1.5, 0, 0, 1.5, -50, -50))!;
      const contentPoint = transformPoint(invBefore, { x: 300, y: 200 });

      const pointAfter = transformPoint(matrix, contentPoint);
      expect(pointAfter.x).toBeCloseTo(300);
      expect(pointAfter.y).toBeCloseTo(200);
    });
  });

  describe('Float Rounding & Subpixel Stabilization', () => {
    it('snaps to subpixel boundaries based on devicePixelRatio', () => {
      // DPR 2 -> step is 0.5px
      expect(stabilizeFloat(10.23, 2)).toBeCloseTo(10.0);
      expect(stabilizeFloat(10.28, 2)).toBeCloseTo(10.5);

      // DPR 1 -> step is 1.0px
      expect(stabilizeFloat(10.49, 1)).toBe(10);
      expect(stabilizeFloat(10.51, 1)).toBe(11);
    });

    it('suppresses micro-jitter within deadband threshold using Math.hypot', () => {
      const prev = { x: 100, y: 100 };
      // Micro-drift: dx=0.02, dy=0.03 -> hypot = Math.hypot(0.02, 0.03) ≈ 0.036 < 0.05
      const jittery = { x: 100.02, y: 100.03 };
      const stabilized = stabilizeSubpixelDisplacement(jittery, prev, 0.05);

      expect(stabilized).toBe(prev);

      // Substantial move: dx=1.0, dy=2.0 -> hypot > 0.05
      const moved = { x: 101.0, y: 102.0 };
      const stabilizedMove = stabilizeSubpixelDisplacement(moved, prev, 0.05, 1);
      expect(stabilizedMove.x).toBe(101);
      expect(stabilizedMove.y).toBe(102);
    });

    it('stabilizes matrix translation components', () => {
      const matrix: AffineMatrix = [1, 0, 0, 1, 150.49, 200.75];
      const stabilized = stabilizeMatrix(matrix, 2); // DPR 2 -> 0.5 step

      expect(stabilized[0]).toBe(1);
      expect(stabilized[3]).toBe(1);
      expect(stabilized[4]).toBeCloseTo(150.5);
      expect(stabilized[5]).toBeCloseTo(201.0);
    });

    it('formats valid CSS transform string', () => {
      const matrix: AffineMatrix = [1.5, 0, 0, 1.5, 100, 200];
      expect(toCSSMatrix(matrix)).toBe('matrix(1.5, 0, 0, 1.5, 100, 200)');
    });
  });
});
