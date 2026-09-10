import { useEffect, useRef } from "react";
import { Trash2, TerminalSquare } from "lucide-react";

const LOG_STYLES = {
  log: "text-green-600",
  bug_found: "text-amber-600",
  patch_applied: "text-cyan-600",
  error: "text-red-600",
  complete: "text-indigo-600",
};

const LOG_PREFIX = {
  log: ">",
  bug_found: "!",
  patch_applied: "✓",
  error: "✗",
  complete: "★",
};

function formatEntry(entry) {
  switch (entry.type) {
    case "bug_found":
      return `${entry.file} — ${entry.description}`;
    case "patch_applied":
      return `${entry.file} — ${entry.message}`;
    case "log":
      return entry.message;
    case "error":
      return entry.message;
    case "complete":
      return entry.message;
    default:
      return JSON.stringify(entry);
  }
}

export default function Terminal({ logs, onClear }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[#e5e5e5] bg-white">
      <div className="flex items-center justify-between border-b border-[#e5e5e5] bg-[#fafafa] px-4 py-2.5">
        <div className="flex items-center gap-2 text-[#222222]">
          <TerminalSquare
            className="h-4 w-4 text-indigo-600"
            strokeWidth={1.75}
          />

          <span className="text-sm font-medium">
            Live Scan Log
          </span>
        </div>

        <button
          onClick={onClear}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-[#666666] transition-colors hover:bg-[#f0f0f0] hover:text-[#222222]"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear Terminal
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[13px] leading-relaxed"
      >
        {logs.length === 0 && (
          <p className="text-[#777777]">
            Waiting for a scan to start. Enter a directory path above and run the agent.
          </p>
        )}

        {logs.map((entry, idx) => (
          <div
            key={idx}
            className={`flex gap-2 ${
              LOG_STYLES[entry.type] || "text-[#333333]"
            }`}
          >
            <span className="select-none opacity-60">
              {LOG_PREFIX[entry.type] || "·"}
            </span>

            <span className="whitespace-pre-wrap break-all">
              {formatEntry(entry)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}