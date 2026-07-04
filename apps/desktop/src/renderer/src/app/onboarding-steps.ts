export interface OnboardingStep {
  icon: string;
  titleKey: string;
  bodyKey: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { icon: "L", titleKey: "onboarding.step0Title", bodyKey: "onboarding.step0Body" },
  { icon: "↑", titleKey: "onboarding.step1Title", bodyKey: "onboarding.step1Body" },
  { icon: "✎", titleKey: "onboarding.step2Title", bodyKey: "onboarding.step2Body" },
  { icon: "⚙", titleKey: "onboarding.step3Title", bodyKey: "onboarding.step3Body" },
  { icon: "✓", titleKey: "onboarding.step4Title", bodyKey: "onboarding.step4Body" },
];
