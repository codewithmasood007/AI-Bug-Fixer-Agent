import { DiffEditor } from "@monaco-editor/react";
import { X, FileDiff, Loader2 } from "lucide-react";

function guessLanguage(filename) {
  const ext = filename.split(".").pop();
  const map = {
    py: "python",
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    html: "html",
    css: "css",
    json: "json",
  };
  return map[ext] || "plaintext";
}

export default function DiffModal({ open, onClose, loading, diff }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0d1220] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 bg-[#111726] px-5 py-3">
          <div className="flex items-center gap-2 text-slate-200">
            <FileDiff className="h-4 w-4 text-cyan-400" strokeWidth={1.75} />
            <span className="text-sm font-medium">
              {diff?.file || "Loading diff..."}
            </span>
            <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/20">
              Patched
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative flex-1">
          {loading ? (
            <div className="flex h-full items-center justify-center gap-2 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading diff…
            </div>
          ) : (
            <DiffEditor
              height="100%"
              theme="vs-dark"
              language={guessLanguage(diff?.file || "")}
              original={diff?.original || ""}
              modified={diff?.modified || ""}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                renderSideBySide: true,
                scrollBeyondLastLine: false,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}