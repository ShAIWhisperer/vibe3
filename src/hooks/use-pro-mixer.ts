import { useRef, useCallback, useState, useEffect } from 'react';
import { ProMixerEngine } from '@/audio/pro-mixer-engine';
import {
  type ProMixerState,
  type ProMixerChannelId,
  type AuxEffectId,
  type ChannelStripState,
  ALL_CHANNEL_IDS,
  createDefaultProMixerState,
  MIXER_PRESETS,
} from '@/audio/pro-mixer-types';

export function useProMixer() {
  const engineRef = useRef<ProMixerEngine | null>(null);
  const [proMixerState, setProMixerState] = useState<ProMixerState>(createDefaultProMixerState);
  const stateRef = useRef(proMixerState);
  const levelsTimerRef = useRef<number | null>(null);
  const [levels, setLevels] = useState<{
    channels: Record<ProMixerChannelId, number>;
    master: { left: number; right: number };
  }>(() => {
    const channels = {} as Record<ProMixerChannelId, number>;
    for (const id of ALL_CHANNEL_IDS) channels[id] = 0;
    return { channels, master: { left: 0, right: 0 } };
  });

  useEffect(() => { stateRef.current = proMixerState; }, [proMixerState]);

  /** Initialize the Pro Mixer engine with an AudioContext */
  const initMixer = useCallback((ctx: AudioContext) => {
    if (engineRef.current) return;

    const engine = new ProMixerEngine(ctx);
    engineRef.current = engine;

    // Connect output to destination
    engine.getOutput().connect(ctx.destination);

    // Apply initial state
    const state = stateRef.current;
    for (const id of ALL_CHANNEL_IDS) {
      engine.applyChannelState(id, state.channels[id]);
    }
    engine.applyAuxReturnState(state.auxReturns);
    engine.applyMasterState(state.master);

    // Start level metering at ~30fps
    startLevelMetering();
  }, []);

  /** Start metering loop */
  const startLevelMetering = useCallback(() => {
    if (levelsTimerRef.current) return;

    let lastUpdate = 0;
    const update = (time: number) => {
      const engine = engineRef.current;
      if (!engine) {
        levelsTimerRef.current = null;
        return;
      }

      // Throttle to ~30fps
      if (time - lastUpdate >= 33) {
        lastUpdate = time;
        const channels = {} as Record<ProMixerChannelId, number>;
        for (const id of ALL_CHANNEL_IDS) {
          channels[id] = engine.getChannelLevel(id);
        }
        const master = engine.getMasterLevels();
        setLevels({ channels, master });
      }

      levelsTimerRef.current = requestAnimationFrame(update);
    };
    levelsTimerRef.current = requestAnimationFrame(update);
  }, []);

  /** Set a parameter on a channel by path */
  const setChannelParam = useCallback((
    channelId: ProMixerChannelId,
    path: string,
    value: number | boolean
  ) => {
    setProMixerState(prev => {
      const next = { ...prev };
      const ch = JSON.parse(JSON.stringify(prev.channels[channelId])) as ChannelStripState;

      // Parse dot-separated path: e.g. 'eq.low.gain', 'compressor.threshold', 'volume', 'auxSends.delay'
      const parts = path.split('.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let target: any = ch;
      for (let i = 0; i < parts.length - 1; i++) {
        target = target[parts[i]];
      }
      target[parts[parts.length - 1]] = value;

      next.channels = { ...prev.channels, [channelId]: ch };

      // Apply to audio engine
      engineRef.current?.applyChannelState(channelId, ch);

      // Handle solo logic
      if (path === 'solo' || path === 'mute') {
        engineRef.current?.applySoloState(next.channels as Record<ProMixerChannelId, ChannelStripState>);
      }

      return next;
    });
  }, []);

  /** Set an AUX effect parameter */
  const setAuxParam = useCallback((
    effectId: AuxEffectId,
    path: string,
    value: number | boolean | string
  ) => {
    setProMixerState(prev => {
      const next = { ...prev };
      const auxReturns = JSON.parse(JSON.stringify(prev.auxReturns));

      const parts = path.split('.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let target: any = auxReturns[effectId];
      for (let i = 0; i < parts.length - 1; i++) {
        target = target[parts[i]];
      }
      target[parts[parts.length - 1]] = value;

      next.auxReturns = auxReturns;

      // Apply to audio engine
      engineRef.current?.applyAuxReturnState(auxReturns);

      return next;
    });
  }, []);

  /** Set a master bus parameter */
  const setMasterParam = useCallback((
    path: string,
    value: number | boolean
  ) => {
    setProMixerState(prev => {
      const next = { ...prev };
      const master = JSON.parse(JSON.stringify(prev.master));

      const parts = path.split('.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let target: any = master;
      for (let i = 0; i < parts.length - 1; i++) {
        target = target[parts[i]];
      }
      target[parts[parts.length - 1]] = value;

      next.master = master;

      engineRef.current?.applyMasterState(master);

      return next;
    });
  }, []);

  /** Get the engine for direct connection */
  const getEngine = useCallback(() => engineRef.current, []);

  /** Save state (already serializable) */
  const saveState = useCallback((): ProMixerState => {
    return JSON.parse(JSON.stringify(stateRef.current));
  }, []);

  /** Load state */
  const loadState = useCallback((state: ProMixerState) => {
    setProMixerState(state);

    const engine = engineRef.current;
    if (engine) {
      for (const id of ALL_CHANNEL_IDS) {
        engine.applyChannelState(id, state.channels[id]);
      }
      engine.applyAuxReturnState(state.auxReturns);
      engine.applyMasterState(state.master);
      engine.applySoloState(state.channels as Record<ProMixerChannelId, ChannelStripState>);
    }
  }, []);

  /** Reset to defaults */
  const resetToDefaults = useCallback(() => {
    const defaultState = createDefaultProMixerState();
    loadState(defaultState);
  }, [loadState]);

  /** Apply a preset */
  const applyPreset = useCallback((presetId: string) => {
    const preset = MIXER_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    if (preset.id === 'init') {
      resetToDefaults();
      return;
    }

    setProMixerState(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as ProMixerState;
      if (preset.state.master) next.master = { ...next.master, ...preset.state.master };
      if (preset.state.auxReturns) next.auxReturns = { ...next.auxReturns, ...preset.state.auxReturns };

      const engine = engineRef.current;
      if (engine) {
        engine.applyMasterState(next.master);
        engine.applyAuxReturnState(next.auxReturns);
      }

      return next;
    });
  }, [resetToDefaults]);

  /** Dispose engine */
  const dispose = useCallback(() => {
    if (levelsTimerRef.current) {
      cancelAnimationFrame(levelsTimerRef.current);
      levelsTimerRef.current = null;
    }
    engineRef.current?.dispose();
    engineRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (levelsTimerRef.current) {
        cancelAnimationFrame(levelsTimerRef.current);
      }
      engineRef.current?.dispose();
    };
  }, []);

  return {
    proMixerState,
    levels,
    initMixer,
    getEngine,
    setChannelParam,
    setAuxParam,
    setMasterParam,
    saveState,
    loadState,
    resetToDefaults,
    applyPreset,
    dispose,
  };
}
