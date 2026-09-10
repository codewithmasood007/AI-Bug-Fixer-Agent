import { useEffect, useRef, useState } from "react";
import {
  Bug,
  Play,
  Loader2,
  CircleDot,
  FolderCode,
  FileCode2,
  CheckCheck,
} from "lucide-react";

import Terminal from "./components/Terminal";
import Stats from "./components/Stats";
import DiffModal from "./components/DiffModal";

const API_BASE = "https://ai-bug-fixer-agent.onrender.com";
const WS_URL = "wss://ai-bug-fixer-agent.onrender.com/ws/scan";

export default function App() {
  const [folderPath, setFolderPath] = useState("");
  const [connected, setConnected] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [logs, setLogs] = useState([]);
  const [patchedFiles, setPatchedFiles] = useState([]);

  const [stats, setStats] = useState({
    filesScanned: 0,
    bugsFound: 0,
    patchesApplied: 0,
  });

  const [diffData, setDiffData] = useState(null);
  const [showDiff, setShowDiff] = useState(false);

  const wsRef = useRef(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_BASE}/health`);

        if (response.ok) {
          setConnected(true);
        } else {
          setConnected(false);
        }
      } catch {
        setConnected(false);
      }
    };

    checkHealth();

    const interval = setInterval(checkHealth, 8000);

    return () => clearInterval(interval);
  }, []);

  const addLog = (entry) => {
    setLogs((prev) => [...prev, entry]);
  };

  const updateStats = (type) => {
    setStats((prev) => {
      if (type === "file_scanned") {
        return {
          ...prev,
          filesScanned: prev.filesScanned + 1,
        };
      }

      if (type === "bug_found") {
        return {
          ...prev,
          bugsFound: prev.bugsFound + 1,
        };
      }

      if (type === "patch_applied") {
        return {
          ...prev,
          patchesApplied: prev.patchesApplied + 1,
        };
      }

      return prev;
    });
  };

  const handleScan = () => {
    if (!folderPath.trim() || scanning) {
      return;
    }

    setLogs([]);
    setPatchedFiles([]);

    setStats({
      filesScanned: 0,
      bugsFound: 0,
      patchesApplied: 0,
    });

    setScanning(true);

    const ws = new WebSocket(WS_URL);

    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);

      ws.send(
        JSON.stringify({
          folder_path: folderPath.trim(),
        })
      );

      addLog({
        type: "log",
        message: `Starting scan: ${folderPath.trim()}`,
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        addLog(data);

        if (data.type === "file_scanned") {
          updateStats("file_scanned");
        }

        if (data.type === "bug_found") {
          updateStats("bug_found");
        }

        if (data.type === "patch_applied") {
          updateStats("patch_applied");

          if (data.file) {
            setPatchedFiles((prev) => {
              if (prev.includes(data.file)) {
                return prev;
              }

              return [...prev, data.file];
            });
          }
        }

        if (data.type === "complete") {
          setScanning(false);
          ws.close();
        }

        if (data.type === "error") {
          setScanning(false);
          ws.close();
        }
      } catch {
        addLog({
          type: "error",
          message: "Received invalid response from server.",
        });
      }
    };

    ws.onerror = () => {
      setScanning(false);

      addLog({
        type: "error",
        message: "WebSocket connection failed.",
      });
    };

    ws.onclose = () => {
      setScanning(false);
    };
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleOpenDiff = async (file) => {
    try {
      const response = await fetch(`${API_BASE}/api/diff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_path: file,
          folder_path: folderPath.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load diff");
      }

      setDiffData(data);
      setShowDiff(true);
    } catch (error) {
      addLog({
        type: "error",
        message: error.message,
      });
    }
  };

  const handleCloseDiff = () => {
    setShowDiff(false);
    setDiffData(null);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#222222]">
      {/* Header */}
      <header className="border-b border-[#e5e5e5] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
              <Bug
                className="h-5 w-5 text-indigo-600"
                strokeWidth={1.8}
              />
            </div>

            <div>
              <h1 className="text-lg font-semibold text-[#222222]">
                AI Code Debugger
              </h1>

              <p className="text-xs text-[#666666]">
                Scan your project, find bugs, and apply fixes.
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs ${
              connected
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            <CircleDot className="h-3.5 w-3.5" />

            {connected ? "Connected" : "Disconnected"}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {/* Project Path */}
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <FolderCode
              className="h-4 w-4 text-indigo-600"
              strokeWidth={1.75}
            />

            <span className="text-sm font-medium text-[#222222]">
              Project Path
            </span>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 items-center rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] px-3">
              <input
                type="text"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleScan();
                  }
                }}
                placeholder="Enter project folder path..."
                className="w-full bg-transparent py-2.5 text-sm text-[#222222] outline-none placeholder:text-[#888888]"
              />
            </div>

            <button
              onClick={handleScan}
              disabled={!folderPath.trim() || scanning}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scanning
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Agent
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats */}
        <Stats stats={stats} />

        {/* Terminal + Fixed Files */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Terminal */}
          <div className="min-h-[350px]">
            <Terminal
              logs={logs}
              onClear={handleClearLogs}
            />
          </div>

          {/* Fixed Files */}
          <div className="overflow-hidden rounded-xl border border-[#e5e5e5] bg-white">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] bg-[#fafafa] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <CheckCheck
                  className="h-4 w-4 text-emerald-600"
                  strokeWidth={1.75}
                />

                <span className="text-sm font-medium text-[#222222]">
                  Fixed Files
                </span>
              </div>

              <span className="text-xs text-[#777777]">
                {patchedFiles.length} fixed
              </span>
            </div>

            <div className="max-h-[350px] overflow-y-auto">
              {patchedFiles.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-[#777777]">
                  No files fixed yet.
                </p>
              ) : (
                patchedFiles.map((file, index) => (
                  <button
                    key={index}
                    onClick={() => handleOpenDiff(file)}
                    className="flex w-full items-center gap-3 border-b border-[#eeeeee] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[#f5f5f5]"
                  >
                    <FileCode2
                      className="h-4 w-4 shrink-0 text-emerald-600"
                      strokeWidth={1.75}
                    />

                    <span className="truncate text-sm text-[#333333]">
                      {file}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Diff Modal */}
      <DiffModal
  open={showDiff}
  onClose={handleCloseDiff}
  loading={!diffData}
  diff={diffData}
/>
    </div>
  );
}