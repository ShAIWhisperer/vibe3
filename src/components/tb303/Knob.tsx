import { useRef, useEffect, useState, useCallback } from 'react';
import { Waves } from 'lucide-react';

interface KnobProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  size?: number;
  color?: string;
  hasAutomation?: boolean;
  isHighlighted?: boolean;
  paramId?: string;
}

export function Knob({
  value,
  onChange,
  label,
  min = 0,
  max = 1,
  size = 60,
  color = '#ff6b00',
  hasAutomation = false,
  isHighlighted = false,
  paramId
}: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);

  const normalizedValue = (value - min) / (max - min);
  const rotation = -135 + normalizedValue * 270;

  const handleStart = useCallback((clientY: number) => {
    setIsDragging(true);
    startYRef.current = clientY;
    startValueRef.current = value;
  }, [value]);

  const handleMove = useCallback((clientY: number) => {
    if (!isDragging) return;

    const deltaY = startYRef.current - clientY;
    const sensitivity = 0.008; // Slightly higher for touch
    const newValue = Math.max(min, Math.min(max,
    startValueRef.current + deltaY * sensitivity * (max - min)
    ));
    onChange(newValue);
  }, [isDragging, min, max, onChange]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientY);
    const handleMouseUp = () => handleEnd();

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMove, handleEnd]);

  // Touch events
  useEffect(() => {
    const knob = knobRef.current;
    if (!knob) return;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => handleEnd();

    if (isDragging) {
      knob.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('touchcancel', handleTouchEnd);
    }

    return () => {
      knob.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      handleStart(e.touches[0].clientY);
    }
  };

  // Scale body inset and indicator proportionally to knob size
  const bodyInset = Math.max(2, Math.round(size * 0.12));
  const bodySize = size - bodyInset * 2;
  const indicatorTop = Math.max(1, Math.round(bodySize * 0.08));
  const indicatorHeight = Math.max(3, Math.round(bodySize * 0.3));
  const indicatorWidth = Math.max(2, Math.round(bodySize * 0.08));

  return (
    <div className="flex flex-col items-center gap-1">
      <div
      ref={knobRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className="relative cursor-pointer select-none touch-none"
      style={{ width: size, height: size }}>

        {/* Outer ring with notches */}
        <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="absolute inset-0">

          {/* Track background */}
          <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="4 8"
          transform="rotate(-135 50 50)" />

          {/* Active track */}
          <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${normalizedValue * 188} 188`}
          transform="rotate(-135 50 50)"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }} />

        </svg>

        {/* Knob body */}
        <div
        className="absolute rounded-full"
        style={{
          top: bodyInset,
          left: bodyInset,
          right: bodyInset,
          bottom: bodyInset,
          background: 'linear-gradient(145deg, #3a3a3a, #1a1a1a)',
          boxShadow: `
              inset 2px 2px 4px rgba(255,255,255,0.1),
              inset -2px -2px 4px rgba(0,0,0,0.5),
              0 4px 8px rgba(0,0,0,0.5)
            `,
          transform: `rotate(${rotation}deg)`,
          transition: isDragging ? 'none' : 'transform 0.05s'
        }}>

          {/* Indicator line */}
          <div
          className="absolute left-1/2 rounded-full -translate-x-1/2"
          style={{
            top: indicatorTop,
            width: indicatorWidth,
            height: indicatorHeight,
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}`
          }} />

        </div>
        
        {/* Touch feedback ring */}
        {isDragging &&
        <div
        className="absolute inset-0 rounded-full border-2 animate-pulse"
        style={{ borderColor: color, opacity: 0.5 }} />

        }
        
        {/* Learn mode highlight ring */}
        {isHighlighted && !isDragging &&
        <div
        className="absolute -inset-2 rounded-full border-2 animate-pulse"
        style={{
          borderColor: '#22d3ee',
          boxShadow: '0 0 20px #22d3ee, 0 0 40px #22d3ee',
          opacity: 0.8
        }} />

        }
        
        {/* Automation indicator */}
        {hasAutomation && !isDragging &&
        <div
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
        style={{ backgroundColor: color }}>

            <Waves size={10} className="text-black" />
          </div>
        }
      </div>
      
      <span
      className={`text-[10px] sm:text-xs font-bold tracking-wider uppercase text-center leading-tight ${
      isHighlighted ? 'text-cyan-400' : 'text-gray-300'}`
      }>

        {label}
      </span>
    </div>);

}