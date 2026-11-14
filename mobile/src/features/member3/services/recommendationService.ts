// ============================================================================
// Member 3 - Recommendation API Service
// Calls POST /api/recommendations/evaluate with resilient local rule fallback
// ============================================================================

import { RecommendationInput, RecommendationResult } from '../types';
import { requestApi } from './apiClient';
import { evaluateLocalRecommendation } from '../utils/ruleEngine';

export async function evaluateRecommendation(
  input: RecommendationInput
): Promise<{ result: RecommendationResult; isOfflineFallback: boolean }> {
  try {
    const data = await requestApi<RecommendationResult>('/recommendations/evaluate', {
      method: 'POST',
      body: input,
      timeoutMs: 5000,
    });

    return {
      result: data,
      isOfflineFallback: false,
    };
  } catch (err: any) {
    console.warn(
      `[RecommendationService] Live API unavailable (${err.message}). Using local deterministic rule engine.`
    );
    const localResult = evaluateLocalRecommendation(input);
    return {
      result: localResult,
      isOfflineFallback: true,
    };
  }
}
