const fs = require("fs");

const enLines = fs.readFileSync("en/claude-code.md", "utf-8").split("\n").filter(Boolean);

const zhLines = fs.readFileSync("zh/claude-code.md", "utf-8").split("\n").filter(Boolean);

const zhDict = {};
zhLines.forEach((line) => {
	const match = line.match(/- \*\*(.+?)\*\* (.+)/);
	if (match) zhDict[match[1].trim()] = match[2].trim();
});

let output = "| English | 中文 |\n|---------|----------|\n";
enLines.forEach((line) => {
	const match = line.match(/- \*\*(.+?)\*\*/);
	if (match) {
		const word = match[1].trim();
		const translation = zhDict[word] || "";
		output += `| ${word} | ${translation} |\n`;
	}
});

fs.writeFileSync("all.md", output);
console.log("all.md generated successfully!");
