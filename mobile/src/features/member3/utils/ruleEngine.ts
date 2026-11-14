// ============================================================================
// Member 3 - Deterministic Rule Engine (Client-side offline evaluator)
// Mirror of backend recommendationService.ts (Section 4.2 Matrix)
// ============================================================================

import {
  RecommendationInput,
  RecommendationResult,
  RecommendationAction,
  DeviceCategory,
} from '../types';
import { MOCK_PROVIDERS, MOCK_LISTINGS, MOCK_RECYCLE_POINTS } from './mockData';

const BASE_CO2_COEFFICIENT_KG: Record<DeviceCategory, number> = {
  LAPTOP: 140,
  DESKTOP: 220,
  PHONE: 55,
  TABLET: 80,
  MONITOR: 90,
  PRINTER: 60,
  OTHER: 35,
};

const ACTION_SAVINGS_MULTIPLIER: Record<RecommendationAction, number> = {
  REPAIR: 0.85,
  REUSE: 1.0,
  SELL: 0.9,
  DONATE: 0.95,
  RECYCLE: 0.45,
};

const ACTION_ECO_POINTS: Record<RecommendationAction, number> = {
  REPAIR: 180,
  REUSE: 150,
  SELL: 120,
  DONATE: 200,
  RECYCLE: 90,
};

const NEXT_ACTION_LABELS: Record<RecommendationAction, string> = {
  REPAIR: 'Find Repair Providers',
  REUSE: 'Explore Reuse Guides',
  SELL: 'List for Sale',
  DONATE: 'Browse Donation Programs',
  RECYCLE: 'Find E-Waste Drop-Offs',
};

export function evaluateLocalRecommendation(input: RecommendationInput): RecommendationResult {
  const { category, condition, ageGroup, userIntention } = input;

  let ruleTriggered = 'R-FALLBACK';
  let primaryAction: RecommendationAction = 'REPAIR';
  let secondaryAction: RecommendationAction | null = 'DONATE';
  let title = 'Recommended Next Step';
  let rationale: string[] = [];

  // Rule 1: Safety / End of life override (Damaged or non-functional + >5 years)
  if (
    (condition === 'PHYSICALLY_DAMAGED' || condition === 'NOT_WORKING') &&
    ageGroup === 'MORE_THAN_5_YEARS'
  ) {
    ruleTriggered = 'R-REC-01';
    primaryAction = 'RECYCLE';
    secondaryAction = null;
    title = `Safely Recycle Your ${category.toLowerCase()}`;
    rationale = [
      'Device is over 5 years old with major defects; restoration is not economically viable.',
      'Certified e-waste recycling safely recovers precious metals and prevents hazardous landfill contamination.',
      'Guarantees verified zero-landfill disposal with official eco certification.',
    ];
  }
  // Rule 2: Explicit disposal intention
  else if (userIntention === 'DISPOSE_RESPONSIBLY') {
    ruleTriggered = 'R-REC-02';
    primaryAction = 'RECYCLE';
    secondaryAction = condition === 'WORKING_NORMALLY' ? 'DONATE' : null;
    title = `Certified E-Waste Recycling for Your ${category.toLowerCase()}`;
    rationale = [
      'You requested responsible environmental retirement for your hardware.',
      'Drop-off at verified collection kiosks ensures circular recovery of battery and circuit board elements.',
      condition === 'WORKING_NORMALLY'
        ? 'Since the device still powers on normally, donation to a community school is also an option.'
        : 'Keeps harmful electronic elements out of municipal soil and waterways.',
    ];
  }
  // Rule 3: Malfunctioning recent hardware (<5 years) + repair/keep intent
  else if (
    (condition === 'WORKING_WITH_PROBLEMS' || condition === 'NOT_WORKING') &&
    ageGroup !== 'MORE_THAN_5_YEARS' &&
    (userIntention === 'REPAIR' || userIntention === 'KEEP_USE')
  ) {
    ruleTriggered = 'R-REP-01';
    primaryAction = 'REPAIR';
    secondaryAction = 'SELL';
    title = `Professional Repair Recommended for Your ${category.toLowerCase()}`;
    rationale = [
      'Your device is relatively recent and retains significant practical and residual utility.',
      'Targeted component repair is far more cost-effective than purchasing a new replacement.',
      'Extending the lifespan of this device prevents premature electronics manufacturing waste.',
    ];
  }
  // Rule 4: Physically damaged recent hardware (<3 years) + repair/keep intent
  else if (
    condition === 'PHYSICALLY_DAMAGED' &&
    (ageGroup === 'LESS_THAN_1_YEAR' || ageGroup === 'ONE_TO_THREE_YEARS') &&
    (userIntention === 'REPAIR' || userIntention === 'KEEP_USE')
  ) {
    ruleTriggered = 'R-REP-02';
    primaryAction = 'REPAIR';
    secondaryAction = 'SELL';
    title = `Restore Hardware Functionality on Your ${category.toLowerCase()}`;
    rationale = [
      'Modern devices with physical damage (screens, hinges, casings) are prime candidates for modular replacement.',
      'Certified technicians can replace damaged modules while preserving your onboard data.',
      'Significant economic saving compared to device write-off.',
    ];
  }
  // Rule 5: Working device + sell intent
  else if (
    condition === 'WORKING_NORMALLY' &&
    ageGroup !== 'MORE_THAN_5_YEARS' &&
    userIntention === 'SELL'
  ) {
    ruleTriggered = 'R-SEL-01';
    primaryAction = 'SELL';
    secondaryAction = 'DONATE';
    title = `List Your ${category.toLowerCase()} on the Second-Hand Marketplace`;
    rationale = [
      'Your hardware is in prime working order and enjoys strong market demand.',
      'Listing on ReViveX connects you directly with verified buyers in your proximity.',
      'Generates direct financial return while promoting circular device reuse.',
    ];
  }
  // Rule 6: Working device + give away intent
  else if (condition === 'WORKING_NORMALLY' && userIntention === 'GIVE_AWAY') {
    ruleTriggered = 'R-DON-01';
    primaryAction = 'DONATE';
    secondaryAction = 'REUSE';
    title = `Donate Your Functional ${category.toLowerCase()} to Someone in Need`;
    rationale = [
      'Your working hardware can bridge the digital divide for students or non-profit educational programs.',
      'Donations receive verified platform recognition and maximize social impact.',
      'Enables high educational utility for a recipient without financial means.',
    ];
  }
  // Rule 7: Working older device (3+ years) + keep/use intent
  else if (
    condition === 'WORKING_NORMALLY' &&
    (ageGroup === 'THREE_TO_FIVE_YEARS' || ageGroup === 'MORE_THAN_5_YEARS') &&
    userIntention === 'KEEP_USE'
  ) {
    ruleTriggered = 'R-REU-01';
    primaryAction = 'REUSE';
    secondaryAction = 'DONATE';
    title = `Repurpose & Extend Life of Your ${category.toLowerCase()}`;
    rationale = [
      'Device functions reliably and is ideal for secondary household tasks (media server, secondary monitor, home dashboard).',
      'Extending usage beyond the initial lifecycle avoids replacement manufacturing carbon.',
      'Zero new expense required to maintain functional digital utility.',
    ];
  }
  // Rule 8: Working newer device (<3 years) + keep/use intent
  else if (
    condition === 'WORKING_NORMALLY' &&
    (ageGroup === 'LESS_THAN_1_YEAR' || ageGroup === 'ONE_TO_THREE_YEARS') &&
    userIntention === 'KEEP_USE'
  ) {
    ruleTriggered = 'R-REU-02';
    primaryAction = 'REUSE';
    secondaryAction = 'SELL';
    title = `Continue Enjoying Your Healthy ${category.toLowerCase()}`;
    rationale = [
      'Your device is in healthy operational shape with high battery capacity and performance.',
      'Maintaining existing hardware delivers the highest eco-efficiency possible.',
      'Routine maintenance and storage hygiene will keep it in peak condition for years to come.',
    ];
  }
  // Rule 9: Minor problems on recent device + sell intent
  else if (
    condition === 'WORKING_WITH_PROBLEMS' &&
    (ageGroup === 'LESS_THAN_1_YEAR' || ageGroup === 'ONE_TO_THREE_YEARS') &&
    userIntention === 'SELL'
  ) {
    ruleTriggered = 'R-SEL-02';
    primaryAction = 'SELL';
    secondaryAction = 'REPAIR';
    title = `Sell As-Is to Hobbyists or Refurbishers`;
    rationale = [
      'Modern devices with minor defects command good residual value for repair hobbyists and refurbishers.',
      'Transparent disclosure of defects allows an honest, fast sale.',
      'Buyer takes on repair, ensuring device remains active in the circular ecosystem.',
    ];
  }
  // Rule 10: Problems + repair intent
  else if (condition === 'WORKING_WITH_PROBLEMS' && userIntention === 'REPAIR') {
    ruleTriggered = 'R-REP-03';
    primaryAction = 'REPAIR';
    secondaryAction = 'RECYCLE';
    title = `Repair & Service Operational Faults`;
    rationale = [
      'You indicated a desire to service operational faults and restore performance.',
      'Nearby certified technicians can diagnose motherboard, power, or cooling issues.',
      'Professional servicing safely extends operational life.',
    ];
  }
  // Rule 11: Fallback
  else {
    ruleTriggered = 'R-FALLBACK';
    if (condition === 'WORKING_NORMALLY') {
      primaryAction = 'SELL';
      secondaryAction = 'DONATE';
      title = `List or Donate Your Functional ${category.toLowerCase()}`;
      rationale = [
        'Device is functional and suitable for marketplace re-homing or community gifting.',
        'Extends hardware utility across active community members.',
      ];
    } else {
      primaryAction = 'REPAIR';
      secondaryAction = 'RECYCLE';
      title = `Service or Safely Recycle Your ${category.toLowerCase()}`;
      rationale = [
        'Device has operational issues; diagnostics will confirm if repair is economical.',
        'If servicing is too costly, authorized e-waste points ensure green material recovery.',
      ];
    }
  }

  // Calculate environmental metrics
  const baseCo2 = BASE_CO2_COEFFICIENT_KG[category] || 75;
  const multiplier = ACTION_SAVINGS_MULTIPLIER[primaryAction] || 0.8;
  const estimatedCo2SavingsKg = Math.round(baseCo2 * multiplier * 10) / 10;
  const estimatedEcoPoints = ACTION_ECO_POINTS[primaryAction] || 100;
  const nextActionLabel = NEXT_ACTION_LABELS[primaryAction] || 'Find Service Providers';

  // Matched entities based on action and category
  const matchedProviders =
    primaryAction === 'REPAIR'
      ? MOCK_PROVIDERS
      : [];

  const matchedListings =
    primaryAction === 'SELL' || primaryAction === 'REUSE' || primaryAction === 'DONATE'
      ? MOCK_LISTINGS.filter(
          (l) => l.category === category || l.actionType === primaryAction
        )
      : [];

  const matchedRecyclePoints =
    primaryAction === 'RECYCLE'
      ? MOCK_RECYCLE_POINTS
      : [];

  return {
    evaluationId: `rec_local_${Date.now()}`,
    primaryAction,
    secondaryAction,
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
  };
}
