import fs from "fs";
import path from "path";
import Groq from "groq-sdk";


const SUPPORTED_EXTENSIONS = [
    ".py",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".html",
    ".css",
    ".json"
];


const IGNORED_DIRS = [
    ".git",
    "node_modules",
    "__pycache__",
    "venv",
    ".venv",
    "dist",
    "build"
];


const MAX_FILE_CHARS = 12000;

const MODEL_NAME = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `
You are a meticulous senior software engineer performing an automated code review.

You will be shown the full contents of a single source file.

Look for real, concrete bugs:

- syntax errors
- logic errors
- null/undefined reference issues
- off-by-one errors
- obvious security issues
- clearly broken behavior

Do not invent stylistic nitpicks as bugs.

Respond with STRICT JSON only.

Use exactly this schema:

{
    "has_bug": boolean,
    "bug_description": string,
    "fixed_code": string
}

Rules:

- If there is no real bug, set has_bug to false.
- bug_description should be an empty string if there is no bug.
- fixed_code should contain the original file content if there is no bug.
- If there is a bug, set has_bug to true.
- Give a concise one-sentence bug_description.
- Include the approximate line number if you can.
- Return the FULL corrected file in fixed_code.
- Never return only the changed lines.
- Never wrap fixed_code in markdown code fences.
- Preserve the original formatting and style outside of the fix.
`;


function createClient() {

   const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

    return groq;
}


function getCodeFiles(root) {

    const files = [];

    function scanDirectory(directory) {

        const items = fs.readdirSync(directory);

        for (const item of items) {

            const fullPath = path.join(directory, item);

            if (IGNORED_DIRS.includes(item)) {
                continue;
            }

            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                scanDirectory(fullPath);
                continue;
            }

            const extension = path.extname(item).toLowerCase();

            if (SUPPORTED_EXTENSIONS.includes(extension)) {
                files.push(fullPath);
            }
        }
    }

    scanDirectory(root);

    return files.sort();
}


async function analyzeFile(client, content) {

    const truncated = content.slice(0, MAX_FILE_CHARS);

    const response = await client.chat.completions.create({

        model: MODEL_NAME,

        temperature: 0,

        response_format: {
            type: "json_object"
        },

        messages: [
            {
                role: "system",
                content: SYSTEM_PROMPT
            },

            {
                role: "user",
                content: `Analyze this file:\n\n\`\`\`\n${truncated}\n\`\`\``
            }
        ]
    });


    const raw =
        response.choices[0].message.content || "{}";


    let result;

    try {

        result = JSON.parse(raw);

    } catch (error) {

        result = {
            has_bug: false,
            bug_description: "",
            fixed_code: content
        };
    }


    result.has_bug =
        result.has_bug || false;

    result.bug_description =
        result.bug_description || "";

    result.fixed_code =
        result.fixed_code || content;


    return result;
}


export async function* runScan(folderPath) {

    const root = path.resolve(folderPath);


    if (
        !fs.existsSync(root) ||
        !fs.statSync(root).isDirectory()
    ) {

        yield {
            type: "error",
            message: `Directory not found: ${folderPath}`
        };

        return;
    }


    const client = createClient();


    let filesInspected = 0;
    let bugsFixed = 0;


    let files;

    try {

        files = getCodeFiles(root);

    } catch (error) {

        yield {
            type: "error",
            message: `Failed to walk directory: ${error.message}`
        };

        return;
    }


    if (files.length === 0) {

        yield {
            type: "log",
            message:
                "No supported code files found in this directory."
        };


        yield {
            type: "complete",
            message:
                "Scan completed. Inspected 0 files, fixed 0 issues."
        };

        return;
    }


    for (const filePath of files) {

        const relPath =
            path.relative(root, filePath);


        yield {
            type: "log",
            message: `Scanning: ${relPath}`
        };


        let originalContent;


        try {

            originalContent =
                fs.readFileSync(
                    filePath,
                    "utf-8"
                );

        } catch (error) {

            yield {
                type: "error",
                message:
                    `Could not read ${relPath}: ${error.message}`
            };

            continue;
        }


        filesInspected++;


        if (!originalContent.trim()) {
            continue;
        }


        let result;


        try {

            result = await analyzeFile(
                client,
                originalContent
            );

        } catch (error) {

            yield {
                type: "error",
                message:
                    `LLM analysis failed for ${relPath}: ${error.message}`
            };

            continue;
        }


        if (!result.has_bug) {
            continue;
        }


        const description =
            result.bug_description ||
            "Bug detected.";


        const fixedCode =
            result.fixed_code ||
            originalContent;


        yield {
            type: "bug_found",
            file: relPath,
            description: description
        };


        if (fixedCode === originalContent) {
            continue;
        }


        const backupPath =
            filePath + ".bak";


        try {

            fs.writeFileSync(
                backupPath,
                originalContent,
                "utf-8"
            );


            fs.writeFileSync(
                filePath,
                fixedCode,
                "utf-8"
            );

        } catch (error) {

            yield {
                type: "error",
                message:
                    `Failed to patch ${relPath}: ${error.message}`
            };

            continue;
        }


        bugsFixed++;


        yield {
            type: "patch_applied",
            file: relPath,
            message:
                `Applied patch (Backup created: ${path.basename(backupPath)})`
        };
    }


    yield {
        type: "complete",
        message:
            `Scan completed. Inspected ${filesInspected} files, fixed ${bugsFixed} issues.`
    };
}

