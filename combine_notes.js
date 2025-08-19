const fs = require("fs");
const path = require("path");

const enPath = path.join(__dirname, "notes/en/claude-code.md");
const zhPath = path.join(__dirname, "notes/zh/claude-code.md");
const allPath = path.join(__dirname, "notes/all.md");

let enLines = [];
try {
	enLines = fs
		.readFileSync(enPath, "utf-8")
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
} catch (err) {
	console.error("Error reading English file:", err);
	process.exit(1);
}

let zhLines = [];
try {
	zhLines = fs
		.readFileSync(zhPath, "utf-8")
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
} catch (err) {
	console.error("Error reading Chinese file:", err);
	process.exit(1);
}

const zhDict = {};
zhLines.forEach((line) => {
	const match = line.match(/^\s*-\s*\*\*(.+?)\*\*\s*(.*)/);
	if (match) {
		const word = match[1].trim();
		const translation = match[2].trim();
		zhDict[word] = translation;
	}
});

let output = "| English | 中文 |\n|---------|----------|\n";
enLines.forEach((line) => {
	const match = line.match(/^\s*-\s*\*\*(.+?)\*\*/);
	if (match) {
		const word = match[1].trim();
		const translation = zhDict[word] || "";
		output += `| ${word} | ${translation} |\n`;
	}
});

try {
	fs.writeFileSync(allPath, output, "utf-8");
	console.log("all.md generated successfully!");
} catch (err) {
	console.error("Error writing all.md:", err);
	process.exit(1);
}
