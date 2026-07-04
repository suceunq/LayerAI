import { useState } from "react";
import { useAppStore } from "../state/useAppStore.js";
import { Button } from "../components/ui/Button.js";
import { ONBOARDING_STEPS } from "./onboarding-steps.js";
import { useTranslation } from "../i18n/useTranslation.js";

export function OnboardingTour(): React.JSX.Element | null {
  const onboardingActive = useAppStore((s) => s.onboardingActive);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);

  if (!onboardingActive) return null;

  const step = ONBOARDING_STEPS[stepIndex]!;
  const isLast = stepIndex === ONBOARDING_STEPS.length - 1;

  const finish = (): void => {
    setStepIndex(0);
    void completeOnboarding();
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
      <div className="flex w-[440px] flex-col items-center gap-5 rounded-2xl border border-border-subtle bg-surface-1 p-8 text-center shadow-2xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-prusa-orange text-2xl font-bold text-surface-0">
          {step.icon}
        </div>
        <h2 className="text-xl font-semibold text-text-primary">{t(step.titleKey)}</h2>
        <p className="text-sm leading-relaxed text-text-secondary">{t(step.bodyKey)}</p>

        <div className="flex gap-1.5">
          {ONBOARDING_STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 w-6 rounded-full ${i === stepIndex ? "bg-prusa-orange" : "bg-surface-3"}`} />
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
