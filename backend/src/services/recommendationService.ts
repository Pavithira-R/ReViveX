// ============================================================================
// Member 3 - Recommendation Service (Deterministic Rule Engine)
// ============================================================================

import {
  NormalizedRecommendationInput,
  RecommendationResult,
  RecommendationOutcome,
} from '../types/recommendation.types';

export class RecommendationService {
  /**
   * Evaluates normalized questionnaire inputs using deterministic circular-economy rules.
   * Completely explainable, rule-based logic without AI/ML black boxes.
   */
  evaluate(input: NormalizedRecommendationInput): RecommendationResult {
    const { category, condition, age, intention, urgency } = input;

    let recommendation: RecommendationOutcome;
    let alternativeAction: RecommendationOutcome | null = null;
    let ruleTriggered: string;
    let rationale: string[];

    // Rule 1: Safety & End-of-Life Override (Priority 1)
    // Non-working or physically damaged hardware older than 5 years -> RECYCLE
    if (
      (condition === 'PHYSICALLY_DAMAGED' || condition === 'NOT_WORKING') &&
      age === 'MORE_THAN_5_YEARS'
    ) {
      recommendation = 'RECYCLE';
      alternativeAction = null;
      ruleTriggered = 'R-REC-01';
      rationale = [
        `This ${category.toLowerCase()} is over 5 years old and non-functional or physically damaged.`,
        'Repair is economically unviable and replacement parts are largely obsolete.',
        'Certified e-waste recycling ensures toxic components are safely neutralized and precious raw materials are recovered.',
      ];
    }

    // Rule 2: Explicit Responsible Disposal (Priority 2)
    // User explicitly asks to dispose responsibly -> RECYCLE
    else if (intention === 'DISPOSE_RESPONSIBLY') {
      recommendation = 'RECYCLE';
      alternativeAction = condition === 'WORKING_NORMALLY' ? 'DONATE' : null;
      ruleTriggered = 'R-REC-02';
      rationale = [
        'User explicitly designated responsible environmental disposal as the desired goal.',
        'Directs device to verified e-waste collection bins and licensed recycling facilities.',
        ...(condition === 'WORKING_NORMALLY'
          ? ['Since the device is still operational, donating to a school or charity is an alternative option.']
          : []),
      ];
    }

    // Rule 3: High-Utility Repair (Priority 3)
    // Operational problems or non-working on modern devices (<5 yrs) wanting repair or keep -> REPAIR
    else if (
      (condition === 'WORKING_WITH_PROBLEMS' || condition === 'NOT_WORKING') &&
      (age === 'LESS_THAN_1_YEAR' || age === 'ONE_TO_THREE_YEARS' || age === 'THREE_TO_FIVE_YEARS') &&
      (intention === 'REPAIR' || intention === 'KEEP_USE')
    ) {
      recommendation = 'REPAIR';
      alternativeAction = 'SELL';
      ruleTriggered = 'R-REP-01';
      rationale = [
        `The ${category.toLowerCase()} is under 5 years old and retains significant residual utility.`,
        'Fixing operational problems avoids the substantial carbon and resource cost of manufacturing a new device.',
        'Professional repair is estimated to cost significantly less than purchasing an equivalent replacement.',
      ];
    }

    // Rule 4: Physical Damage on Recent Devices (Priority 4)
    // Physically damaged modern devices (<3 yrs) wanting repair or keep -> REPAIR
    else if (
      condition === 'PHYSICALLY_DAMAGED' &&
      (age === 'LESS_THAN_1_YEAR' || age === 'ONE_TO_THREE_YEARS') &&
      (intention === 'REPAIR' || intention === 'KEEP_USE')
    ) {
      recommendation = 'REPAIR';
      alternativeAction = 'SELL';
      ruleTriggered = 'R-REP-02';
      rationale = [
        `Modern ${category.toLowerCase()} (under 3 years old) with physical damage retains high core hardware value.`,
        'Replacing modular components (e.g. screen, battery, or casing) restores full functionality.',
        'Restoring this device protects your financial investment and prolongs device lifespan.',
      ];
    }

    // Rule 5: Working Device Resale (Priority 5)
    // Working normally, under 5 years old, wanting to sell -> SELL
    else if (
      condition === 'WORKING_NORMALLY' &&
      (age === 'LESS_THAN_1_YEAR' || age === 'ONE_TO_THREE_YEARS' || age === 'THREE_TO_FIVE_YEARS') &&
      intention === 'SELL'
    ) {
      recommendation = 'SELL';
      alternativeAction = 'DONATE';
      ruleTriggered = 'R-SEL-01';
      rationale = [
        'Device is in normal working order and commands high demand on the second-hand electronics market.',
        'Selling provides monetary return to the owner while providing an affordable option to secondary buyers.',
        'Extending product life through resale displaces demand for newly manufactured devices.',
      ];
    }

    // Rule 6: Community Donation (Priority 6)
    // Working normally, wanting to give away -> DONATE
    else if (condition === 'WORKING_NORMALLY' && intention === 'GIVE_AWAY') {
      recommendation = 'DONATE';
      alternativeAction = 'REUSE';
      ruleTriggered = 'R-DON-01';
      rationale = [
        'Working electronics can immediately empower students, schools, or non-profit organizations.',
        'Donation supports digital inclusion within the local community.',
        'Prevents functional hardware from idling in storage or entering the waste stream.',
      ];
    }

    // Rule 7: Older Functional Repurposing (Priority 7)
    // Working normally, older device (3-5+ yrs), wanting to keep/use -> REUSE
    else if (
      condition === 'WORKING_NORMALLY' &&
      (age === 'THREE_TO_FIVE_YEARS' || age === 'MORE_THAN_5_YEARS') &&
      intention === 'KEEP_USE'
    ) {
      recommendation = 'REUSE';
      alternativeAction = 'DONATE';
      ruleTriggered = 'R-REU-01';
      rationale = [
        'The device is older but still operates normally.',
        'Repurposing for secondary utility (e.g. digital photo frame, media server, secondary display) extends its useful life.',
        'Maximizes product efficiency at zero additional monetary cost.',
      ];
    }

    // Rule 8: Recent Device Continued Primary Use (Priority 8)
    // Working normally, modern (<3 yrs), wanting to keep/use -> REUSE
    else if (
      condition === 'WORKING_NORMALLY' &&
      (age === 'LESS_THAN_1_YEAR' || age === 'ONE_TO_THREE_YEARS') &&
      intention === 'KEEP_USE'
    ) {
      recommendation = 'REUSE';
      alternativeAction = 'SELL';
      ruleTriggered = 'R-REU-02';
      rationale = [
        'Device is relatively new and functions without issues.',
        'Continuing primary usage is the most sustainable and economical decision.',
      ];
    }

    // Rule 9: Modern Device with Problems Sold for Parts (Priority 9)
    // Working with problems, modern (<3 yrs), wanting to sell -> SELL
    else if (
      condition === 'WORKING_WITH_PROBLEMS' &&
      (age === 'LESS_THAN_1_YEAR' || age === 'ONE_TO_THREE_YEARS') &&
      intention === 'SELL'
    ) {
      recommendation = 'SELL';
      alternativeAction = 'REPAIR';
      ruleTriggered = 'R-SEL-02';
      rationale = [
        'Modern hardware with minor issues is in high demand by refurbishers, technicians, and hobbyists.',
        'Selling as-is allows you to recover cash without investing in upfront repair expenses.',
      ];
    }

    // Rule 10: Explicit Repair Request for Problematic Device (Priority 10)
    // Working with problems, wanting repair -> REPAIR
    else if (condition === 'WORKING_WITH_PROBLEMS' && intention === 'REPAIR') {
      recommendation = 'REPAIR';
      alternativeAction = 'RECYCLE';
      ruleTriggered = 'R-REP-03';
      rationale = [
        'User explicitly seeks technical repair for operational issues.',
        'Professional diagnosis will determine if modular component replacement solves the issue.',
      ];
    }

    // Rule 11: Deterministic Fallback Coverage
    else {
      ruleTriggered = 'R-FALLBACK';
      if (condition === 'NOT_WORKING' || condition === 'PHYSICALLY_DAMAGED') {
        recommendation = 'RECYCLE';
        alternativeAction = 'REPAIR';
        rationale = [
          'Hardware is damaged or non-functional and outside standard repair criteria.',
          'Recycling ensures safe disposal and environmental protection.',
        ];
      } else if (condition === 'WORKING_WITH_PROBLEMS') {
        recommendation = 'REPAIR';
        alternativeAction = 'SELL';
        rationale = [
          'Device exhibits operational defects; professional repair is recommended to restore full utility.',
        ];
      } else {
        recommendation = 'SELL';
        alternativeAction = 'DONATE';
        rationale = [
          'Device operates normally and is suitable for secondary trade or charitable donation.',
        ];
      }
    }

    return {
      recommendation,
      rationale,
      alternativeAction,
      ruleTriggered,
      details: {
        category,
        condition,
        age,
        intention,
        urgency,
      },
    };
  }
}

export const recommendationService = new RecommendationService();
