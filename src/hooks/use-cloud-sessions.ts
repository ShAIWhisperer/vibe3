import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { MultiModuleSessionData } from '@/hooks/use-multi-synth-engine';
import type { DrumState } from '@/hooks/use-drum-engine';

export interface CloudSession {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  data: MultiModuleSessionData;
  drum_data: DrumState | null;
  is_public: boolean;
  play_count: number;
  created_at: string;
  updated_at: string;
  profiles?: { display_name: string | null; avatar_url: string | null };
}

function generateSlug(): string {
  const adjectives = ['acid', 'deep', 'dark', 'squelchy', 'cosmic', 'neon', 'hyper', 'analog', 'dreamy', 'raw'];
  const nouns = ['line', 'groove', 'pulse', 'wave', 'bass', 'synth', 'loop', 'riff', 'jam', 'vibe'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const id = Math.random().toString(36).slice(2, 6);
  return `${adj}-${noun}-${id}`;
}

export function useCloudSessions() {
  const [loading, setLoading] = useState(false);

  const saveToCloud = useCallback(async (
    name: string,
    data: MultiModuleSessionData,
    drumData: DrumState | null,
    userId: string,
    existingId?: string
  ): Promise<CloudSession | null> => {
    if (!supabase) return null;
    setLoading(true);
    try {
      if (existingId) {
        const { data: updated, error } = await supabase
          .from('sessions')
          .update({ name, data, drum_data: drumData, updated_at: new Date().toISOString() })
          .eq('id', existingId)
          .eq('user_id', userId)
          .select('*, profiles(display_name, avatar_url)')
          .single();
        if (error) throw error;
        return updated as CloudSession;
      }

      const slug = generateSlug();
      const { data: created, error } = await supabase
        .from('sessions')
        .insert({ user_id: userId, name, slug, data, drum_data: drumData })
        .select('*, profiles(display_name, avatar_url)')
        .single();
      if (error) throw error;
      return created as CloudSession;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFromCloud = useCallback(async (id: string): Promise<CloudSession | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('sessions')
      .select('*, profiles(display_name, avatar_url)')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as CloudSession;
  }, []);

  const loadBySlug = useCallback(async (slug: string): Promise<CloudSession | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('sessions')
      .select('*, profiles(display_name, avatar_url)')
      .eq('slug', slug)
      .eq('is_public', true)
      .single();
    if (error) return null;
    return data as CloudSession;
  }, []);

  const listSessions = useCallback(async (userId: string): Promise<CloudSession[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('sessions')
      .select('*, profiles(display_name, avatar_url)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) return [];
    return (data ?? []) as CloudSession[];
  }, []);

  const deleteFromCloud = useCallback(async (id: string, userId: string): Promise<boolean> => {
    if (!supabase) return false;
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    return !error;
  }, []);

  const togglePublic = useCallback(async (id: string, userId: string, isPublic: boolean): Promise<boolean> => {
    if (!supabase) return false;
    const { error } = await supabase
      .from('sessions')
      .update({ is_public: isPublic, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);
    return !error;
  }, []);

  const incrementPlayCount = useCallback(async (id: string): Promise<void> => {
    if (!supabase) return;
    // Simple increment - not perfectly atomic but good enough for play counts
    const { data } = await supabase
      .from('sessions')
      .select('play_count')
      .eq('id', id)
      .single();
    if (data) {
      await supabase
        .from('sessions')
        .update({ play_count: (data.play_count ?? 0) + 1 })
        .eq('id', id);
    }
  }, []);

  return {
    loading,
    saveToCloud,
    loadFromCloud,
    loadBySlug,
    listSessions,
    deleteFromCloud,
    togglePublic,
    incrementPlayCount,
  };
}
