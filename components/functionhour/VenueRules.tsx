type VenueRulesProps = {
  age?: string;
  dressCode?: string;
  parking?: string;
  entryPolicy?: string;
  refundPolicy?: string;
  reEntry?: string;
  isVerified?: boolean;
};

export default function VenueRules({
  age,
  dressCode,
  parking,
  entryPolicy,
  refundPolicy,
  reEntry,
  isVerified = false,
}: VenueRulesProps) {
  const rules = [
    { label: "Age Requirement", value: age },
    { label: "Dress Code", value: dressCode },
    { label: "Parking", value: parking },
    { label: "Entry Policy", value: entryPolicy },
    { label: "Refunds", value: refundPolicy },
    { label: "Re-entry", value: reEntry },
  ].filter((rule): rule is { label: string; value: string } =>
    Boolean(rule.value),
  );

  if (rules.length === 0) return null;

  return (
    <details className="border-t border-white/10 pt-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-white">
        <span>What to know before you go</span>
        <span className="text-xs font-semibold text-white/40">
          {isVerified ? "Verified venue · View" : "View details"}
        </span>
      </summary>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {rules.map((rule) => (
          <div key={rule.label} className="rounded-xl bg-black/30 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
              {rule.label}
            </p>

            <p className="mt-1.5 text-sm leading-6 text-white/75">
              {rule.value}
            </p>
          </div>
        ))}
      </div>
    </details>
  );
}
