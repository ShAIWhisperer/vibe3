import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Step } from '@/hooks/use-tb303-engine';

export interface CommunityPattern {
  id: string;
  user_id: string;
  name: string;
  style: string | null;
  tags: string[];
  tempo: number;
  steps: Step[];
  module_type: string;
  likes: number;
  created_at: string;
  profiles?: { display_name: string | null; avatar_url: string | null };
}

type SortBy = 'newest' | 'popular';

export function useCommunityPatterns() {
  const [loading, setLoading] = useState(false);

  const listPatterns = useCallback(async (
    options: { page?: number; limit?: number; sort?: SortBy; tag?: string } = {}
  ): Promise<{ patterns: CommunityPattern[]; hasMore: boolean }> => {
    if (!supabase) return { patterns: [], hasMore: false };

    const { page = 0, limit = 20, sort = 'newest', tag } = options;
    setLoading(true);

    try {
      let query = supabase
        .from('community_patterns')
        .select('*, profiles(display_name, avatar_url)');

      if (tag) {
        query = query.contains('tags', [tag]);
      }

      if (sort === 'popular') {
        query = query.order('likes', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      query = query.range(page * limit, (page + 1) * limit - 1);

      const { data, error } = await query;
      if (error) throw error;

      return {
        patterns: (data ?? []) as CommunityPattern[],
        hasMore: (data?.length ?? 0) === limit,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const publishPattern = useCallback(async (
    userId: string,
    pattern: {
      name: string;
      style: string;
      tags: string[];
      tempo: number;
      steps: Step[];
      module_type?: string;
    }
  ): Promise<CommunityPattern | null> => {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('community_patterns')
      .insert({
        user_id: userId,
        name: pattern.name,
        style: pattern.style,
        tags: pattern.tags,
        tempo: pattern.tempo,
        steps: pattern.steps,
        module_type: pattern.module_type || 'bass',
      })
      .select('*, profiles(display_name, avatar_url)')
      .single();

    if (error) return null;
    return data as CommunityPattern;
  }, []);

  const deletePattern = useCallback(async (id: string, userId: string): Promise<boolean> => {
    if (!supabase) return false;
    const { error } = await supabase
      .from('community_patterns')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    return !error;
  }, []);

  const likePattern = useCallback(async (patternId: string, userId: string): Promise<boolean> => {
    if (!supabase) return false;
    const { error } = await supabase
      .from('pattern_likes')
      .insert({ user_id: userId, pattern_id: patternId });
    return !error;
  }, []);

  const unlikePattern = useCallback(async (patternId: string, userId: string): Promise<boolean> => {
    if (!supabase) return false;
    const { error } = await supabase
      .from('pattern_likes')
      .delete()
      .eq('user_id', userId)
      .eq('pattern_id', patternId);
    return !error;
  }, []);

  const getUserLikes = useCallback(async (userId: string): Promise<Set<string>> => {
    if (!supabase) return new Set();
    const { data } = await supabase
      .from('pattern_likes')
      .select('pattern_id')
      .eq('user_id', userId);
    return new Set((data ?? []).map((d) => d.pattern_id));
  }, []);

  return {
    loading,
    listPatterns,
    publishPattern,
    deletePattern,
    likePattern,
    unlikePattern,
    getUserLikes,
  };
}
