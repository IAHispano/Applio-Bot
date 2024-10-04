const fs = require("fs").promises;
const path = require("path");
const tagsMapping = {
	Lang: {
		ES: [
			1108324682735820862, 1110874219362914425, 1127722904612778095,
			1159339353198317628, 1175440470176960633, 1184575337691099268,
			1233521366037172384, 1287068907030708268, 1287068982716928071,
		], //1099149952652947456],
		EN: [
			1110874643155406878, 1108324567069495326, 1124525391101575308,
			1159339312018624513, 1132561689481584661, 1175433003254681681,
			1184575297228636190, 1287068828567867392,
		],
		JP: [
			1127715413640364132, 1121324803773702196, 1124525717762363422,
			1159339390657646602, 1175438110709002240,
		],
		KR: [
			1127715243569721484, 1107670309198372916, 1127715243569721484,
			1159339410022744074, 1132593674484727848, 1175440351843061801,
		],
		PT: [1124525427747197019, 1203164645024858163],
		FR: [1143830388351979580, 1143830388351979580, 1143830388351979580],
		TR: [1117039961103925248, 1128995289886363719],
		RU: [1160153969935519804, 1132594514079531089, 1175433036750393374],
		IT: [1162032086526459915, 1175433017951539200],
		PL: [1133358067233341512],
		OTHER: [
			1123794615502377090, 1127715504354762773, 1132561750957494292,
			1159339493183193141, 1175433354703810580, 1159339493183193141,
			1128995327022727238, 1185171001223426068, 1287069017911201792,
		],
	},
	Tags: {
		Artist: [
			1099150044785021019, 1175433826227466311, 1159339270880890981,
			1185170437680922644, 1287069073926131792,
		],
		Rapper: [
			1128462887225151520, 1127715456598413455, 1143666214078529776,
			1117040175365767178, 1124571901147222066, 1128995461378879510,
			1117317266984407070,
		],
		OG: [
			1122951427522834502, 1127715629026254878, 1175440861207744623,
			1159339519141756982,
		],
		Actor: [
			1125169616222691398, 1127766833043353711, 1128462916409114796,
			1122900738172014645, 1133160968642367489, 1128995503846215750,
			1122863732696039527,
		],
		Singer: [
			1128462932896907284, 1122899796311670834, 1139308993668468806,
			1124526486586671206, 1128462932896907284, 1143666232856428665,
			1128995744318242837, 1117317483104309269,
		],
		Character: [
			1142441360645951549, 1133057268729000117, 1120447717966106636,
			1120448073064263870, 1123163109427793960, 1125169954086465637,
			1127785637114806312, 1110363117415825569, 1127785637114806312,
			1132594753553301554, 1175433664235061338, 1159339295144935514,
			1128995985826263100, 1184866755336749106, 1287069114896220244,
		],
		Anime: [
			1120447963198664764, 1110364355700199464, 1127747371443425403,
			1124525657657978951, 1141755544097538119, 1132594280574222346,
			1175439124551979161, 1128995893476085810, 1185170724055420988,
			1287069202510774447,
		],
		Other: [
			1124711240594362398, 1119718145247166504, 1127786379598905404,
			1110636151510941749, 1124416867600179380, 1117999278745473104,
			1175433888588374037, 1159339469586042960, 1128996089660461096,
			1184575464442953748, 1184575427403075614, 1122092914382745662,
			1122870676190142514,
		],
		Meme: [1287069047514595459],
		Instrument: [1287069152216879186],
		"High-Quality": [1287069253630955641],
		"E-Celeb": [
			1122900392297123880, 1142876137647767664, 1128466166273282170,
			1128462863430848574, 1114434339397177374, 1124711081156296705,
			1124711081156296705, 1143830484242153653, 1128462874612858880,
			1132593583795486760, 1175433602532655166, 1159339233434148894,
			1128995836588720148,
		],
		Polity: [1128777651377668207, 1122864180572213350],
		Influencer: [1128777551674888263, 1206002847427203182, 1122863690132246558],
		Comediant: [1128996089660461096, 1128777510402936952],
		Dub: [1125169616222691398, 1122863517024931860],
		Celebrity: [1175433585747034195, 1128777493789290507, 1122863732696039527],
		"TTS / Realtime": [
			1175440917562404884, 1159339375625244722, 1287069284723589213,
			1287069337773015132,
		],
		RVC: [
			1124571792648978442, 1113386654133145674, 115933925231270707,
			1124570965729361961, 1175432936728821770, 1175432967955431495,
			1159339252312707072, 1159343639575674900, 1128777396531765450,
			1128777435270361088, 1184575233223557213, 1099149902346473566,
			1124525498974875678, 1124525542906024026, 1122876450811424788,
			1122876494365081620, 1122876517542797362,
		],
		"Kits AI": [1128370597718671401],
		"E-Girl": [1200276830318501948],
		"GPT Sovits": [1198973742722846770],
	},
};

const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const rest = new REST().setToken(process.env.BOT_TOKEN);
const fetchUser = async (id) => {
	await new Promise((resolve) => setTimeout(resolve, 200)); // Rate limit protection
	const user = await rest.get(Routes.user(id));
	return user;
};

function uuid(number) {
	const a = "0123456789abcdefghijklmnopqrstuvwxyz";
	const b = a.length;
	const c = [96, 64, 32, 0].map(
		(i) => (BigInt(number) >> BigInt(i)) & BigInt(0xffffffff),
	);
	const d = [];
	for (let seccion of c) {
		while (seccion > 0) {
			const residuo = Number(seccion % BigInt(b));
			d.unshift(a[residuo]);
			seccion = seccion / BigInt(b);
		}
	}
	const e =
		[0, 1]
			.map((i) =>
				parseInt(d.slice(i * 8, (i + 1) * 8).join(""), b)
					.toString(16)
					.padStart(i === 0 ? 8 : 4, "0"),
			)
			.join("-") + "-";
	const f = d.slice(1);
	const g = f.length;
	return e + f.join("") + (g <= 12 ? a[0].repeat(12 - g) : "");
}

function findOwner(text, item) {
	text = text.replace(/\*\*/g, "");
  
	const patterns = [
	  /(?<!\bdataset\s)made by:?\s?<@(\d+)>/i,
	  /Author:?\s?<@(\d+)>/i,
	  /trained by <@(\d+)>/i,
	  /creado por <@(\d+)>/i,
	  /created by <@(\d+)>/i,
	  /Entrenado por <@(\d+)>/i,
	  /por <@(\d+)>/,
	  /credit me <@(\d+)>/i,
	];
  
	if (/request|pretrained/i.test(text)) {
	  patterns.push(
		/(?<!\brequest\w*\s)by\s+<@(\d+)>/i,
		/(?:pretrained\s+by\s*)?(?<!pretrained\s)by\s+<@(\d+)>/i,
	  );
	} else {
	  patterns.push(/By <@(\d+)>/i);
	}
  
	for (const pattern of patterns) {
	  const match = text.match(pattern);
	  if (match) {
		return match[1];
	  }
	}
  
	return item;
}


function ReplaceT(text) {
	const multipliers = { k: 1e3, m: 1e6, bn: 1e9 };
	const pattern = /\b(\d+(\.\d+)?[kmbn]{1,2})\b/gi;
  
	return text.replace(pattern, (match) => {
	  for (const [abbr, mult] of Object.entries(multipliers)) {
		if (match.toLowerCase().includes(abbr)) {
		  const num = parseFloat(match.replace(/[^\d.]/g, ""));
		  return Math.floor(num * mult).toString();
		}
	  }
	  return match;
	});
}

function RemoveHopFromAlgorithm(cnamen) {
	cnamen = cnamen.replace(/\bmagio\b/gi, "Mangio");
	cnamen = cnamen.replace(/\bmagnio\b/gi, "Mangio");
	cnamen = cnamen.replace(/\brvmpe\b/gi, "Rmvpe");
	cnamen = cnamen.replace(/\brmpve\b/gi, "Rmvpe");
	cnamen = cnamen.replace(/\brmpve_gpu\b/gi, "Rmvpe");
	cnamen = cnamen.replace(/\brvmpe_gpu\b/gi, "Rmvpe");
	cnamen = cnamen.replace(/\brmvpe_gpu\b/gi, "Rmvpe");

	const regexPatterns = [
		/(?:^|\s)(Pm)(?=\s|$)/gi,
		/\b(Harvest|Crepe|Mangio-crepe|Mangio-Crepe|Mangio Crepe|Rmvpe_gpu|Rmvpe gpu|Rvmpe|Rmvpe)\b/gi,
		/\b(Harvest|Crepe|Mangio-crepe|Mangio-Crepe|Mangio Crepe|Rmvpe_gpu|Rmvpe gpu|Rvmpe|Rmvpe)\b/gi,
		/\b(harvest|crepe|mangio-crepe|mangio crepe|rmv?pe)\b/gi,
	];

	for (const pattern of regexPatterns) {
		const modifiedPattern = new RegExp(
			pattern.source + "\\s+(160|128|64|60|32|40|28|21|20|16)(?![a-zA-Z0-9]|$)",
			"gi",
		);

		const matches = cnamen.match(modifiedPattern);

		if (matches) {
			let algorithm = matches[0].replace(
				/^(.)(.*)$/,
				(match, firstChar, restChars) =>
					firstChar.toUpperCase() + restChars.toLowerCase(),
			);

			if (algorithm.toLowerCase() === "rmvpe_gpu") {
				cnamen = cnamen.replace(/\brmvpe_gpu\b/gi, "Rmvpe");
				return cnamen;
			} else if (algorithm.toLowerCase() === "rmpve") {
				cnamen = cnamen.replace(/\brmpve\b/gi, "Rmvpe");
				return cnamen;
			} else if (algorithm.toLowerCase() === "rvmpe") {
				cnamen = cnamen.replace(/\brvmpe\b/gi, "Rmvpe");
				return cnamen;
			}

			// Eliminar el número 64 o 32 solo a la derecha del algoritmo en cnamen
			cnamen = cnamen.replace(
				matches[0],
				algorithm.replace(/\b(?:160|128|64|60|32|40|28|21|20|16)\b/, ""),
			);
			return cnamen;
		}
	}

	return "N/A";
}
function extractAlgorithm(cnamen) {
	cnamen = cnamen.replace(/\bmagio\b/gi, "Mangio");
	cnamen = cnamen.replace(/\bmagnio\b/gi, "Mangio");
	cnamen = cnamen.replace(/\brmpve\b/gi, "Rmvpe");
	cnamen = cnamen.replace(/\brvmpe\b/gi, "Rmvpe");
	cnamen = cnamen.replace(/\brmpve_gpu\b/gi, "Rmvpe");
	cnamen = cnamen.replace(/\brvmpe_gpu\b/gi, "Rmvpe");
	cnamen = cnamen.replace(/\brmvpe_gpu\b/gi, "Rmvpe");
	const regexPatterns = [
		/\b(Harvest|Mangio-crepe|Mangio-Crepe|Mangio Crepe)\b/gi,
		/\[(Dio|Pm)\]/g,
		/\b(Rmvpe_gpu|Rmvpe gpu|Rvmpe|Rmvpe)\b/gi,
		/\b(rmv?pe)\b/gi,
		/\bCrepe\b/gi,
		/(?:\s|^)Pm(?:\s|$)/gi,
		/\[PM\]/gi,
	];

	for (const pattern of regexPatterns) {
		const matches = cnamen.match(pattern);
		if (matches) {
			const algorithm = matches[0].replace(
				/^(.)(.*)$/,
				(match, firstChar, restChars) =>
					firstChar.toUpperCase() + restChars.toLowerCase(),
			);
			if (algorithm.toLowerCase() === "rmvpe_gpu") {
				cnamen = cnamen.replace(/\brmvpe_gpu\b/gi, "Rmvpe");
				return algorithm;
			} else if (algorithm.toLowerCase() === "rmpve") {
				cnamen = cnamen.replace(/\brmpve\b/gi, "Rmvpe");
				return algorithm;
			} else if (algorithm.toLowerCase() === "rvmpe") {
				cnamen = cnamen.replace(/\brvmpe\b/gi, "Rmvpe");
				return algorithm;
			}

			cnamen = cnamen.replace(matches[0], algorithm);
			return algorithm;
		}
	}

	return "N/A";
}
function extractType(content, tags) {
	const rvcPatterns = [
      /\b(?:RVC\s*)(V[12]|Kits\.AI)\b/gi,
      /\([^)]*(RVC(?:\s*V[12])?|Kits\.AI)[^)]*\)/gi,
      /\b(RVC[12]|Kits\.AI)\b/gi,
      /\b(RVC\s*[12]|Kits\.AI)\b/gi,
      /(\bRVC(?:_)V\d+\b)/gi,
      /\b(RVC(?:\s*V\d+)?|Kits\.AI)\b/gi,
    ];
  
    const findMatchAndClean = (pattern, replaceFn = null) => {
      let mcontent = content;
      const matches = mcontent.match(pattern);
      if (matches) {
        let result = matches.join(", ").replace(/\W+/gi, " ").replace(/\s+/g, " ").trim();
        if (replaceFn) {
          result = replaceFn(result);
        }
        const newContent = mcontent.replace(pattern, result);
        return { result, newContent };
      }
      return null;
    };
  
    let result = null;
  
    for (const pattern of rvcPatterns) {
      result = findMatchAndClean(pattern, (res) => {
        console.log(res, pattern)
        return res
          .replace(/\bRVC1\b/gi, "RVC V1")
          .replace(/\bRVC2\b/gi, "RVC V2")
          .replace(/\bRVC\s*1\b/gi, "RVC V1")
          .replace(/\bRVC\s*2\b/gi, "RVC V2")
          .replace(/(RVC)(\s*)(V\d+)/gi, (match, rvc, space, v) => rvc.toUpperCase() + " " + v.toUpperCase());
      });
      if (result) {
        content = result.newContent;
        break;
      }
    }
  
    if (!result && tags) {
      for (const tag of tags) {
        if (tagsMapping.Tags.RVC.includes(tag)) {
          result = { result: "RVC V2", content };
          break;
        }
      }
    }
  
    return result || { result: "N/A", content };
}

function numberToReal(str) {
	// Find any sequence of digits, commas, or dots in the string, 
	// excluding those preceded by "V" or "N" (case-insensitive)
	const matches = str.match(/(?<![VNvn])\b([\d]+([,.]\d+)?)\b/g);
	if (!matches) {
	  return str;
	}
	return matches.reduce((updatedStr, num) => 
	  updatedStr.replace(num, num.replace(",", ".")), 
	str);
}

function eToEpochs(str) {
	const pattern1 = /(?:\b|\s)(\d+)e(?:\b|\s)|\b(\d+)e(?:\b|\s)|\be(\d+)\b/gi; //old /(\d+)e|e(\d+)\b/gi;
	const pattern2 = /\(E\s*(\d+)\)/;
  
	str = str.replace(pattern1, (_, num1, num2, num3) => 
	  ` ${num1 || num2 || num3} Epochs`
	);
  
	str = str.replace(pattern2, (_, num) => `( ${num} Epochs)`);
  
	return str;
}

function formatEpochs(str) {
	return str.replace(
	  /(\(\s*\[?\s*)([^\d\s])?\s*(\d+)\s*-\s*epochs(\s*\))/i,
	  (match, prefix, char, num, suffix) => 
		`${prefix}${char || ""} ${num} epochs${suffix}`
	);
}

function extractEpochsAndAlgorithm(name, tags, content) {
    let nameNoHop = removeHopFromAlgorithm(name);
    if (nameNoHop !== "N/A") {
        name = nameNoHop;
    }
    name = replaceT(name);
    name = numberToReal(name);
    if (!name.toLowerCase().includes("epoch")) {
        name = eToEpochs(name);
    }
    name = name.replace(/\(\?\)/gi, "");
    name = name.replace(/[^\S\r\n]*Voz:[^\S\r\n]*/gi, "");
    name = name.replace(/[^\S\r\n]*Algoritmo:[^\S\r\n]*/gi, " ");
    name = name.replace(/\bKits\.IA\b/gi, "Kits.AI");
    name = name.replace(/\bRCV\b/gi, "RVC");
    name = name.replace(/\bRV2\b/gi, "RVC v2");
    name = name.replace(/\bcreppe\b/gi, "crepe");
    name = name.replace(/\bRCrepe\b/gi, "Crepe");
    name = name.replace(/\bmanigo\b/gi, "Mangio");
    name = name.replace(/\bEphos\b/gi, "Epochs");
    name = name.replace(/\bEpchos\b/gi, "Epochs");
    name = name.replace(/\bEproch\b/gi, "Epochs");
    name = name.replace(/\bEpoches\b/gi, "Epochs");
    name = name.replace(/\bEpcohs\b/gi, "Epochs");
    name = name.replace(/\bEpjchs\b/gi, "Epochs");
    name = name.replace(/\bEpocsh\b/gi, "Epochs");
    name = name.replace(/\beprochs\b/gi, "Epochs");
    name = name.replace(/[\u00C0-\u024F\u1E00-\u1EFF]/g, (match) =>
        match.toLowerCase() === "é" ? "E" : match,
    );
    name = name.replace(/\bEpocas\b/gi, "Epochs");
    name = name.replace(/\bmagio\b/gi, "Mangio");
    name = name.replace(/\bmagnio\b/gi, "Mangio");
    name = name.replace(/\brmpve\b/gi, "Rmvpe");
    name = name.replace(/\brvmpe\b/gi, "Rmvpe");
    name = name.replace(/\brmpve_gpu\b/gi, "Rmvpe");
    name = name.replace(/\brvmpe_gpu\b/gi, "Rmvpe");
    name = name.replace(/\brmvpe_gpu\b/gi, "Rmvpe");
    name = name.replace(/\bcreepe\b/gi, "Crepe");
    name = name.replace(/\brvc-2\b/gi, "RVC2");

    let epochs = "N/A";
    let algorithm = extractAlgorithm(name);
    let dioFound = false;
    if (algorithm === "N/A") {
        let dioRegex =
            /\bDio pitch extraction\b(?!.*(?:Harvest|Mangio-crepe|Mangio-Crepe|Mangio Crepe Rmvpe_gpu|Rmvpe gpu|Rvmpe|Rmvpe))/i;
        if (dioRegex.test(name)) {
            name = name.replace(dioRegex, "");
            algorithm = "Dio";
            dioFound = true;
        } else {
            algorithm = extractAlgorithm(content);
        }
    } else if (algorithm.includes("[dio]") || algorithm.includes("[pm]")) {
        var escapedAlgorithm = algorithm.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        name = name.replace(new RegExp(`${escapedAlgorithm}`, "gi"), "");
        algorithm = algorithm
            .replace(/[\[\]]/g, "")
            .replace(/^\w/, (c) => c.toUpperCase());
        dioFound = true;
    }
    let { result: modelType, newContent: modifiedName } = extractType(
        name,
        tags,
    );

    if (modelType === "N/A") {
        ({ result: modelType, newContent: modifiedName } = extractType(
            content,
            tags,
        ));
    } else {
        name = modifiedName;
    }

    name = name.replace(
        new RegExp(`\\s*\\(${modelType}\\)|\\s*${modelType}`, "gi"),
        "",
    );
    const typePattern = /\b(RVC(?:\s*V\d+)?|Kits\.AI)\b/gi;
    name = name.replace(typePattern, "").trim();
    name = name.replace(/\b(RVC(?:\s*V\d+)?|Kits\.AI|\bV\d+\b)\b/gi, "").trim();
    name = name.replace(/RVC|Kits\.AI/g, "");
    name = name.replace(/\bKits.AI\b/gi, "");
    name = name.replace(/\bKits\b/g, "");
    name = name.replace(/\bRVC\b/g, "");
    name = name.replace(/\(\s*,\s*\//g, "(");
    name = name.replace(/\bPitch Extraction\b/i, "");

    name = name.replace(/\(\//g, "(");
    const typeKeywords = ["RVC", "Kits.AI"];
    for (const keyword of typeKeywords) {
        if (modelType.toLowerCase().includes(keyword.toLowerCase())) {
            modelType = keyword;
            break;
        }
    }

    if (algorithm !== "N/A" && !dioFound) {
        name = name.replace(new RegExp(`\\b${algorithm}\\b`, "gi"), ""); 
    }
    name = formatEpochs(name);
    if (algorithm == "N/A") {
        algorithm = "Rmvpe";
    }
    if (algorithm.toLowerCase().includes("Mangio")) {
        algorithm = "Crepe";
    }
    
    const regexPatterns = [
        /\((\d+)\s+Epochs\)/i, 
        /\b(\d+)\s+Epochs\b/i, 
        /-\s*(\d+)\s*Epochs?/i, 
        /\b(\d+)\s*Epochs\b/i, 
        /\b(\d+)\s*Epoch\b/i,  
        /(\d+) Epochs/i,       
        / (\d+) Epochs/i,      
        /\((\d+) Epochs\)/i,   
        /\(([^\)]*?(\d+)[^\)]*?)\s*Epochs\)/i, 
        /(?:\s+\[|\()(\d+)\s+Epochs\)/i, 
        /\[(\d+)\s*Epochs\]/i,
        /(\d+k)\s+Epochs/i,   
        /Epochs\s*:\s*(\d+)/i, 
        /Epoch\s*(\d+)/i,     
        /(\d+)\s*(?:k\s*)?Epochs?/i,
        /\(EPOCHS (\d+)\)/i,  
        /\(EPOCHS\s*(\d+)\s*\)/i,
        /\( EPOCH (\d+) \)/i, 
        / - (\d+)(?:\s+Epoch)?/i, 
        / - (\d+)(?:\s+Epoch)?\)/i, 
        / (\d+) Epoch/i,        
        /\((\d+) Epoch\)/i,    
        /\(([^\)]*?(\d+)[^\)]*?)\s*Epoch\)/i, 
        /(?:\s+\[|\()(\d+)\s+Epoch\)/i,
        /\[(\d+)\s*Epoch\]/i,  
        /(\d+k)\s+Epoch/i,     
        //---
        /(\d+)\s*Epoch/i,      
        /(\d+)\s+Epoch/i,      
        /(\d+)\s*Epochs/i,     
        /(\d+)\s*epochs/i,     
        /(\d+)\s+Epochs/i,     
        /\(Epoch\s*(\d+)\)/i,  
        /\bEPOCH (\d+)\b/i,    
        /\bEPOCH\s*(\d+)\s*\b/i,
        /\(EPOCH (\d+)\)/i,    
        /\(EPOCH\s*(\d+)\s*\)/i, 
        /\( EPOCH (\d+) \)/i,   
        /\bEpoch:\s*(\d+)\b/i,  
        /\bEpoch\s*(\d+)\b/i,   
        /Epochs:\s*(\d+)/i,    
        /\bEpochs\s*(\d+)\b/i,  
        /Epochs\((\d+)\)/i,    
        /Epochs\s*\((\d+)\)/i, 
        /\(\s*(\d+)\)Epoch/gi,  
        /\b(\d+)\s*(?:Epochs?|EPOCHS?)\b/i,
    ];

    for (const pattern of regexPatterns) {
        const match = name.match(pattern);
        if (match) {
            epochs = match[1];
            name = name.replace(pattern, "");
            name = name.replace(/\s*\( Epochs\)/g, "");
            name = name.replace(/(\s+-\s+\d+\s+Epochs)?$/, "").trim();
            name = name.replace(/\bEpoch\b/g, "");
            name = name.replace(/\bepoch\b/g, "");
            name = name.replace(/\bepochs\b/g, "");
            name = name.replace(/\bEpochs\b/g, "");
            name = name.replace(/\bepoches\b/g, "");
            break;
        }
    }
    for (const pattern of regexPatterns) {
        let contentCopy = content;
        if (!contentCopy.toLowerCase().includes("epoch")) {
            contentCopy = eToEpochs(content);
        }
        const match2 = contentCopy.match(pattern);
        if (match2 && epochs === "N/A") {
            epochs = match2[1];
            name = name.replace(pattern, "");
            name = name.replace(/\s*\( Epochs\)/g, "");
            name = name.replace(/(\s+-\s+\d+\s+Epochs)?$/, "").trim();
            name = name.replace(/\bEpoch\b/g, "");
            name = name.replace(/\bepoch\b/g, "");
            name = name.replace(/\bepochs\b/g, "");
            name = name.replace(/\bEpochs\b/g, "");
            name = name.replace(/\bepoches\b/g, "");
            break;
        }
    }
    name = name.replace(/\(\s*,\s*\)/g, "");
    name = name.replace(/\/+(?!\s*\S)/g, ""); 
    name = name.replace(/\/+(?=\s*\))|\/+(?=\s*\])|\/+(?!\s*\S)/g, "").trim();
    name = name.replace(/\s*\(\s*\)/g, "");
    name = name.replace(/\s*\(\s*\)|\s*\(\s*\)/g, "").trim();
    name = name
        .replace(/\s*\(\s*\)|\s*\(\s*\)|\s*\[\s*\]|\s*\[\s*\]/g, "")
        .trim();
    name = name.replace(/\s*\(\s*\)/g, "");
    if (/, ,\s*\d+\s*Steps/.test(name)) {
        let modifiedName = name.replace(/,\s*,\s*\d+\s*Steps/g, "").trim();
        name = modifiedName;
    }
    if (/\(\s*,\s*\d+\s*Steps\)/.test(name)) {
        let modifiedName = name.replace(/\(\s*,\s*\d+\s*Steps\)/g, "").trim(); 

        name = modifiedName;
    }
    name = name.replace(/\(\)/g, "").trim(); 
    name = name.replace(/\(\s*,\s*,\s*\)/g, "");
    name = name.replace(/\[\s*\|\s*\]/g, "");
    name = name.replace(/\[\s*,\s*\]/g, "");
    name = name.replace(/\{\s*\}/g, "");
    name = name.replace(/\[\s*\)/g, "");

    name = name.replace(/,+/g, ",");
    name = name.replace(/, ,/g, "");
    let regex = /\[.*\s-\s.*\]/;
    if (!regex.test(name)) {
        regex = /(?<!\S)-+(?=\s{2,}|$)/; 
        if (!regex.test(name)) {
            name = name.replace(/ -+(?!\s*\S)/, "");
            name = name.replace(/ -+$/g, "");
            name = name.replace(/\(\s*-\s*\)|\[\s*-\s*\]/g, ""); 
        } else {
            regex = / -+(?=\s*\S)/;
            if (!regex.test(name)) {
                name = name.replace(/(?<=\s)-(?=\s)/g, "");
            }
            name = name.replace(/-(?=\s*$)/, ""); 
        }
    } else {
        name = name.replace(/ -+(?!\s*\S)/, "");
        name = name.replace(/ -+$/g, "");
        name = name.replace(/\s-\s(?![\w\d])/g, "");
    }
    name = name.replace(/,\s*$/, "");
    name = name.replace(/\/+(?=\s*\))|\/+(?=\s*\])|\/+(?!\s*\S)/g, "").trim(); 
    name = name.replace(/(?<=\s{2}|^);/g, ""); 
    name = name.replace(/(?<=\s{2}|^|\{);/g, ""); 
    name = name.replace(
        /(?<!\S.|\S)\|{2,}(?=\s{2}|\)|\])|(?<=\s{2}|\(|\[\s*)\|{2,}(?!\S.|\S)/g,
        "",
    ); 
    name = name.replace(
        /(?<!\S.|\S)\|(?=\s{1,}(?:\)|\]))|(?<=\s{1,}(?:\(|\[\s*))\|(?!\S.|\S)/g,
        "",
    ); 
    name = name.replace(/(?<=\()\s*\|(?=\s*\))|(?<=\[\s*)\s*\|(?=\s*\])/g, "");
    name = name.replace(/\|\s*\|/g, "|");
    name = name.replace(/\s*\|\s*\|\s*\|/g, " |");
    name = name.replace(/(?<=\s{2}|^|\[)\s*;\s*(?=\]|\s{2}|$)/g, "");
    name = name.replace(
        /(?<=\()\s*-\s*(?=\s*\))|(?<=\[\s*)\s*-\s*(?=\s*\])/g,
        "",
    );

    name = name.replace(/[\[\(]\s*64\s*[\]\)]/, "");
    name = name.replace(/\(\s*\*\s*\)|\[\s*\*\s*\]/g, "");
    name = name.replace(/\+/g, "");
    name = name.replace(/- \./g, "-");
    name = name.replace(/- -/g, "-");
    regex = /\[.*\s-\s.*\]/;
    if (!regex.test(name)) {
        regex = /(?<!\S)-+(?=\s{2,}|$)/; 
        if (!regex.test(name)) {
            name = name.replace(/ -+(?!\s*\S)/, "");
            name = name.replace(/ -+$/g, "");
            name = name.replace(/\(\s*-\s*\)|\[\s*-\s*\]/g, ""); 
        } else {
            regex = / -+(?=\s*\S)/;
            if (!regex.test(name)) {
                name = name.replace(/(?<=\s)-(?=\s)/g, "");
            }
            name = name.replace(/-(?=\s*$)/, ""); 
        }
    } else {
        name = name.replace(/ -+(?!\s*\S)/, "");
        name = name.replace(/ -+$/g, "");
        name = name.replace(/\s-\s(?![\w\d])/g, "");
    }

    name = name.replace(/Feature Extraction/g, "");
    name = name.replace(/Original pretrain/g, "");
    name = name.replace(/\(\{\s*\}\)/g, "");
    name = name.replace(/\(\s*\.\s*\)/g, "");
    name = name.replace(/\[\s*,\s*\]/g, "");
    name = name.replace(/\(\s*\+\s*\)/g, "");
    name = name.replace(/\s+/g, " ");
    name = name.replace(/(?<=\S)\\+(?=\s|$)/g, "");
    name = name.replace(/\[\|\|\]/g, "");
    name = name.replace(/\(\s+\)/g, "");
    name = name.replace(/\[\s*\]/g, "");
    name = name.replace(/\(\s*,\s*/g, "(");
    name = name.replace(/\(\s*\)|\[\s*\]/g, "");

    name = name.replace(/\((?![^()]*\()(?![^()]*\))/, ""); 
    name = name.replace(/\|\s*$/, ""); 
    name = name.replace(/\(\/ - \)/g, ""); 
    name = name.replace(/\(\s*-\s*/g, "("); 
    name = name.replace(/\{\s*\}/g, "");
    name = name.replace(/(\|\s*-\s*|- \|\s*)/g, "| ");
    name = name.replace(/-\s*,\s*/g, "-"); 
    name = name.replace(/-\s*\.\s*/g, "-"); 
    name = name.replace(/-\s*-\s*/g, "-"); 
    name = name.replace(/-\s*-\s*-\s*/g, "-"); 
    name = name.replace(/-\s*\)/g, ")");
    name = name.replace(/\(\s*-/g, "(");
    name = name.replace(/-\s*\]/g, "]");
    name = name.replace(/【\s*,\s*】/g, "");
    name = name.replace(/\|\s*,\s*\|/g, "|");
    name = name.replace(/\(\//g, "(");
    name = name.includes("(") ? name : name.replace(/\)/g, "");
    name = name.replace(/\[\|\]/g, "");
    name = name.replace(/\| \|/g, "|");
    name = name.replace(/\( \|/g, "(");
    name = name.replace(/\{\s*,\s*\}/g, "");

    name = name.replace(/\[\; /, "[");
    name = name.replace(/\[\;/, "[");
    name = name.replace(/\( \; /, "(");
    name = name.replace(/\( \;/, "(");
    name = name.replace(/ ; \)/, ")");
    name = name.replace(/; \)/, ")");
    name = name.replace(/, \]/, "]");
    name = name.replace(/ ,\]/, "]");
    name = name.replace(/,\]/, "]");
    name = name.replace(/\[ , /, "[");
    name = name.replace(/\[, /, "[");
    name = name.replace(/\[,/, "[");
    name = name.replace(/\[ \- /, "[");
    name = name.replace(/\[ \-/, "[");
    name = name.replace(/\[- /, "[");
    name = name.replace(/\[-/, "[");
    name = name.replace(/\] \]/, "]");
    name = name.replace(/;/g, " ");
    name = name.replace(/ {3}/g, "  ");
    name = name.replace(/ {2}/g, " ");
    name = name.replace(/\|,/g, "|");
    name = name.replace(/ , \)/g, ")");
    name = name.replace(/, \)/g, ")");
    name = name.replace(/,\)/g, ")");
    name = name.replace(/\)\)/g, ")");
    name = name.replace(/\) \)/g, ")");
    name = name.replace(/ \| \)/g, ")");
    name = name.replace(/\| \)/g, ")");
    name = name.replace(/\( \/ /g, "(");
    name = name.replace(/\( \//g, "(");
    name = name.replace(/ \| \]/g, "]");
    name = name.replace(/\| \]/g, "]");
    name = name.replace(/\/\//g, "/");
    name = name.replace(/\[\/ /g, "[");
    name = name.replace(/\[\//g, "[");
    name = name.replace(/\(- /g, "(");
    name = name.replace(/\(-/g, "(");

    name = name.replace(/\(\s*\)|(?<=\()(\s*)(?=\))/g, "");
    name = name.replace(/\[ \)/g, "");
    name = name.replace(/\[\)/g, "");
    name = name.replace(/\[\]/g, "");
    name = name.replace(/\( /g, "(");
    name = name.replace(/ \)/g, ")");
    name = name.replace(/\[ /g, "[");
    name = name.replace(/ \]/g, "]");
    name = name.replace(/\) - \(/g, ") (");
    name = name.replace(/\) \| \[/g, ") [");
    name = name.replace(/\) , \(/g, ") (");

    name =
        name.match(/\|/g) && name.match(/\|/g).length <= 1
            ? name.replace(/\|/g, "")
            : name;
    name = name.replace(/\([^a-zA-Z\d\s]*,[\s]*\)/g, ""); 
    name = name.replace(/\(\.0\)/g, "");
    name = name.replace(/\(\)/g, "");
    name = name.replace(/\/\s\//g, "");
    name = name.replace(/\*\s\*/g, "");
    name = name.replace(/ {3}/g, "  ");
    name = name.replace(/ {2}/g, " ");
    name = name.replace(/\(\.\)/g, "");
    name = name.replace(/\(&\)/g, "");
    name = name.replace(/\((\d+)steps\)/i, "");
    name = name.replace(/\((\d+)\s*steps\)/i, "");
    name = name.replace(/\[(\d+)\s*Steps\]/i, "");
    name = name.replace(/\,\s*(\d+)\s*steps/i, "");
    name = name.replace(/(\d+)\s*steps\b/i, "");
    name = name.replace(/(\d+)\s*stepts\b/i, "");

    name = name.replace(/"{3}/g, '""');
    name = name.replace(/\.\""\s""/g, '""');
    name = name.replace(/""\. \.""/g, "");
    name = name.replace(/"\. \."\s"/g, "");
    name = name.replace(/"\. \."/g, "");
    regex = /\[.*\s-\s.*\]/;
    if (!regex.test(name)) {
        regex = /(?<!\S)-+(?=\s{2,}|$)/; 
        if (!regex.test(name)) {
            name = name.replace(/ -+(?!\s*\S)/, "");
            name = name.replace(/ -+$/g, "");
            name = name.replace(/\(\s*-\s*\)|\[\s*-\s*\]/g, ""); 
        } else {
            regex = / -+(?=\s*\S)/;
            if (!regex.test(name)) {
                name = name.replace(/(?<=\s)-(?=\s)/g, "");
            }
            name = name.replace(/-(?=\s*$)/, ""); 
        }
    } else {
        name = name.replace(/ -+(?!\s*\S)/, "");
        name = name.replace(/ -+$/g, "");
        name = name.replace(/\s-\s(?![\w\d])/g, "");
    }
    name = name.trim();
    return { name, epochs, algorithm, types: modelType };
}

async function JsonThread(thread, firstmessage, option, save = true) {
	let messageContent = "";
	const origmessage = firstmessage.content;
	const messages = await thread.messages.fetch();
	let foundContent = false;
	let regexlink =
		/https?:\/\/(?!.*(?:youtu\.be|youtube|soundcloud|media\.discordapp\.net\/attachments)\b)(?![^\s]+\.(?:jpg|jpeg|png|gif|jpeg|bmp|svg|webp)\b)[^\s]+|(?:huggingface\.co|app\.kits\.ai|mega\.nz|drive\.google\.com|pixeldrain\.com)\/[^\s]+|[a-zA-Z0-9.-]+\/[\w.%-]+\.zip/g;

	if (
		!firstmessage.attachments.size > 0 ||
		!firstmessage.content.match(regexlink) ||
		!thread.name.toLowerCase().includes("epoch")
	) {
		for (const message of messages.values()) {
			if (firstmessage.id === message.id) continue;
			const algorithm = extractAlgorithm(message.content);
			const isAihispanoOrTestAuthor =
				option === "aihispano" || message.author.id === firstmessage.author.id;
			const hasValidContent =
				message.content && message.content.match(regexlink);

			if (
				isAihispanoOrTestAuthor &&
				(hasValidContent ||
					message.attachments.size > 0 ||
					message.content.includes("epoch") ||
					!(algorithm === "N/A"))
			) {
				messageContent += " " + message.content + "\n";
				firstmessage.attachments = firstmessage.attachments.concat(
					message.attachments,
				);
				foundContent = true;
			}
		}
		if (foundContent) {
			firstmessage.content += messageContent;
		} else {
			firstmessage.content = firstmessage.content ? firstmessage.content : "";
		}
	}

	if (!firstmessage.content.match(regexlink)) {
		return { contentToSave: null, result: null };
	}

	const result = {
		id: thread.id,
		name: thread.name,
		owner: thread.ownerId,
		server: thread.guild.id,
		server_name: thread.guild.name,
		published: thread.createdTimestamp,
		upload: thread.createdAt,
		tags: thread.appliedTags,
		content: firstmessage ? firstmessage.content : null,
		attachments: firstmessage.attachments,
	};

	//if(save === true) {
	//const filePath = path.join("models", `${thread.id}.json`);
	//await fs.writeFile(filePath, JSON.stringify(result, null, 2));
	//}
	const contentToSave = `Old: ${origmessage}\nNew: ${messageContent !== "" ? messageContent : "Nothing"}`;
	return { contentToSave, result };
}

async function FormatThread(jsonData) {
	const content = jsonData.content;
	const { cname, epochs, algorithm, types } = extractEpochsAndAlgorithm(
		jsonData.name,
		jsonData.tags,
		jsonData.content,
	);

	let xtypes = types;

	const currentTags = jsonData.tags;
	const updatedTags = [];

	for (const tagKey in currentTags) {
		const tagID = currentTags[tagKey];
		let updatedTagNames = [];

		for (const tagName in tagsMapping.Tags) {
			if (tagsMapping.Tags[tagName].includes(parseInt(tagID, 10))) {
				updatedTagNames.push(tagName);
				break;
			}
		}

		const updatedTagsString = updatedTagNames
			.filter((tag) => tag !== "")
			.join(",");
		if (updatedTagsString) {
			updatedTags.push(updatedTagsString);
		}
	}

	for (const tagKey in currentTags) {
		const tagID = currentTags[tagKey];
		let updatedTagNames = [];

		for (const tagName in tagsMapping.Lang) {
			if (tagsMapping.Lang[tagName].includes(parseInt(tagID, 10))) {
				updatedTagNames.push(tagName);
				break;
			}
		}

		const updatedTagsString = updatedTagNames
			.filter((tag) => tag !== "")
			.join(",");
		if (updatedTagsString) {
			updatedTags.push(updatedTagsString);
		}
	}

	let image = "N/A";
	let data_attachment =
		jsonData.attachments && jsonData.attachments[0] !== null
			? jsonData.attachments
			: jsonData.attachment && jsonData.attachment[0] !== null
				? jsonData.attachment
				: null;
	if (data_attachment) {
		const imageAttachment = data_attachment.find(
			(attachment) =>
				(attachment.contentType &&
					attachment.contentType.startsWith("image/")) ||
				(attachment.type && attachment.type.startsWith("image/")),
		);
		if (imageAttachment) {
			image = imageAttachment.url;
		}
	}

	const regex =
		/https?:\/\/(?!.*(?:youtu\.be|youtube|soundcloud)\b)[^\s]+|(?:huggingface\.co|app\.kits\.ai|mega\.nz|drive\.google\.com|pixeldrain\.com)\/[^\s]+|[a-zA-Z0-9.-]+\/[\w.%-]+\.zip/g;
	let contentn = content.replace(/<|>|\|\|/g, " ");
	contentn = contentn.replace(/\bdownload=true\)/gi, "download=true");
	contentn = contentn.replace(/\?download=true/gi, "");
	contentn = contentn.replace(/\[direct-download\]/g, " ");
	contentn = contentn.replace(/\.zip\)/g, ".zip");
	contentn = contentn.replace(/\.zip\]/g, ".zip");
	contentn = contentn.replace(/\|/g, " ");
	contentn = contentn.replace(/\*/g, " ");
	const links = contentn.match(regex);

	const supportedSites = {
		"huggingface.co": [],
		"mega.nz": [],
		"drive.google.com": [],
		"pixeldrain.com": [],
		"mediafire.com": [],
		"workupload.com": [],
		"cdn.discordapp.com": [],
		"ko-fi.com/s/": [],
	};
	
	if (links && links.length > 0) {
		links.forEach(link => {
			const site = Object.keys(supportedSites).find(site => 
				link.includes(site) && (site !== "cdn.discordapp.com" || link.includes(".zip"))
			);
	
			if (site) {
				supportedSites[site].push(link);
	
				if (site !== "app.kits.ai" && types === "N/A") {
					xtypes = "RVC";
				} else if (site === "app.kits.ai" && types === "N/A") {
					xtypes = "Kits.AI";
				}
			}
		});
	}
	

	let hasLinks = false;
	for (const site in supportedSites) {
		if (supportedSites[site].length > 0) {
			hasLinks = true;
			break;
		}
	}

	let reorganizedSupportedSites = [];

	if (hasLinks) {
		for (const site in supportedSites) {
			for (const link of supportedSites[site]) {
				try {
					reorganizedSupportedSites.push({
						Cloud: site,
						Link: link,
					});
				} catch (error) {
					console.error(`${link}: ${error.message}`);
				}
			}
		}
	}
	if (!reorganizedSupportedSites || reorganizedSupportedSites.length === 0)
		return {
			Status: "Failed",
			Reason: `Dont Found Links In ${jsonData.id}.json`,
		};
	const seenLinks = {};

	for (const { Cloud: site, Link: link } of reorganizedSupportedSites) {
		const index = reorganizedSupportedSites.findIndex(
			(item) => item.Link === link,
		);
		if (!seenLinks[link]) {
			seenLinks[link] = true;
		} else {
			reorganizedSupportedSites.splice(index, 1);
		}
	}

	reorganizedSupportedSites = reorganizedSupportedSites.filter(
		(item) => item.Link,
	);

	const updatedContext = {
		Name: cname,
		Type: xtypes !== "N/A" ? xtypes : types,
		Algorithm: algorithm,
		Epoch: epochs,
		Tags: updatedTags,
		Link: reorganizedSupportedSites[0].Link || None,
	};
	jsonData.links = reorganizedSupportedSites;
	jsonData.context = updatedContext;

	let owner = "N/A";
	if (jsonData.owner) {
		owner = findOwner(jsonData.content, jsonData.owner);
		jsonData.owner = owner;
		user = await fetchUser(jsonData.owner);
		jsonData.owner_username = user.username;
	}


	return { Status: "Success", Data: jsonData, Image: image };
}

module.exports = {
	extractAlgorithm,
	extractEpochsAndAlgorithm,
	findOwner,
	tagsMapping,
	JsonThread,
	FormatThread,
	uuid,
};
