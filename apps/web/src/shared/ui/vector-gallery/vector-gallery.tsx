import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  type AffineMatrix,
  type Dimensions2D,
  type Point2D,
  getMatrixScale,
  zoomAroundAnchor,
  clampMatrixTranslation,
  stabilizeSubpixelDisplacement,
  stabilizeMatrix,
  toCSSMatrix,
} from '../../lib/math/affine-matrix';

export interface VectorGalleryProps {
  /** Source URL of the visual or vector asset */
  readonly src: string;
  /** Accessible alt text */
  readonly alt?: string;
  /** Additional container classes */
  readonly className?: string;
  /** Inline container styles */
  readonly style?: React.CSSProperties;
  /** Minimum scale factor (default: 0.1) */
  readonly minZoom?: number;
  /** Maximum scale factor (default: 15.0) */
  readonly maxZoom?: number;
  /** Initial scale factor (default: 1.0) */
  readonly initialZoom?: number;
  /** Zoom step multiplier for buttons and keyboard zoom (default: 1.25) */
  readonly zoomStep?: number;
  /** Whether to render the visual status overlay and quick controls (default: true) */
  readonly showStatusOverlay?: boolean;
  /** Allow mouse wheel zoom even when CTRL is not pressed (default: false) */
  readonly enableWheelZoomWithoutCtrl?: boolean;
  /** Safe margin padding inside container for bounds checking (default: 0) */
  readonly padding?: number;
  /** Callback fired when transformation matrix changes */
  readonly onTransformChange?: (
    matrix: AffineMatrix,
    info: { readonly zoom: number; readonly x: number; readonly y: number },
  ) => void;
  /** Optional custom overlays or children */
  readonly children?: React.ReactNode;
}

/**
 * ============================================================================
 * VectorGallery — Zero-Dependency High-Performance Interactive Image Viewer
 * Induktr Studio v2.0
 * ============================================================================
 * - Pure 2D Affine Matrix mathematical transformations
 * - Direct DOM matrix styling + rAF loop: ZERO React Fiber reconciliation during drag/zoom
 * - Pointer events for seamless mouse & touch panning
 * - Pinch-to-zoom multi-touch support using Math.hypot distance
 * - Non-passive wheel event handling preventing browser page zoom on Ctrl+Wheel
 * - Accessible keyboard navigation (Ctrl + +, Ctrl + -, Ctrl + 0)
 * - Double-click reset
 */
export function VectorGallery({
  src,
  alt = 'Vector gallery viewer',
  className = '',
  style,
  minZoom = 0.1,
  maxZoom = 15.0,
  initialZoom = 1.0,
  zoomStep = 1.25,
  showStatusOverlay = true,
  enableWheelZoomWithoutCtrl = false,
  padding = 0,
  onTransformChange,
  children,
}: VectorGalleryProps) {
  // DOM element references
  const containerRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Status overlay text refs (updated directly in rAF to prevent React re-renders)
  const zoomLabelRef = useRef<HTMLSpanElement>(null);
  const coordsLabelRef = useRef<HTMLSpanElement>(null);
  const statusAriaLiveRef = useRef<HTMLDivElement>(null);

  // Initial affine matrix [initialZoom, 0, 0, initialZoom, 0, 0]
  const initialMatrix: AffineMatrix = [initialZoom, 0, 0, initialZoom, 0, 0];

  // Transformation & Interaction state (Mutable refs for zero-fiber reconciliation)
  const matrixRef = useRef<AffineMatrix>(initialMatrix);
  const targetMatrixRef = useRef<AffineMatrix>(initialMatrix);
  const rafIdRef = useRef<number | null>(null);

  // Pointer tracking
  const activePointersRef = useRef<Map<number, Point2D>>(new Map());
  const lastPanPointRef = useRef<Point2D | null>(null);
  const prevPinchDistanceRef = useRef<number>(0);
  const prevPinchCenterRef = useRef<Point2D | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Viewport & Content dimensions
  const containerDimsRef = useRef<Dimensions2D>({ width: 0, height: 0 });
  const contentDimsRef = useRef<Dimensions2D>({ width: 0, height: 0 });

  // Callback ref to always call freshest user callback without recreating listeners
  const onTransformChangeRef = useRef(onTransformChange);
  useEffect(() => {
    onTransformChangeRef.current = onTransformChange;
  }, [onTransformChange]);

  // Loading state (only renders initially on mount/image load)
  const [isLoaded, setIsLoaded] = useState(false);

  /**
   * Applies the transformation directly to DOM element and status overlay labels
   * with subpixel stabilization. Avoids triggering any React Fiber reconciliation.
   */
  const applyTransformDirect = useCallback((matrix: AffineMatrix) => {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const stabilized = stabilizeMatrix(matrix, dpr);

    if (contentWrapperRef.current) {
      contentWrapperRef.current.style.transform = toCSSMatrix(stabilized);
    }

    const scale = getMatrixScale(stabilized);
    const zoomPercent = Math.round(scale * 100);
    const xCoord = Math.round(stabilized[4]);
    const yCoord = Math.round(stabilized[5]);

    if (zoomLabelRef.current) {
      zoomLabelRef.current.textContent = `${zoomPercent}%`;
    }
    if (coordsLabelRef.current) {
      coordsLabelRef.current.textContent = `X: ${xCoord}px  Y: ${yCoord}px`;
    }

    if (onTransformChangeRef.current) {
      onTransformChangeRef.current(stabilized, {
        zoom: scale,
        x: stabilized[4],
        y: stabilized[5],
      });
    }
  }, []);

  /**
   * Schedules a requestAnimationFrame flush to synchronize DOM writes with screen refresh.
   */
  const scheduleFlush = useCallback(() => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      matrixRef.current = targetMatrixRef.current;
      applyTransformDirect(targetMatrixRef.current);
    });
  }, [applyTransformDirect]);

  /**
   * Updates target matrix with optional container catheti & hypotenuse clamping.
   */
  const updateMatrix = useCallback(
    (newMatrix: AffineMatrix, clamp = true, allowElastic = false) => {
      let m = newMatrix;
      if (
        clamp &&
        containerDimsRef.current.width > 0 &&
        contentDimsRef.current.width > 0
      ) {
        m = clampMatrixTranslation(
          newMatrix,
          containerDimsRef.current,
          contentDimsRef.current,
          {
            padding,
            centerWhenSmaller: true,
            maxHypotenuseOverscroll: allowElastic ? 35 : 0,
          },
        );
      }
      targetMatrixRef.current = m;
      scheduleFlush();
    },
    [padding, scheduleFlush],
  );

  /**
   * Finalizes clamp to ensure boundaries strictly snap to safe bounding box on pointer release.
   */
  const finalizeClamp = useCallback(() => {
    if (
      containerDimsRef.current.width > 0 &&
      contentDimsRef.current.width > 0
    ) {
      const strictlyClamped = clampMatrixTranslation(
        targetMatrixRef.current,
        containerDimsRef.current,
        contentDimsRef.current,
        {
          padding,
          centerWhenSmaller: true,
          maxHypotenuseOverscroll: 0,
        },
      );
      targetMatrixRef.current = strictlyClamped;
      scheduleFlush();
    }

    // Accessible notification for assistive technologies
    if (statusAriaLiveRef.current) {
      const scale = getMatrixScale(targetMatrixRef.current);
      statusAriaLiveRef.current.textContent = `Viewer updated: zoom ${Math.round(
        scale * 100,
      )} percent, position X ${Math.round(
        targetMatrixRef.current[4],
      )}, Y ${Math.round(targetMatrixRef.current[5])}`;
    }
  }, [padding, scheduleFlush]);

  /**
   * Centers the content inside the container at a specified scale factor.
   */
  const centerContent = useCallback(
    (scale = initialZoom) => {
      const containerW = containerDimsRef.current.width;
      const containerH = containerDimsRef.current.height;
      const contentW = contentDimsRef.current.width;
      const contentH = contentDimsRef.current.height;

      const clampedScale = Math.min(Math.max(scale, minZoom), maxZoom);
      const scaledW = contentW * clampedScale;
      const scaledH = contentH * clampedScale;

      const tx = containerW > 0 ? (containerW - scaledW) / 2 : 0;
      const ty = containerH > 0 ? (containerH - scaledH) / 2 : 0;

      const resetMatrix: AffineMatrix = [clampedScale, 0, 0, clampedScale, tx, ty];
      updateMatrix(resetMatrix, false, false);
      finalizeClamp();
    },
    [initialZoom, minZoom, maxZoom, updateMatrix, finalizeClamp],
  );

  /**
   * Zooms around a specific anchor point (cursor or center) by a relative multiplier.
   */
  const zoomAtPoint = useCallback(
    (anchorX: number, anchorY: number, factor: number) => {
      const currentScale = getMatrixScale(targetMatrixRef.current);
      const newScale = Math.min(Math.max(currentScale * factor, minZoom), maxZoom);
      if (newScale === currentScale) return;

      const effectiveFactor = newScale / currentScale;
      const newMatrix = zoomAroundAnchor(
        targetMatrixRef.current,
        anchorX,
        anchorY,
        effectiveFactor,
      );
      updateMatrix(newMatrix, true, false);
    },
    [minZoom, maxZoom, updateMatrix],
  );

  // ResizeObserver for tracking container viewport catheti
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        containerDimsRef.current = { width, height };
        if (contentDimsRef.current.width > 0) {
          finalizeClamp();
        }
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, [finalizeClamp]);

  // Non-passive wheel event listener to reliably intercept Ctrl+Wheel and prevent browser page zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      const shouldZoom = e.ctrlKey || e.metaKey || enableWheelZoomWithoutCtrl;
      if (!shouldZoom) return;

      // Crucial: prevent native browser page zoom
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const anchorX = e.clientX - rect.left;
      const anchorY = e.clientY - rect.top;

      // Exponential smooth wheel factor
      const zoomDelta = -e.deltaY * 0.003;
      const factor = Math.exp(zoomDelta);

      zoomAtPoint(anchorX, anchorY, factor);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [enableWheelZoomWithoutCtrl, zoomAtPoint]);

  // Cancel any pending rAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  /**
   * Pointer Down — Captures pointer and initializes 1-finger pan or 2-finger pinch
   */
  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const container = containerRef.current;
    if (!container) return;

    try {
      container.setPointerCapture(e.pointerId);
    } catch {
      // Ignore unsupported capture in headless/test environments
    }

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    isDraggingRef.current = true;

    if (activePointersRef.current.size === 1) {
      lastPanPointRef.current = { x: e.clientX, y: e.clientY };
    } else if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      const p1 = pts[0];
      const p2 = pts[1];
      if (p1 && p2) {
        prevPinchDistanceRef.current = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        prevPinchCenterRef.current = {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2,
        };
      }
      lastPanPointRef.current = null;
    }
  }, []);

  /**
   * Pointer Move — Butter-smooth dragging and pinch zoom without React Fiber overhead
   */
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!activePointersRef.current.has(e.pointerId)) return;

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch Pinch to Zoom using Math.hypot distance
    if (activePointersRef.current.size >= 2) {
      const pts = Array.from(activePointersRef.current.values());
      const p1 = pts[0];
      const p2 = pts[1];
      if (!p1 || !p2 || !containerRef.current) return;

      const currentDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const currentCenter = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      };

      if (prevPinchDistanceRef.current > 0) {
        const factor = currentDist / prevPinchDistanceRef.current;
        const currentScale = getMatrixScale(targetMatrixRef.current);
        const newScale = Math.min(Math.max(currentScale * factor, minZoom), maxZoom);
        const effectiveFactor = newScale / currentScale;

        const rect = containerRef.current.getBoundingClientRect();
        const anchorX = currentCenter.x - rect.left;
        const anchorY = currentCenter.y - rect.top;

        let next = zoomAroundAnchor(targetMatrixRef.current, anchorX, anchorY, effectiveFactor);

        // Center translation tracking
        if (prevPinchCenterRef.current) {
          const centerDx = currentCenter.x - prevPinchCenterRef.current.x;
          const centerDy = currentCenter.y - prevPinchCenterRef.current.y;
          next = [next[0], next[1], next[2], next[3], next[4] + centerDx, next[5] + centerDy];
        }

        updateMatrix(next, true, true);
      }

      prevPinchDistanceRef.current = currentDist;
      prevPinchCenterRef.current = currentCenter;
      return;
    }

    // Single Pointer Pan
    if (lastPanPointRef.current) {
      const currentPoint = { x: e.clientX, y: e.clientY };
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const stabilized = stabilizeSubpixelDisplacement(
        currentPoint,
        lastPanPointRef.current,
        0.05,
        dpr,
      );

      const dx = stabilized.x - lastPanPointRef.current.x;
      const dy = stabilized.y - lastPanPointRef.current.y;

      if (dx !== 0 || dy !== 0) {
        const cur = targetMatrixRef.current;
        const nextMatrix: AffineMatrix = [
          cur[0],
          cur[1],
          cur[2],
          cur[3],
          cur[4] + dx,
          cur[5] + dy,
        ];
        updateMatrix(nextMatrix, true, true);
        lastPanPointRef.current = currentPoint;
      }
    }
  }, [minZoom, maxZoom, updateMatrix]);

  /**
   * Pointer Up / Cancel — Release pointer capture and snap safely back into bounds
   */
  const handlePointerUp = useCallback((e: PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);
    try {
      if (containerRef.current?.hasPointerCapture(e.pointerId)) {
        containerRef.current.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }

    if (activePointersRef.current.size === 0) {
      isDraggingRef.current = false;
      lastPanPointRef.current = null;
      prevPinchDistanceRef.current = 0;
      prevPinchCenterRef.current = null;
      finalizeClamp();
    } else if (activePointersRef.current.size === 1) {
      // Transition from pinch back to 1-finger pan smoothly
      const remaining = Array.from(activePointersRef.current.values())[0];
      if (remaining) {
        lastPanPointRef.current = remaining;
      }
      prevPinchDistanceRef.current = 0;
      prevPinchCenterRef.current = null;
    }
  }, [finalizeClamp]);

  /**
   * Keyboard Navigation:
   * CTRL + '+' / '=': Zoom in
   * CTRL + '-' / '_': Zoom out
   * CTRL + '0': Reset zoom and position
   * Arrow keys: Pan
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isCtrl = e.ctrlKey || e.metaKey;

    if (isCtrl) {
      if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
        e.preventDefault();
        const cx = containerDimsRef.current.width / 2;
        const cy = containerDimsRef.current.height / 2;
        zoomAtPoint(cx, cy, zoomStep);
        return;
      }

      if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        const cx = containerDimsRef.current.width / 2;
        const cy = containerDimsRef.current.height / 2;
        zoomAtPoint(cx, cy, 1 / zoomStep);
        return;
      }

      if (e.key === '0' || e.code === 'Numpad0') {
        e.preventDefault();
        centerContent(initialZoom);
        return;
      }
    }

    // Accessible arrow key panning
    const step = e.shiftKey ? 60 : 25;
    let dx = 0;
    let dy = 0;
    if (e.key === 'ArrowUp') dy = step;
    else if (e.key === 'ArrowDown') dy = -step;
    else if (e.key === 'ArrowLeft') dx = step;
    else if (e.key === 'ArrowRight') dx = -step;

    if (dx !== 0 || dy !== 0) {
      e.preventDefault();
      const cur = targetMatrixRef.current;
      const nextMatrix: AffineMatrix = [
        cur[0],
        cur[1],
        cur[2],
        cur[3],
        cur[4] + dx,
        cur[5] + dy,
      ];
      updateMatrix(nextMatrix, true, false);
    }
  }, [zoomStep, zoomAtPoint, centerContent, initialZoom, updateMatrix]);

  /**
   * Double Click — Reset coordinates to centered initial state
   */
  const handleDoubleClick = useCallback((e: MouseEvent) => {
    e.preventDefault();
    centerContent(initialZoom);
  }, [centerContent, initialZoom]);

  // Bind native pointer, keyboard, and double click listeners directly to container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.tabIndex = 0;

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointercancel', handlePointerUp);
    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('dblclick', handleDoubleClick);

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointercancel', handlePointerUp);
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleKeyDown,
    handleDoubleClick,
  ]);

  /**
   * Image Load Handler — Extracts natural dimensions and centers asset
   */
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    contentDimsRef.current = {
      width: img.naturalWidth || img.clientWidth || 800,
      height: img.naturalHeight || img.clientHeight || 600,
    };

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      containerDimsRef.current = { width: rect.width, height: rect.height };
    }

    centerContent(initialZoom);
    setIsLoaded(true);
  };

  return (
    <div
      ref={containerRef}
      aria-label={alt ? `Interactive gallery: ${alt}` : 'Interactive vector image viewer'}
      className={`relative overflow-hidden outline-none select-none touch-none bg-[var(--bg-card,#141924)] border border-[var(--border-subtle,rgba(255,255,255,0.08))] rounded-xl cursor-grab active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-[var(--accent-cyan,#38bdf8)] ${className}`}
      style={{
        touchAction: 'none',
        ...style,
      }}
    >
      {/* Transform Target Wrapper (Zero React Fiber re-renders during interactions) */}
      <div
        ref={contentWrapperRef}
        className="absolute top-0 left-0 origin-top-left will-change-transform pointer-events-none"
        style={{
          transformOrigin: '0 0',
          transform: toCSSMatrix(initialMatrix),
        }}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          draggable={false}
          onLoad={handleImageLoad}
          className={`max-w-none block transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {/* Screen Reader Live Status Region */}
      <div
        ref={statusAriaLiveRef}
        aria-live="polite"
        className="sr-only"
      />

      {/* Interactive Status Overlay & Quick Controls */}
      {showStatusOverlay && (
        <aside
          aria-label="Viewer controls"
          className="absolute bottom-3 right-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-glass,rgba(10,13,20,0.85))] backdrop-blur-md border border-[var(--border-subtle,rgba(255,255,255,0.12))] shadow-xl text-xs font-mono select-none"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Zoom Percentage */}
          <span
            ref={zoomLabelRef}
            className="font-bold text-[var(--accent-cyan,#38bdf8)] min-w-[42px] text-center"
          >
            {Math.round(initialZoom * 100)}%
          </span>

          <span className="text-[var(--text-dim,#475569)]">|</span>

          {/* Coordinates X/Y */}
          <span
            ref={coordsLabelRef}
            className="text-[var(--text-secondary,#94a3b8)] min-w-[110px]"
          >
            X: 0px  Y: 0px
          </span>

          <span className="text-[var(--text-dim,#475569)]">|</span>

          {/* Control Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Zoom out (Ctrl + Minus)"
              title="Zoom out (Ctrl + -)"
              className="w-6 h-6 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 active:bg-white/20 text-white transition-colors cursor-pointer"
              onClick={() => {
                const cx = containerDimsRef.current.width / 2;
                const cy = containerDimsRef.current.height / 2;
                zoomAtPoint(cx, cy, 1 / zoomStep);
              }}
            >
              −
            </button>
            <button
              type="button"
              aria-label="Zoom in (Ctrl + Plus)"
              title="Zoom in (Ctrl + +)"
              className="w-6 h-6 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 active:bg-white/20 text-white transition-colors cursor-pointer"
              onClick={() => {
                const cx = containerDimsRef.current.width / 2;
                const cy = containerDimsRef.current.height / 2;
                zoomAtPoint(cx, cy, zoomStep);
              }}
            >
              +
            </button>
            <button
              type="button"
              aria-label="Reset zoom and coordinates (Ctrl + 0 or Double Click)"
              title="Reset view (Ctrl + 0)"
              className="px-1.5 h-6 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 active:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer text-[10px]"
              onClick={() => centerContent(initialZoom)}
            >
              1:1
            </button>
          </div>
        </aside>
      )}

      {/* Custom Children / Slot */}
      {children}
    </div>
  );
}
