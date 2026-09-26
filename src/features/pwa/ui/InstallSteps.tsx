import { INSTALL_GUIDES, type ManualInstallPlatform } from "../platform";

/** Numbered install instructions for browsers without a native install dialog. */
export function InstallSteps({ platform, className }: { platform: ManualInstallPlatform; className?: string }) {
  const guide = INSTALL_GUIDES[platform];
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-oak-deep">{guide.device}</p>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5">
        {guide.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
