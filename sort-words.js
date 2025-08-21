const fs = require("fs");

const EN_PATH = "notes/en/claude-code.md";
const ZH_PATH = "notes/zh/claude-code.md";

function normalizeEllipsis(s) {
	return s
		.replace(/\.\.\./g, "…")
		.replace(/\s+/g, " ")
		.trim();
}

function parseEnglish(content) {
	const keys = new Set();
	const re = /^(?:\s*-\s+\*\*(.*?)\*\*|\s{0,4}(?!-)([A-Za-z].*?(?:…|\.\.\.))|\s*-\s+([A-Za-z].*?(?:…|\.\.\.)))\s*$/gm;
	let m;
	while ((m = re.exec(content)) !== null) {
		const raw = m[1] || m[2] || m[3];
		if (!raw) continue;
		const en = normalizeEllipsis(raw);
		if (en) keys.add(en);
	}
	return keys;
}

function parseZh(content) {
	const dict = {};
	const re = /^\s*-\s+\*\*(.*?)\*\*(.*)$/gm;
	let m;
	while ((m = re.exec(content)) !== null) {
		const en = normalizeEllipsis(m[1]);
		const zh = (m[2] || "").trim();
		if (!dict[en]) dict[en] = [];
		if (zh) dict[en].push(zh);
	}
	return dict;
}

function formatEn(keys) {
	return keys.map((en) => `-   **${en}**`).join("\n");
}

function formatZh(keys, zhDict, missing) {
	return keys
		.map((en) => {
			let arr = (zhDict[en] || []).map((s) => s.trim()).filter(Boolean);
			arr = [...new Set(arr)];
			if (arr.length === 0) {
				missing.push(en);
				return `-   **${en}**`;
			}
			const zh = arr.join(" / ");
			return `-   **${en}** ${zh}`;
		})
		.join("\n");
}

const enRaw = fs.readFileSync(EN_PATH, "utf-8");
const zhRaw = fs.existsSync(ZH_PATH) ? fs.readFileSync(ZH_PATH, "utf-8") : "";

const enKeys = parseEnglish(enRaw);
const zhDict = parseZh(zhRaw);

const keys = Array.from(enKeys).sort((a, b) => a.localeCompare(b, "en", {sensitivity: "base"}));

fs.writeFileSync(EN_PATH, formatEn(keys), "utf-8");

const missing = [];
fs.writeFileSync(ZH_PATH, formatZh(keys, zhDict, missing), "utf-8");

console.log(`Done. Wrote ${EN_PATH} & ${ZH_PATH}`);
if (missing.length) {
	console.log("Missing translations for the following keys:");
	missing.forEach((k) => console.log(" -", k));
}
