// ============================================================================
// Member 3 - Recommendation Service (Deterministic Rule Engine)
// ============================================================================

import {
  NormalizedRecommendationInput,
  RecommendationResult,
  RecommendationOutcome,
  DeviceCategory,
} from '../types/recommendation.types';
import { ProviderAdapter, ListingAdapter, RecyclingAdapter } from '../adapters';

/**
 * Capitalizes category for user-facing titles (e.g. LAPTOP -> Laptop)
 */
function formatCategory(category: DeviceCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

/**
 * Generates user-facing headline title based on recommendation and category
 */
function generateTitle(action: RecommendationOutcome, category: DeviceCategory): string {
  const cat = formatCategory(category);
  switch (action) {
    case 'REPAIR':
      return `Repair Your ${cat}`;
    case 'SELL':
      return `Sell Your ${cat}`;
    case 'DONATE':
      return `Donate Your ${cat}`;
    case 'REUSE':
      return `Repurpose & Reuse Your ${cat}`;
    case 'RECYCLE':
      return `Safely Recycle Your ${cat}`;
  }
}

/**
 * Returns circular call-to-action button label matching docs/member3-recommendation-discovery.md §5.1 #4
 */
function generateNextActionLabel(action: RecommendationOutcome): string {
  switch (action) {
    case 'REPAIR':
      return 'Find Repair Providers';
    case 'SELL':
      return 'List for Sale';
    case 'DONATE':
      return 'Browse Donation Programs';
    case 'REUSE':
      return 'Explore Reuse Guides';
    case 'RECYCLE':
      return 'Find E-Waste Drop-Offs';
  }
}

/**
 * PLACEHOLDER: Environmental impact calculation.
 *
 * DEPENDENCY: Member 6 (Communication, Reviews, Eco Impact & Integration).
 * The official CO2e and Eco Points formulas and carbon savings coefficients are owned
 * and defined by Member 6 per project specification §1.2 & §10.1.
 *
 * Standard indicative baseline values are provided below as a placeholder until
 * Member 6 integrates the official coefficient calculator.
 */
function getPlaceholderEcoImpact(
  category: DeviceCategory,
  action: RecommendationOutcome
): { estimatedCo2SavingsKg: number | null; estimatedEcoPoints: number | null } {
  // Baseline CO2 displacement benchmarks per device type (kg CO2e)
  const categoryCo2Weights: Record<DeviceCategory, number> = {
    LAPTOP: 120.0,
    DESKTOP: 150.0,
    PHONE: 60.0,
    TABLET: 75.0,
    MONITOR: 80.0,
    PRINTER: 65.0,
    OTHER: 40.0,
  };

  const actionMultiplier: Record<RecommendationOutcome, number> = {
    REPAIR: 1.0,
    REUSE: 0.9,
    SELL: 0.8,
    DONATE: 0.85,
    RECYCLE: 0.5,
  };

  const baseCo2 = categoryCo2Weights[category] || 50.0;
  const multiplier = actionMultiplier[action] || 0.7;

  const estimatedCo2SavingsKg = Math.round(baseCo2 * multiplier * 10) / 10;
  const estimatedEcoPoints = Math.round(estimatedCo2SavingsKg * 1.25);

  return {
    estimatedCo2SavingsKg,
    estimatedEcoPoints,
  };
}

export class RecommendationService {
  /**
   * Evaluates questionnaire inputs using deterministic circular-economy rules.
   * Completely explainable, rule-based logic without AI/ML black boxes.
   * Matches downstream service providers, marketplace listings, or e-waste drop-offs.
   */
  async evaluate(input: NormalizedRecommendationInput): Promise<RecommendationResult> {
    const { category, condition, age, intention, urgency, userCoordinates } = input;

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

    // ------------------------------------------------------------------------
    // Handoff Matching (Section 11.1)
    // ------------------------------------------------------------------------
    const needsProviders = recommendation === 'REPAIR' || alternativeAction === 'REPAIR';
    const needsListings =
      ['SELL', 'DONATE', 'REUSE'].includes(recommendation) ||
      (alternativeAction !== null && ['SELL', 'DONATE', 'REUSE'].includes(alternativeAction));
    const needsRecycling = recommendation === 'RECYCLE' || alternativeAction === 'RECYCLE';

    const providerPromise = needsProviders
      ? ProviderAdapter.queryProviders({
          category,
          latitude: userCoordinates?.latitude,
          longitude: userCoordinates?.longitude,
          limit: 3,
        })
      : Promise.resolve([]);

    let listingActionParam: 'ALL' | 'SELL' | 'DONATE' | 'REUSE' = 'ALL';
    if (recommendation === 'SELL' || alternativeAction === 'SELL') listingActionParam = 'SELL';
    else if (recommendation === 'DONATE' || alternativeAction === 'DONATE') listingActionParam = 'DONATE';
    else if (recommendation === 'REUSE' || alternativeAction === 'REUSE') listingActionParam = 'REUSE';

    const listingPromise = needsListings
      ? ListingAdapter.queryListings({
          category,
          actionType: listingActionParam,
          latitude: userCoordinates?.latitude,
          longitude: userCoordinates?.longitude,
          limit: 3,
        })
      : Promise.resolve([]);

    const recyclingPromise = needsRecycling
      ? RecyclingAdapter.queryRecyclingRequests({
          search: category,
          latitude: userCoordinates?.latitude,
          longitude: userCoordinates?.longitude,
          limit: 3,
        })
      : Promise.resolve([]);

    const [matchedProvidersSettled, matchedListingsSettled, matchedRecycleSettled] =
      await Promise.allSettled([providerPromise, listingPromise, recyclingPromise]);

    const matchedProviders =
      matchedProvidersSettled.status === 'fulfilled' ? matchedProvidersSettled.value : [];
    const matchedListings =
      matchedListingsSettled.status === 'fulfilled' ? matchedListingsSettled.value : [];
    const matchedRecyclePoints =
      matchedRecycleSettled.status === 'fulfilled' ? matchedRecycleSettled.value : [];

    // Unique evaluation identifier
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const evaluationId = `rec_${category.toLowerCase()}_${Date.now()}_${randomSuffix}`;

    const title = generateTitle(recommendation, category);
    const nextActionLabel = generateNextActionLabel(recommendation);
    const { estimatedCo2SavingsKg, estimatedEcoPoints } = getPlaceholderEcoImpact(
      category,
      recommendation
    );

    return {
      evaluationId,
      primaryAction: recommendation,
      secondaryAction: alternativeAction,
      recommendation,
      alternativeAction,
      ruleTriggered,
      title,
      rationale,
      estimatedCo2SavingsKg,
      estimatedEcoPoints,
      nextActionLabel,
      matchedProviders,
      matchedListings,
      matchedRecyclePoints,
      timestamp: new Date().toISOString(),
      details: {
        category,
        condition,
        age,
        intention,
        urgency,
        ...(userCoordinates ? { userCoordinates } : {}),
      },
    };
  }
}

export const recommendationService = new RecommendationService();
