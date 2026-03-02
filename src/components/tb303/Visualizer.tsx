import { useEffect, useRef } from 'react';

interface VisualizerProps {
  isPlaying: boolean;
  cutoff: number;
  resonance: number;
}

export function Visualizer({ isPlaying, cutoff, resonance }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = 0;
    const targetFPS = 30; // Lower FPS for mobile battery
    const frameInterval = 1000 / targetFPS;

    const draw = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;

      if (deltaTime < frameInterval) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      lastTime = currentTime - deltaTime % frameInterval;

      const { width, height } = canvas;

      // Clear with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, width, height);

      // Draw grid (simplified for performance)
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }

      if (isPlaying) {
        const centerY = height / 2;
        const amplitude = height * 0.35;

        ctx.beginPath();
        ctx.strokeStyle = '#ff6b00';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ff6b00';
        ctx.shadowBlur = 8;

        for (let x = 0; x < width; x += 2) {// Skip pixels for performance
          const t = x / width * Math.PI * 8 + phaseRef.current;

          let y = 0;
          const harmonics = Math.floor(1 + cutoff * 10);

          for (let h = 1; h <= harmonics; h++) {
            const harmonicAmp = 1 / h;
            const resonanceBoost = h === harmonics ? 1 + resonance * 2 : 1;
            y += Math.sin(t * h) * harmonicAmp * resonanceBoost;
          }

          y = y * amplitude * (0.5 + resonance * 0.4);

          if (x === 0) {
            ctx.moveTo(x, centerY + y);
          } else {
            ctx.lineTo(x, centerY + y);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        phaseRef.current += 0.12;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, cutoff, resonance]);

  return (
    <canvas
    ref={canvasRef}
    width={300}
    height={80}
    className="w-48 md:w-64 lg:w-80 h-16 md:h-20 rounded-lg border border-zinc-700 bg-black" />);


}