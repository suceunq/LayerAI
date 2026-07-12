import { useState } from "react";
import { useAppStore } from "../state/useAppStore.js";
import { Button } from "../components/ui/Button.js";
import { ONBOARDING_STEPS } from "./onboarding-steps.js";
import { useTranslation } from "../i18n/useTranslation.js";
import { useModalAccessibility } from "../hooks/useModalAccessibility.js";

export function OnboardingTour(): React.JSX.Element | null {
  const onboardingActive = useAppStore((s) => s.onboardingActive);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);

  const finish = (): void => {
    setStepIndex(0);
    void completeOnboarding();
  };
  const dialogRef = useModalAccessibility(onboardingActive, finish);

  if (!onboardingActive) return null;

  const step = ONBOARDING_STEPS[stepIndex]!;
  const isLast = stepIndex === ONBOARDING_STEPS.length - 1;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="onboarding-title" tabIndex={-1} className="flex w-[440px] flex-col items-center gap-5 rounded-2xl border border-border-subtle bg-surface-1 p-8 text-center shadow-2xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-surface-0">
          {step.icon}
        </div>
        <h2 id="onboarding-title" className="text-xl font-semibold text-text-primary">{t(step.titleKey)}</h2>
        <p className="text-sm leading-relaxed text-text-secondary">{t(step.bodyKey)}</p>

        <div className="flex gap-1.5">
          {ONBOARDING_STEPS.map((_, i) => (
            <div key={i} aria-current={i === stepIndex ? "step" : undefined} aria-label={t("accessibility.stepProgress", { current: i + 1, total: ONBOARDING_STEPS.length })} className={`h-1.5 w-6 rounded-full ${i === stepIndex ? "bg-accent" : "bg-surface-3"}`} />
          ))}
        </div>

        <div className="mt-2 flex w-full items-center justify-between">
          <button onClick={finish} className="text-xs text-text-muted hover:text-text-primary">
            {t("onboarding.skip")}
          </button>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <Button variant="secondary" onClick={() => setStepIndex((i) => i - 1)}>
                {t("onboarding.previous")}
              </Button>
            )}
            {isLast ? (
              <Button onClick={finish}>{t("onboarding.start")}</Button>
            ) : (
              <Button onClick={() => setStepIndex((i) => i + 1)}>{t("onboarding.next")}</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
