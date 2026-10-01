// ============================================================================
// Member 3 - Recommendation Controller
// ============================================================================

import { Request, Response } from 'express';
import { recommendationService } from '../services/recommendationService';
import { validateRecommendationInput } from '../validators/recommendationValidator';

export class RecommendationController {
  /**
   * POST /api/recommendations/evaluate
   * Evaluates user questionnaire inputs and returns the recommended circular-economy action.
   */
  async evaluate(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateRecommendationInput(req.body);

      if (!validation.isValid || !validation.normalized) {
        res.status(400).json({
          success: false,
          statusCode: 400,
          error: 'Validation failed',
          details: validation.errors,
        });
        return;
      }

      const result = recommendationService.evaluate(validation.normalized);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: {
          recommendation: result.recommendation,
          rationale: result.rationale,
          alternativeAction: result.alternativeAction,
          ruleTriggered: result.ruleTriggered,
          details: result.details,
        },
        message: 'Recommendation generated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: error.message || 'Internal server error while evaluating recommendation',
      });
    }
  }
}

export const recommendationController = new RecommendationController();
