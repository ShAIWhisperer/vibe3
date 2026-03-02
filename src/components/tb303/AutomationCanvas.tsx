import { useRef, useEffect, useCallback, useState } from 'react';
import { AUTOMATION_RESOLUTION, type AutomationParam, AUTOMATION_PARAMS } from '@/hooks/use-tb303-engine';

interface AutomationCanvasProps {
  points: number[];
  playbackPosition: number;
  isPlaying: boolean;
  color: string;
  paramId: AutomationParam;
  onDraw: (points: number[]) => void;
}

export function AutomationCanvas({
  points,
  playbackPosition,
  isPlaying,
  color,
  paramId,
  onDraw
}: AutomationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const lastDrawIndexRef = useRef(-1);
  const localPointsRef = useRef<number[]>([...points]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Update local points when props change
  useEffect(() => {
    localPointsRef.current = [...points];
  }, [points]);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    if (width === 0 || height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    // Vertical lines (16 steps)
    for (let i = 0; i <= 16; i++) {
      const x = i / 16 * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines (quarters)
    for (let i = 0; i <= 4; i++) {
      const y = i / 4 * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw step markers
    ctx.fillStyle = '#444';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < 16; i++) {
      const x = (i + 0.5) / 16 * width;
      ctx.fillText(`${i + 1}`, x, height - 4);
    }

    // Draw automation curve
    const pts = localPointsRef.current;
    const hasData = pts.some((p) => p >= 0);

    if (hasData) {
      // Fill area under curve
      ctx.beginPath();
      ctx.moveTo(0, height);

      let firstValidIndex = -1;
      let lastValidIndex = -1;

      // Find first and last valid points
      for (let i = 0; i < pts.length; i++) {
        if (pts[i] >= 0) {
          if (firstValidIndex === -1) firstValidIndex = i;
          lastValidIndex = i;
        }
      }

      if (firstValidIndex >= 0) {
        // Interpolate and draw smooth curve
        const getInterpolatedValue = (index: number): number => {
          const val = pts[index];
          if (val >= 0) return val;

          // Find nearest valid points
          let prevIdx = index - 1;
          let nextIdx = index + 1;

          while (prevIdx >= 0 && pts[prevIdx] < 0) prevIdx--;
          while (nextIdx < pts.length && pts[nextIdx] < 0) nextIdx++;

          if (prevIdx < 0 && nextIdx >= pts.length) return -1;
          if (prevIdx < 0) return pts[nextIdx];
          if (nextIdx >= pts.length) return pts[prevIdx];

          // Linear interpolation
          const t = (index - prevIdx) / (nextIdx - prevIdx);
          return pts[prevIdx] + (pts[nextIdx] - pts[prevIdx]) * t;
        };

        // Draw filled area
        ctx.fillStyle = color + '20';
        ctx.beginPath();

        for (let i = 0; i < pts.length; i++) {
          const x = i / (pts.length - 1) * width;
          const val = getInterpolatedValue(i);
          if (val >= 0) {
            const y = (1 - val) * (height - 20) + 10;
            if (i === 0 || i > 0 && getInterpolatedValue(i - 1) < 0) {
              ctx.moveTo(x, height - 15);
              ctx.lineTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
        }

        // Close the fill path
        const lastX = (pts.length - 1) / (pts.length - 1) * width;
        ctx.lineTo(lastX, height - 15);
        ctx.closePath();
        ctx.fill();

        // Draw the line
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();

        let started = false;
        for (let i = 0; i < pts.length; i++) {
          const x = i / (pts.length - 1) * width;
          const val = getInterpolatedValue(i);
          if (val >= 0) {
            const y = (1 - val) * (height - 20) + 10;
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.stroke();

        // Draw points at actual data positions
        ctx.fillStyle = color;
        for (let i = 0; i < pts.length; i++) {
          if (pts[i] >= 0) {
            const x = i / (pts.length - 1) * width;
            const y = (1 - pts[i]) * (height - 20) + 10;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    } else {
      // No data - show hint
      ctx.fillStyle = '#555';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Draw or record automation', width / 2, height / 2);
    }

    // Draw playhead
    if (isPlaying) {
      const playheadX = playbackPosition * width;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Playhead triangle
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(playheadX - 6, 0);
      ctx.lineTo(playheadX + 6, 0);
      ctx.lineTo(playheadX, 8);
      ctx.closePath();
      ctx.fill();
    }
  }, [dimensions, color, playbackPosition, isPlaying]);

  // Redraw on changes
  useEffect(() => {
    draw();
  }, [draw, points]);

  // Animation frame for smooth playhead
  useEffect(() => {
    if (!isPlaying) return;

    let animFrame: number;
    const animate = () => {
      draw();
      animFrame = requestAnimationFrame(animate);
    };
    animFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, draw]);

  // Get position from event
  const getPositionFromEvent = useCallback((e: React.MouseEvent | React.TouchEvent): {x: number;y: number;} | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) / rect.width;
    const y = 1 - (clientY - rect.top) / rect.height;

    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  }, []);

  // Drawing handlers
  const handleDrawStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawingRef.current = true;
    lastDrawIndexRef.current = -1;

    const pos = getPositionFromEvent(e);
    if (pos) {
      const index = Math.floor(pos.x * AUTOMATION_RESOLUTION);
      const clampedIndex = Math.max(0, Math.min(AUTOMATION_RESOLUTION - 1, index));

      localPointsRef.current[clampedIndex] = pos.y;
      lastDrawIndexRef.current = clampedIndex;
      draw();
    }
  }, [getPositionFromEvent, draw]);

  const handleDrawMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();

    const pos = getPositionFromEvent(e);
    if (pos) {
      const index = Math.floor(pos.x * AUTOMATION_RESOLUTION);
      const clampedIndex = Math.max(0, Math.min(AUTOMATION_RESOLUTION - 1, index));

      // Interpolate between last and current to fill gaps
      if (lastDrawIndexRef.current >= 0 && lastDrawIndexRef.current !== clampedIndex) {
        const start = Math.min(lastDrawIndexRef.current, clampedIndex);
        const end = Math.max(lastDrawIndexRef.current, clampedIndex);
        const startVal = localPointsRef.current[lastDrawIndexRef.current];
        const endVal = pos.y;

        for (let i = start; i <= end; i++) {
          const t = (i - start) / (end - start);
          localPointsRef.current[i] = startVal + (endVal - startVal) * t;
        }
      } else {
        localPointsRef.current[clampedIndex] = pos.y;
      }

      lastDrawIndexRef.current = clampedIndex;
      draw();
    }
  }, [getPositionFromEvent, draw]);

  const handleDrawEnd = useCallback(() => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastDrawIndexRef.current = -1;
      onDraw([...localPointsRef.current]);
    }
  }, [onDraw]);

  return (
    <div
    ref={containerRef}
    className="w-full h-40 sm:h-48 bg-zinc-900 rounded-lg border border-zinc-700 overflow-hidden relative">

      <canvas
      ref={canvasRef}
      className="w-full h-full cursor-crosshair touch-none"
      style={{ width: dimensions.width, height: dimensions.height }}
      onMouseDown={handleDrawStart}
      onMouseMove={handleDrawMove}
      onMouseUp={handleDrawEnd}
      onMouseLeave={handleDrawEnd}
      onTouchStart={handleDrawStart}
      onTouchMove={handleDrawMove}
      onTouchEnd={handleDrawEnd} />

      
      {/* Parameter label */}
      <div
      className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold"
      style={{ backgroundColor: color + '30', color }}>

        {AUTOMATION_PARAMS.find((p) => p.id === paramId)?.label}
      </div>
    </div>);

}