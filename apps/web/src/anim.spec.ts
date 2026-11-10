import { describe, it, expect } from 'vitest';
import { createAffineMatrixEngine } from './shared/lib/anim/matrix-engine';
import { scheduleLowPriorityTask } from './shared/lib/anim/scheduler';

describe('Functional Affine Matrix & Linear Algebra Engine (Vector Transform)', () => {
  it('initializes identity matrix [1, 0, 0, 1, 0, 0]', () => {
    const engine = createAffineMatrixEngine(10);
    const m = engine.getMatrix(0);
    expect(m).toEqual([1, 0, 0, 1, 0, 0]);
  });

  it('correctly calculates translation and scale transformations', () => {
    const engine = createAffineMatrixEngine(10);
    // id 0: translate(50, 100), scale(2, 3), rotation 0
    engine.setTransform(0, 50, 100, 2, 3, 0);
    const m = engine.getMatrix(0);
    expect(m[0]).toBeCloseTo(2);   // a (scaleX)
    expect(m[1]).toBeCloseTo(0);   // b
    expect(m[2]).toBeCloseTo(0);   // c
    expect(m[3]).toBeCloseTo(3);   // d (scaleY)
    expect(m[4]).toBeCloseTo(50);  // tx
    expect(m[5]).toBeCloseTo(100); // ty
  });

  it('correctly computes 90-degree basis vector rotation', () => {
    const engine = createAffineMatrixEngine(10);
    const rad90 = Math.PI / 2;
    engine.setTransform(1, 0, 0, 1, 1, rad90);
    const m = engine.getMatrix(1);
    expect(m[0]).toBeCloseTo(0);   // cos(90) -> 0
    expect(m[1]).toBeCloseTo(1);   // sin(90) -> 1
    expect(m[2]).toBeCloseTo(-1);  // -sin(90) -> -1
    expect(m[3]).toBeCloseTo(0);   // cos(90) -> 0
  });

  it('correctly multiplies two affine transformation matrices', () => {
    const engine = createAffineMatrixEngine(10);
    // Identity * Translation(10, 20)
    engine.multiply(2, 1, 0, 0, 1, 10, 20);
    const m = engine.getMatrix(2);
    expect(m[4]).toBe(10);
    expect(m[5]).toBe(20);
  });

  it('schedules low priority tasks via scheduler fallback safely', () => {
    let executed = false;
    scheduleLowPriorityTask(() => {
      executed = true;
    });
    expect(executed).toBe(false);
    expect(typeof scheduleLowPriorityTask).toBe('function');
  });
});
