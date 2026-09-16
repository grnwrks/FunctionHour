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
  ].filter((rule): rule is { label: string; value: string } => Boolean(rule.value));

  if (rules.length === 0) return null;

  return (
    <section className="oc-card relative overflow-hidden p-6 sm:p-8">
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-violet-300/70">
              Venue Information
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
              Venue Rules
            </h2>
          </div>

          {isVerified && <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/70 backdrop-blur md:block">
            Function Hour Verified Venue
          </div>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {rules.map((rule) => (
            <div
              key={rule.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition duration-300 hover:border-violet-400/30 hover:bg-white/[0.05]"
            >
              <p className="text-xs uppercase tracking-widest text-white/40">
                {rule.label}
              </p>

              <p className="mt-2 text-sm leading-relaxed text-white/90">
                {rule.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
