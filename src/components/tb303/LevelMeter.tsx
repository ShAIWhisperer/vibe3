import React, { useRef, useEffect, useState } from 'react';

interface LevelMeterProps {
  level: number; // 0-1
  height?: number;
  stereo?: boolean;
  leftLevel?: number;
  rightLevel?: number;
}

export const LevelMeter = React.memo(function LevelMeter({
  level,
  height = 60,
  stereo = false,
  leftLevel = 0,
  rightLevel = 0,
}: LevelMeterProps) {
  const [peakL, setPeakL] = useState(0);
  const [peakR, setPeakR] = useState(0);
  const peakTimerL = useRef<number>(0);
  const peakTimerR = useRef<number>(0);

  const lLevel = stereo ? leftLevel : level;
  const rLevel = stereo ? rightLevel : level;

  // Peak hold
  useEffect(() => {
    if (lLevel > peakL) {
      setPeakL(lLevel);
      peakTimerL.current = Date.now();
    } else if (Date.now() - peakTimerL.current > 1500) {
      setPeakL(prev => Math.max(0, prev - 0.02));
    }
  }, [lLevel, peakL]);

  useEffect(() => {
    if (rLevel > peakR) {
      setPeakR(rLevel);
      peakTimerR.current = Date.now();
    } else if (Date.now() - peakTimerR.current > 1500) {
      setPeakR(prev => Math.max(0, prev - 0.02));
    }
  }, [rLevel, peakR]);

  const renderBar = (lvl: number, peak: number, key: string) => {
    const barHeight = lvl * height;
    const peakPos = peak * height;

    return (
      <div
        key={key}
        className="relative rounded-sm overflow-hidden"
        style={{ width: stereo ? 4 : 6, height, backgroundColor: '#1a1a1a' }}
      >
        {/* Green zone (0-70%) */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-[height] duration-75"
          style={{
            height: Math.min(barHeight, height * 0.7),
            background: 'linear-gradient(to top, #22c55e, #4ade80)',
          }}
        />
        {/* Yellow zone (70-90%) */}
        {lvl > 0.7 && (
          <div
            className="absolute left-0 right-0"
            style={{
              bottom: height * 0.7,
              height: Math.min(barHeight - height * 0.7, height * 0.2),
              background: 'linear-gradient(to top, #eab308, #facc15)',
            }}
          />
        )}
        {/* Red zone (90-100%) */}
        {lvl > 0.9 && (
          <div
            className="absolute left-0 right-0"
            style={{
              bottom: height * 0.9,
              height: barHeight - height * 0.9,
              background: 'linear-gradient(to top, #ef4444, #f87171)',
            }}
          />
        )}
        {/* Peak indicator */}
        {peak > 0.05 && (
          <div
            className="absolute left-0 right-0"
            style={{
              bottom: peakPos - 1,
              height: 2,
              backgroundColor: peak > 0.9 ? '#ef4444' : peak > 0.7 ? '#eab308' : '#22c55e',
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="flex gap-0.5 justify-center">
      {renderBar(lLevel, peakL, 'left')}
      {stereo && renderBar(rLevel, peakR, 'right')}
    </div>
  );
});
