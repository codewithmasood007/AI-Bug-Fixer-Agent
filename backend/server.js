
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { WebSocketServer } from "ws";
import { runScan } from "./agent.js";

dotenv.config();

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());


app.get("/health", (req, res) => {
    res.json({
        status: "online",
        service: "AI Bug Fixer Backend"
    });
});


app.post("/api/diff", (req, res) => {

    const { file_path, folder_path } = req.body;
    const filePath = path.join(folder_path, file_path);
    
    if (!fs.existsSync(filePath)) {
        return res.json({
            file: path.basename(filePath),
            original: "",
            modified: ""
        });
    }

    const modified = fs.readFileSync(filePath, "utf-8");

    const backupPath = filePath + ".bak";

    let original = modified;

    if (fs.existsSync(backupPath)) {
        original = fs.readFileSync(backupPath, "utf-8");
    }

    res.json({
        file: path.basename(filePath),
        original: original,
        modified: modified
    });
});


const server = app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});


const wss = new WebSocketServer({
    server,
    path: "/ws/scan"
});


wss.on("connection", (ws) => {

    ws.on("message", async (message) => {

        try {

            const payload = JSON.parse(message.toString());

            const folderPath = payload.folder_path;

            if (!folderPath) {
                ws.send(JSON.stringify({
                    type: "error",
                    message: "Folder path is required"
                }));

                ws.close();
                return;
            }

            if (!fs.existsSync(folderPath)) {
                ws.send(JSON.stringify({
                    type: "error",
                    message: `Directory not found: ${folderPath}`
                }));

                ws.close();
                return;
            }

            for await (const result of runScan(folderPath)) {

                ws.send(JSON.stringify(result));

            }

            ws.close();

        } catch (error) {

            ws.send(JSON.stringify({
                type: "error",
                message: `Unexpected error: ${error.message}`
            }));

            ws.close();
        }
    });

});