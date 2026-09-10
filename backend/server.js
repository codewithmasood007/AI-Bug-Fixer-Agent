import fsExtra from "fs";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { WebSocketServer } from "ws";
import { runScan } from "./agent.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    service: "AI Bug Fixer Backend",
  });
});

app.post("/api/diff", (req, res) => {
  const { file_path } = req.body;

  if (!file_path || !fs.existsSync(file_path)) {
    return res.json({
      file: file_path ? path.basename(file_path) : "",
      original: "",
      modified: "",
    });
  }

  const modified = fs.readFileSync(file_path, "utf-8");
  const backupPath = file_path + ".bak";
  let original = modified;

  if (fs.existsSync(backupPath)) {
    original = fs.readFileSync(backupPath, "utf-8");
  }

  res.json({
    file: path.basename(file_path),
    original,
    modified,
  });
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

function resetDemoFolder() {
  const sourceDir = path.join(process.cwd(), "bugTest-source");
  const demoDir = path.join(process.cwd(), "bugTest");

  if (fs.existsSync(demoDir)) {
    fs.rmSync(demoDir, { recursive: true, force: true });
  }

  fs.cpSync(sourceDir, demoDir, { recursive: true });
}

const wss = new WebSocketServer({
  server,
  path: "/ws/scan",
});

wss.on("connection", (ws) => {
  ws.on("message", async (message) => {
    try {
      const payload = JSON.parse(message.toString());

      const folderPath = payload.folder_path;

      if (!folderPath) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Folder path is required",
          }),
        );

        ws.close();
        return;
      }

      if (!fs.existsSync(folderPath)) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: `Directory not found: ${folderPath}`,
          }),
        );

        ws.close();
        return;
      }
      if (folderPath === "bugTest") {
        resetDemoFolder();
      }

      for await (const result of runScan(folderPath)) {
        ws.send(JSON.stringify(result));
      }

      ws.close();
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: `Unexpected error: ${error.message}`,
        }),
      );

      ws.close();
    }
  });
});
