const fs = require("fs");
const path = require("path");

const EN_PATH = "notes/en/claude-code.md";
const LANGS = ["zh"];
const LANG_FOLDER = "notes";

function normalizeEllipsis(s) {
	return s
		.replace(/\.\.\./g, "…")
		.replace(/\s+/g, " ")
		.trim();
}

function parseEnglish(content) {
	const re = /^(?:\s*-\s+\*\*(.*?)\*\*)/gm;
	const keysRaw = [];
	let m;
	while ((m = re.exec(content)) !== null) {
		if (m[1]) keysRaw.push(normalizeEllipsis(m[1]));
	}
	return keysRaw;
}

function parseLang(lang, content) {
	const dict = {};
	const re = /^\s*-\s+\*\*(.*?)\*\*(.*)$/gm;
	let m;
	while ((m = re.exec(content)) !== null) {
		const en = normalizeEllipsis(m[1]);
		const text = (m[2] || "").trim();
		if (!dict[en]) dict[en] = [];
		if (text) dict[en].push(text);
	}
	return dict;
}

// Main
try {
	//Read
	const enRaw = fs.readFileSync(EN_PATH, "utf-8");
	const enKeysRaw = parseEnglish(enRaw);

	// filter en
	const seenEn = new Set();
	const uniqueEnKeys = [];
	const removedEnKeys = [];
	for (const key of enKeysRaw) {
		if (seenEn.has(key)) removedEnKeys.push(key);
		else {
			seenEn.add(key);
			uniqueEnKeys.push(key);
		}
	}

	// read langs
	const allLangDict = {};
	for (const lang of LANGS) {
		const langPath = path.join(LANG_FOLDER, lang, "claude-code.md");
		const raw = fs.existsSync(langPath) ? fs.readFileSync(langPath, "utf-8") : "";
		allLangDict[lang] = parseLang(lang, raw);
	}

	// check en and langs
	let hasError = false;
	if (removedEnKeys.length > 0) {
		hasError = true;
		console.warn("⚠️ Duplicate English keys removed:");
		removedEnKeys.forEach((k) => console.warn(" -", k));
	}

	for (const lang of LANGS) {
		const dict = allLangDict[lang];

		// missing translations
		const missing = uniqueEnKeys.filter((k) => !dict[k] || dict[k].length === 0);
		if (missing.length > 0) {
			hasError = true;
			console.warn(`⇨ Missing translations in ${lang}:`);
			missing.forEach((k) => console.warn(" -", k));
		}

		//more key
		const extra = Object.keys(dict).filter((k) => !uniqueEnKeys.includes(k));
		if (extra.length > 0) {
			hasError = true;
			console.warn(`Extra keys in ${lang}:`);
			extra.forEach((k) => console.warn(" -", k));
		}

		// duplicate translations
		const langToEn = {};
		for (const [en, arr] of Object.entries(dict)) {
			arr.forEach((val) => {
				if (!langToEn[val]) langToEn[val] = [];
				langToEn[val].push(en);
			});
		}
		const dupTrans = Object.entries(langToEn).filter(([_, ens]) => ens.length > 1);
		if (dupTrans.length > 0) {
			console.warn(`⇨ Duplicate translations in ${lang}:`);
			dupTrans.forEach(([val, ens]) => console.warn(` - "${val}" -> ${ens.join(", ")}`));
		}

		//has error not write file
		if (hasError) {
			console.error("\n Errors detected. Please fix them before writing files.");
			process.exit(1);
		}

		//sort and write en back
		const sortedEnKeys = uniqueEnKeys.sort((a, b) => a.localeCompare(b, "en", {sensitivity: "base"}));

		fs.writeFileSync(EN_PATH, sortedEnKeys.map((k) => `-   **${k}**`).join("\n"), "utf-8");

		//sort and write langs back
		for (const lang of LANGS) {
			const dict = allLangDict[lang];
			const langPath = path.join(LANG_FOLDER, lang, "claude-code.md");

			const content = sortedEnKeys
				.map((k) => {
					const arr = (dict[k] || []).map((s) => s.trim()).filter(Boolean);
					return arr.length > 0 ? `-   **${k}** ${arr.join(" / ")}` : `-   **${k}**`;
				})
				.join("\n");

			fs.writeFileSync(langPath, content, "utf-8");
		}
		console.log(`All files are checked, sorted, and written successfully.`);
	}
} catch (error) {
	console.error("❌ Script failed with error:", error);
	process.exit(1);
}
