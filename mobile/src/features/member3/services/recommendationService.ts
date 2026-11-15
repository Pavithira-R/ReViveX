// ============================================================================
// Member 3 - Smart Recommendation Service
// Runs client-side deterministic rule engine (ruleEngine.ts) directly in the app.
// Does not depend on backend HTTP endpoint or Firebase.
// ============================================================================

import { RecommendationInput, RecommendationResult } from '../types';
import { evaluateLocalRecommendation } from '../utils/ruleEngine';

export async function evaluateRecommendation(
  input: RecommendationInput
): Promise<{ result: RecommendationResult; isOfflineFallback: boolean }> {
  // Evaluates 11 deterministic rules locally in React Native, maintaining RecommendationResult shape
  const result = evaluateLocalRecommendation(input);
  return {
    result,
    isOfflineFallback: false,
  };
}
