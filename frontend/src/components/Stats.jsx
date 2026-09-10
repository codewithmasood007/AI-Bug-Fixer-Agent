import { FileSearch, Bug, CheckCircle2 } from "lucide-react";

const CARD_CONFIG = [
  {
    key: "filesScanned",
    label: "Files Scanned",
    icon: FileSearch,
    accent: "text-indigo-400",
    ring: "ring-indigo-500/20",
    glow: "bg-indigo-500/10",
  },
  {
    key: "bugsFound",
    label: "Bugs Found",
    icon: Bug,
    accent: "text-amber-400",
    ring: "ring-amber-500/20",
    glow: "bg-amber-500/10",
  },
  {
    key: "patchesApplied",
    label: "Patches Applied",
    icon: CheckCircle2,
    accent: "text-emerald-400",
    ring: "ring-emerald-500/20",
    glow: "bg-emerald-500/10",
  },
];

export default function Stats({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {CARD_CONFIG.map(({ key, label, icon: Icon, accent, ring, glow }) => (
        <div
          key={key}
          className="relative overflow-hidden rounded-xl border border-[#e5e5e5] bg-white p-4"
        >
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#666666]">
                {label}
              </p>
              <p
                className={`mt-1 text-2xl font-semibold tabular-nums ${accent}`}
              >
                {stats[key]}
              </p>
            </div>
            <Icon className={`h-6 w-6 ${accent}`} strokeWidth={1.75} />
          </div>
        </div>
      ))}
    </div>
  );
}
