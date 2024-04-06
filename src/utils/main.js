// POR HACER:
// faltan algunos tags de aihubfr

const fs = require("fs");
const path = require("path");
const axios = require("axios");
let processedCount = 0;
const { WebhookClient,  AttachmentBuilder } = require('discord.js');

const DeleteFilesContentNull = false;
const { GetPixiv } = require("./pixiv.js")
const { GetCdnDsc } = require("./cdndsc.js");
const { connect } = require("http2");

async function enviarMensajeConArchivo(webhookURL, mensaje, rutaArchivo) {
  try {
      const webhook = new WebhookClient({ url: webhookURL });

      const archivoAdjunto = new  AttachmentBuilder(rutaArchivo);

      response = await webhook.send({
          content: mensaje,
          files: [archivoAdjunto],
          //avatarURL: "https://cdn.discordapp.com/avatars/865079034500874281/a_c324f93e1a32adc1f38e85901c729257.gif?size=1024&width=0&height=320"
      })
      return response.attachments[0].url
  } catch (error) {
      console.error('Error al enviar el mensaje con el archivo adjunto:', error);
  }
}


const tagsMapping = {
  Lang: {
    ES: [1108324682735820862, 1110874219362914425, 1127722904612778095, 1159339353198317628, 1175440470176960633, 1184575337691099268],
    EN: [1110874643155406878, 1108324567069495326, 1124525391101575308, 1159339312018624513, 1132561689481584661, 1175433003254681681, 1184575297228636190],
    JP: [
      1127715413640364132, 1121324803773702196,
      1124525717762363422, 1159339390657646602,
      1175438110709002240
    ],
    KR: [1127715243569721484, 1107670309198372916, 1127715243569721484 , 1159339410022744074, 1132593674484727848, 1175440351843061801],
    PT: [1124525427747197019],
    FR: [1143830388351979580, 1143830388351979580, 1143830388351979580],
    TR: [1117039961103925248, 1128995289886363719],
    RU: [1160153969935519804, 1132594514079531089, 1175433036750393374],
    IT: [1162032086526459915, 1175433017951539200],
    PL: [1133358067233341512],
    OTHER: [1123794615502377090, 1127715504354762773, 1132561750957494292, 
      1159339493183193141, 1175433354703810580, 1159339493183193141, 1128995327022727238, 1185171001223426068],
  },
  Tags: {
    Artist: [1099150044785021019, 1175433826227466311, 1159339270880890981, 1185170437680922644],
    Rapper: [
      1128462887225151520, 1127715456598413455, 1143666214078529776,
      1117040175365767178, 1124571901147222066, 1128995461378879510
    ],
    OG: [1122951427522834502, 1127715629026254878, 1175440861207744623, 1159339519141756982],
    Actor: [
      1125169616222691398, 1127766833043353711, 1128462916409114796,
      1122900738172014645, 1133160968642367489, 1128995503846215750
    ],
    Singer: [
      1128462932896907284, 1122899796311670834, 1139308993668468806,
      1124526486586671206, 1128462932896907284, 1143666232856428665,
      1128995744318242837
    ],
    Fictional: [
      1142441360645951549, 1133057268729000117, 1120447717966106636,
      1120448073064263870, 1123163109427793960, 1125169954086465637,
      1127785637114806312, 1110363117415825569, 1127785637114806312,
      1132594753553301554, 1175433664235061338, 1159339295144935514,
      1128995985826263100, 1184866755336749106
    ],
    Anime: [
      1120447963198664764, 1110364355700199464, 1127747371443425403,
      1124525657657978951, 1141755544097538119, 1132594280574222346,
      1175439124551979161, 1128995893476085810, 1185170724055420988
    ],
    Other: [
      1124711240594362398, 1119718145247166504, 1127786379598905404,
      1110636151510941749, 1124416867600179380, 1117999278745473104,
      1175433888588374037, 1159339469586042960, 1128996089660461096,
      1184575464442953748, 1184575427403075614
    ],
    "E-Celeb": [
      1122900392297123880, 1142876137647767664, 1128466166273282170,
      1128462863430848574, 1114434339397177374, 1124711081156296705,
      1124711081156296705, 1143830484242153653, 1128462874612858880,
      1132593583795486760, 1175433602532655166, 1159339233434148894,
      1128995836588720148
    ],
    Polity: [1128777651377668207],
    Influencer: [1128777551674888263],
    Comediant: [1128996089660461096, 1128777510402936952],
    "Celebrity": [
      1175433585747034195, 1128777493789290507
    ],
    "TTS / Realtime": [
      1175440917562404884, 1159339375625244722
    ],
    "RVC": [
      1124571792648978442, 1113386654133145674, 115933925231270707, 1124570965729361961, 
      1175432936728821770, 1175432967955431495, 1159339252312707072, 1159343639575674900,
      1128777396531765450, 1128777435270361088, 1184575233223557213
    ],
    "Kits AI": [
      1128370597718671401
    ],
    'E-Girl' : [
      1200276830318501948
    ],
    'GPT Sovits' : [
      1198973742722846770
    ]
    
  },
};
function findOwner(content, item) {
  content = content.replace(/\*\*/g, '');
  const regexPatterns = [
    /By: <@(\d+)>/i,
    /Author: <@(\d+)>/i,
    /Author <@(\d+)>/i,
    /(?:pretrained\s+by\s*)?(?<!pretrained\s)by\s+<@(\d+)>/i,//old : /By <@(\d+)>/,
    /Trained By <@(\d+)>/i,
    /creado por <@(\d+)>/i,
    /created by <@(\d+)>/i,
    /Entrenado por <@(\d+)>/i,
    /por <@(\d+)>/,
    /By <@(\d+)>/i,
    // Otras expresiones regulares aquí...
  ];

  for (const pattern of regexPatterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return item; // Si no se encuentra ninguna coincidencia, se devuelve el valor de item
}

function convertirAbreviacionANumero(valorAbreviado) {
  const multiplicadores = { 'k': 1e3, 'm': 1e6, 'bn': 1e9 };

  for (const [abreviacion, multiplicador] of Object.entries(multiplicadores)) {

      if (valorAbreviado.toLowerCase().includes(abreviacion)) {
          const numero = parseFloat(valorAbreviado.replace(/[^\d.]/g, '')); // Extraer solo los dígitos y el punto
          //console.log(numero)
          return Math.floor(numero * multiplicador).toString();
      }
  }

  return valorAbreviado; // Si no hay coincidencia, devolver el valor original
}


function reemplazarAbreviacionesEnTexto(texto) {
  const patron = /\b(\d+(\.\d+)?[kmbn]{1,2})\b/ig; // Expresión regular para buscar valores abreviados
  const textoModificado = texto.replace(patron, (match) => convertirAbreviacionANumero(match).toString());

  return textoModificado;
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
    //old const modifiedPattern = new RegExp(pattern.source + '(\\s+(?:64|32)(?=[\\]}]))?\\b', 'gi');
    const modifiedPattern = new RegExp(pattern.source + '\\s+(160|128|64|60|32|40|28|21|20|16)(?![a-zA-Z0-9]|$)', 'gi');

  



    const matches = cnamen.match(modifiedPattern);

    if (matches) {
      let algorithm = matches[0].replace(/^(.)(.*)$/, (match, firstChar, restChars) => firstChar.toUpperCase() + restChars.toLowerCase());


      //console.log(algorithm)

      // Eliminar el número 64 o 32 si está a la derecha del algoritmo


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
      cnamen = cnamen.replace(matches[0], algorithm.replace(/\b(?:160|128|64|60|32|40|28|21|20|16)\b/, ''));
      return cnamen;
    }
  }

  return "N/A"; // Si no se encuentra, establece un valor predeterminado
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
    // /(?:^|\s)(Dio|Pm)(?=\s|$)/gi,
    // /(?:^|\s)(?:\[(Dio|Pm)\])(?=\s|$)/g,
    ///(?:^|\s)\[(Dio|Pm)\](?=\s|$)/g,
    /\[(Dio|Pm)\]/g,
    /\b(Rmvpe_gpu|Rmvpe gpu|Rvmpe|Rmvpe)\b/gi,
    /\b(rmv?pe)\b/gi,
    /\bCrepe\b/gi,
    /(?:\s|^)Pm(?:\s|$)/gi,
    /\[PM\]/gi

  ];

  for (const pattern of regexPatterns) {
    const matches = cnamen.match(pattern);
    if (matches) {
      const algorithm = matches[0].replace(/^(.)(.*)$/, (match, firstChar, restChars) => firstChar.toUpperCase() + restChars.toLowerCase());
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

  return "N/A"; // Si no se encuentra, establece un valor predeterminado
}
function extractType(content, tags) {
  let modifiedContent = content; // Inicializar una variable modificada con el contenido original

  const typePattern1 = /\b(RVC(?:\s*V\d+)?|Kits\.AI)\b/gi;
  const typePattern2 = /\b(?:RVC\s*)(V[12]|Kits\.AI)\b/gi;
  const typePattern3 = /\([^)]*(RVC(?:\s*V[12])?|Kits\.AI)[^)]*\)/gi;
  let typePattern4 = /\b(RVC[12]|Kits\.AI)\b/gi;
  const typePattern6 = /(\bRVC(?:_)V\d+\b)/gi;

  const matches6 = modifiedContent.match(typePattern6);
  if (matches6) {
    const cleanedResult = matches6.join(', ').replace(/\W+/gi, ' ').replace(/\s+/g, ' ');
    modifiedContent = modifiedContent.replace(typePattern6, cleanedResult);
    return { result: cleanedResult, modifiedContent };
  }


  const matches3 = modifiedContent.match(typePattern3);
  if (matches3) {
    for (const match of matches3) {
      const matchWithoutParentheses = match.replace(/\(|\)/g, '');
      const x = matchWithoutParentheses.match(/\b(RVC\s*V[12]|Kits\.AI)\b/gi);
      if (x) {
        const cleanedResult = x[0].replace(/^\w/, c => c.toUpperCase());
        const modifiedMatch = match.replace(typePattern1, cleanedResult.replace(/\bGUI\b|\W+/gi, ' ').replace(/\s+/g, ' '));
        modifiedContent = modifiedContent.replace(match, modifiedMatch);
        return { result: cleanedResult, modifiedContent };
      }
    }
  }
  

  let matches4 = modifiedContent.match(typePattern4);
  if (matches4) {
    const result = matches4.join(', ');
    const cleanedResult = result.replace(/\bRVC1\b/gi, 'RVC V1').replace(/\bRVC2\b/gi, 'RVC V2');
    modifiedContent = modifiedContent.replace(typePattern4, cleanedResult);
    return { result: cleanedResult, modifiedContent };
  }
  

  typePattern4 = /\b(RVC\s*[12]|Kits\.AI)\b/gi;
  matches4 = modifiedContent.match(typePattern4);
  if (matches4) {
    const result = matches4.join(', ');
    const cleanedResult = result.replace(/\bRVC\s*1\b/gi, 'RVC V1').replace(/\bRVC\s*2\b/gi, 'RVC V2');
    modifiedContent = modifiedContent.replace(typePattern4, cleanedResult);
    return { result: cleanedResult, modifiedContent };
  }

  

  const matches1 = modifiedContent.match(typePattern1);
  if (matches1) {
    const result = matches1.join(', ');
    const cleanedResult = result.replace(/(RVC)(\s*)(V\d+)/gi, (match, rvc, space, v) => rvc.toUpperCase() + ' ' + v.toUpperCase());
    modifiedContent = modifiedContent.replace(typePattern1, cleanedResult);
    return { result: cleanedResult, modifiedContent };
  }

  

  const matches2 = modifiedContent.match(typePattern2);
  if (matches2) {
    const result = matches2.join(', ');
    const cleanedResult = result.replace(/(RVC)(\s*)(V\d+)/gi, (match, rvc, space, v) => rvc.toUpperCase() + ' ' + v.toUpperCase());
    modifiedContent = modifiedContent.replace(typePattern2, cleanedResult);
    return { result: cleanedResult, modifiedContent };
  }

  
  

  if (tags !== null && tags !== undefined) {
    // La variable tags existe y no es null ni undefined
    for (const dude of tags) {
      if (dude == "1159343639575674900") {
        return { result: "RVC V2", modifiedContent };

      } else if (dude == "1159339252312707072") {
        return { result: "RVC", modifiedContent };

      }
    }
  }

  return { result: "N/A", modifiedContent };
}


async function youtubeImage(url) {
  let video_id, result;
  if ((result = url.match(/youtube\.com.*(\?v=|\/embed\/)(.{11})/))) {
      video_id = result.pop();
  } else if ((result = url.match(/youtu.be\/(.{11})/))) {
      video_id = result.pop();
  }

  if (video_id) {
      const resolutions = [
          'maxresdefault',
          'hqdefault',
          'mqdefault',
          'sddefault',
          'default'
      ];

      let thumbnailUrl;
      for (let x = 0; x < resolutions.length; x++) {
          thumbnailUrl = `https://img.youtube.com/vi/${video_id}/${resolutions[x]}.jpg`;
          try {
              const response = await axios.head(thumbnailUrl);
              if (response.status === 200) {
                  return thumbnailUrl;
              }
          } catch (error) {
          }
      }
  }
  return false;
}

function number_to_real(cadena) {
  // Buscar cualquier secuencia de dígitos, comas o puntos en la cadena
  //old const matches = cadena.match(/([\d]+([,.]\d+)?)/g);
  const matches = cadena.match(/(?<![VNvn])\b([\d]+([,.]\d+)?)\b/g);
  if (!matches) {
      return cadena;
  }
  const resultado = matches.reduce((cadenaActualizada, numero) => {
      const numeroLimpio = numero.replace(',', '');
      return cadenaActualizada.replace(numero, numeroLimpio);
  }, cadena);

  return resultado;
}

function e_to_epochs(cadena) {
  const $1 = /(?:\b|\s)(\d+)e(?:\b|\s)|\b(\d+)e(?:\b|\s)|\be(\d+)\b/gi;  //old /(\d+)e|e(\d+)\b/gi; 
  const $2 = /\(E\s*(\d+)\)/;
  if ($1.test(cadena)) {
    cadena = cadena.replace($1, (_, num1, num2, num3, num4) => {
      const num = num1 || num2 || num3 || num4;
      return ` ${num} Epochs`;
    });
  }
  if ($2.test(cadena)) {
    cadena = cadena.replace($2, (_, num) => `( ${num} Epochs)`);
  }
  return cadena;
}

function removeDashBetweenNumberAndEpochs(cname) {
  return cname.replace(/(\(\s*\[?\s*)([^\d\s])?\s*(\d+)\s*-\s*epochs(\s*\))/i, (match, prefix, leftChar, number, suffix) => {
      return `${prefix}${leftChar || ""} ${number} epochs${suffix}`;
  });
}
function extractEpochsAndAlgorithm(cname, tags, content) {
  
  let nohop = RemoveHopFromAlgorithm(cname)
  
  if (nohop !== "N/A") {
    cname = nohop
  }
  
  cname = reemplazarAbreviacionesEnTexto(cname);
  cname = number_to_real(cname)
  if (!cname.toLowerCase().includes("epoch")) {
    cname = e_to_epochs(cname)
  }
  
  cname = cname.replace(/\(\?\)/gi, "");
  cname = cname.replace(/[^\S\r\n]*Voz:[^\S\r\n]*/gi, "");
  cname = cname.replace(/[^\S\r\n]*Algoritmo:[^\S\r\n]*/gi, " ");
  cname = cname.replace(/\bKits\.IA\b/gi, "Kits.AI")
  cname = cname.replace(/\bRCV\b/gi, "RVC");
  cname = cname.replace(/\bRV2\b/gi, "RVC v2");
  cname = cname.replace(/\bRCrepe\b/gi, "Crepe")
  cname = cname.replace(/\bmanigo\b/gi, "Mangio")
  cname = cname.replace(/\bEphos\b/gi, "Epochs");
  cname = cname.replace(/\bEpchos\b/gi, "Epochs");
  cname = cname.replace(/\bEproch\b/gi, "Epochs");
  cname = cname.replace(/\bEpoches\b/gi, "Epochs");
  cname = cname.replace(/\bEpcohs\b/gi, "Epochs");
  cname = cname.replace(/\bEpjchs\b/gi, "Epochs");
  cname = cname.replace(/\bEpocsh\b/gi, "Epochs");
  cname = cname.replace(/\beprochs\b/gi, "Epochs");
  cname = cname.replace(/[\u00C0-\u024F\u1E00-\u1EFF]/g, match => match.toLowerCase() === 'é' ? 'E' : match);
  cname = cname.replace(/\bEpocas\b/gi, "Epochs");

  cname = cname.replace(/\bmagio\b/gi, "Mangio");
  cname = cname.replace(/\bmagnio\b/gi, "Mangio");
  cname = cname.replace(/\brmpve\b/gi, "Rmvpe");
  cname = cname.replace(/\brvmpe\b/gi, "Rmvpe");
  cname = cname.replace(/\brmpve_gpu\b/gi, "Rmvpe");
  cname = cname.replace(/\brvmpe_gpu\b/gi, "Rmvpe");
  cname = cname.replace(/\brmvpe_gpu\b/gi, "Rmvpe");
  cname = cname.replace(/\bcreepe\b/gi, "Crepe");
  cname = cname.replace(/\brvc-2\b/gi, "RVC2")
  

  let epochs = "N/A";
  let algorithm = extractAlgorithm(cname);
  let diofounded = false;
  //console.log(algorithm);
  if (algorithm === "N/A") {
    let __ = /\bDio pitch extraction\b(?!.*(?:Harvest|Mangio-crepe|Mangio-Crepe|Mangio Crepe Rmvpe_gpu|Rmvpe gpu|Rvmpe|Rmvpe))/i
    if (__.test(cname)) {
      cname = cname.replace(__, '');
      algorithm = "Dio"
      diofounded = true;
    } else {
      algorithm = extractAlgorithm(content);
    }
    
  } else if(algorithm.includes("[dio]") || algorithm.includes("[pm]")) {
    var escapedAlgorithm = algorithm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    cname = cname.replace(new RegExp(`${escapedAlgorithm}`, 'gi'), '');
    algorithm = algorithm.replace(/[\[\]]/g, '').replace(/^\w/, (c) => c.toUpperCase());
    diofounded = true;

  }
  let { result: types, modifiedContent: modifiedCname } = extractType(cname, tags);

  if (types === "N/A") {
    ({ result: types, modifiedContent: modifiedCname } = extractType(content, tags));
  } else {
    cname = modifiedCname
  }

  

  
  //let types = null;
  // Eliminar el tipo del nombre
  //cname = cname.replace(new RegExp(types, 'gi'), '').trim();
  cname = cname.replace(new RegExp(`\\s*\\(${types}\\)|\\s*${types}`, 'gi'), '');
  const typePattern = /\b(RVC(?:\s*V\d+)?|Kits\.AI)\b/ig;
  cname = cname.replace(typePattern, "").trim();
  cname = cname.replace(/\b(RVC(?:\s*V\d+)?|Kits\.AI|\bV\d+\b)\b/gi, "").trim();
  cname = cname.replace(/RVC|Kits\.AI/g, '')
  cname = cname.replace(/\bKits.AI\b/gi, '');
  cname = cname.replace(/\bKits\b/g, '');
  cname = cname.replace(/\bRVC\b/g, '');
  cname = cname.replace(/\(\s*,\s*\//g, "(");
  cname = cname.replace(/\bPitch Extraction\b/i, "");

  cname = cname.replace(/\(\//g, "(");
  const typeKeywords = ["RVC", "Kits.AI"];
    for (const keyword of typeKeywords) {
      if (types.toLowerCase().includes(keyword.toLowerCase())) {
        types = keyword;
        break;
      }
    }
  
  

  
  
  if (algorithm !== "N/A" && !diofounded) {
    cname = cname.replace(new RegExp(`\\b${algorithm}\\b`, 'gi'), ''); // Eliminar el algoritmo de cname
  }


  cname = removeDashBetweenNumberAndEpochs(cname)

  if (algorithm == "N/A") {
    algorithm = "Rmvpe"
  }

  // Buscar epochs en el nombre
  const regexPatterns = [

    /\((\d+)\s+Epochs\)/i,
    /\b(\d+)\s+Epochs\b/i,
    /-\s*(\d+)\s*Epochs?/i,  // Formato: " - {número} Epochs)"
    /\b(\d+)\s+Epochs\b/i,
    /\b(\d+)\s*Epochs\b/i,
    /\b(\d+)\s*Epoch\b/i,
    /(\d+) Epochs/i,
    / (\d+) Epochs/i,
    /\((\d+) Epochs\)/i,              // Formato: " {número} Epochs"
    /\(([^\)]*?(\d+)[^\)]*?)\s*Epochs\)/i,
    /(?:\s+\[|\()(\d+)\s+Epochs\)/i,
    /\[(\d+)\s*Epochs\]/i,  // Formato: "({texto}{número}Epochs)"
    /(\d+k)\s+Epochs/i,
    /Epochs\s*:\s*(\d+)/i,
    /Epoch\s*(\d+)/i,
    /(\d+)\s*(?:k\s*)?Epochs?/i,
    /\(EPOCHS (\d+)\)/i,
    /\(EPOCHS\s*(\d+)\s*\)/i,
    /\( EPOCH (\d+) \)/i,
    //wihout s
    / - (\d+)(?:\s+Epoch)?/i,
    / - (\d+)(?:\s+Epoch)?\)/i,  // Formato: " - {número} Epochs)"
    / (\d+) Epoch/i,
    /\((\d+) Epoch\)/i,              // Formato: " {número} Epochs"
    /\(([^\)]*?(\d+)[^\)]*?)\s*Epoch\)/i,
    /(?:\s+\[|\()(\d+)\s+Epoch\)/i,
    /\[(\d+)\s*Epoch\]/i,  // Formato: "({texto}{número}Epochs)"
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
    const match = cname.match(pattern);
    if (match) {
      
      
      epochs = match[1];
      
      // Elimina la parte encontrada del título
      
      cname = cname.replace(pattern, "");
      
      //cleaned epochs
      cname = cname.replace(/\s*\( Epochs\)/g, ""); 
      
      cname = cname.replace(/(\s+-\s+\d+\s+Epochs)?$/, '').trim();
      
      //cname = cname.replace(/(?<![0-9:-])\b(?!\d+ Hop|\d+ Hop|\d+ Steps|\d+ Step\b|\d+'|\d+ \d+\.\d+|\d+\s+|\d+\.\d+\w)-?\d+\b(?![0-9:-])/g, '');
      //cname = cname.replace(/\s*\d+k(?![a-z])/g, '');
      
      cname = cname.replace(/\bEpoch\b/g, '');
      cname = cname.replace(/\bepoch\b/g, '');
      cname = cname.replace(/\bepochs\b/g, '');
      cname = cname.replace(/\bEpochs\b/g, '');
      cname = cname.replace(/\bepoches\b/g, '');



      
      break;
    }
  }

  

  for (const pattern of regexPatterns) {
    ccontent = content
    if (!ccontent.toLowerCase().includes("epoch")) {
      ccontent = e_to_epochs(content)
    }
    const match2 = ccontent.match(pattern);
    if (match2 && epochs === "N/A") {
      epochs = match2[1];
      // Elimina la parte encontrada del título
      cname = cname.replace(pattern, "");
      
      //cleaned epochs
      cname = cname.replace(/\s*\( Epochs\)/g, ""); 
      cname = cname.replace(/(\s+-\s+\d+\s+Epochs)?$/, '').trim();
      //cname = cname.replace(/(?<![0-9:-])\b(?!\d+ Hop|\d+ Hop|\d+ Steps|\d+ Step\b|\d+'|\d+ \d+\.\d+|\d+\s+|\d+\.\d+\w)-?\d+\b(?![0-9:-])/g, '');
      //cname = cname.replace(/\s*\d+k(?![a-z])/g, '');
      cname = cname.replace(/\bEpoch\b/g, '');
      cname = cname.replace(/\bepoch\b/g, '');
      cname = cname.replace(/\bepochs\b/g, '');
      cname = cname.replace(/\bEpochs\b/g, '');
      cname = cname.replace(/\bepoches\b/g, '');


      
      break;
    }
  }
  cname = cname.replace(/\(\s*,\s*\)/g, '');
  cname = cname.replace(/\/+(?!\s*\S)/g, "") //remove / doble space

  cname = cname.replace(/\/+(?=\s*\))|\/+(?=\s*\])|\/+(?!\s*\S)/g, "").trim();

  cname = cname.replace(/\s*\(\s*\)/g, "");
  cname = cname.replace(/\s*\(\s*\)|\s*\(\s*\)/g, "").trim();
  cname = cname.replace(/\s*\(\s*\)|\s*\(\s*\)|\s*\[\s*\]|\s*\[\s*\]/g, "").trim();
  cname = cname.replace(/\s*\(\s*\)/g, "");
  if (/, ,\s*\d+\s*Steps/.test(cname)) {
    mcname = cname.replace(/,\s*,\s*\d+\s*Steps/g, "").trim();
    //console.log("Old: " + cname + " New: " + mcname);
    cname = mcname
  }

  if (/\(\s*,\s*\d+\s*Steps\)/.test(cname)) {
    mcname = cname.replace(/\(\s*,\s*\d+\s*Steps\)/g, "").trim(); // Eliminar "(,, 9400 Steps)"
    //console.log("Old: " + cname + " New: " + mcname);
    cname = mcname
  }
  cname = cname.replace(/\(\)/g, "").trim(); // Eliminar cualquier otro "(,)" restante
  cname = cname.replace(/\(\s*,\s*,\s*\)/g, "");
  cname = cname.replace(/\[\s*\|\s*\]/g, '');
  cname = cname.replace(/\[\s*,\s*\]/g, '');
  cname = cname.replace(/\{\s*\}/g, "");
  cname = cname.replace(/\[\s*\)/g, "");
  

  //unnecesary
  cname = cname.replace(/,+/g, ',');
  cname = cname.replace(/, ,/g, '')
  _r = /\[.*\s-\s.*\]/;
  if (!_r.test(cname)) {
   
    _r = /(?<!\S)-+(?=\s{2,}|$)/  //old "/ -+(?=\s*\S)/"
    if (!_r.test(cname)) {

      cname = cname.replace(/ -+(?!\s*\S)/, '')
      cname = cname.replace(/ -+$/g, '');
      cname = cname.replace(/\(\s*-\s*\)|\[\s*-\s*\]/g, ''); // eliminar - dentro de ()[]

    } else {
      _r = / -+(?=\s*\S)/
      if (!_r.test(cname)) {
        
        cname = cname.replace(/(?<=\s)-(?=\s)/g, '');
      }
      cname = cname.replace(/-(?=\s*$)/, ''); //old : /-(?=[\s]*)$/  


      
    }

    
    
  } else {
    
    cname = cname.replace(/ -+(?!\s*\S)/, '')
    cname = cname.replace(/ -+$/g, '');
  //cname = cname.replace(/ -+(?=\s*\S)(?![^\[]*\])/, '');
    cname = cname.replace(/\s-\s(?![\w\d])/g, '')
  }





  
  //cname = cname.replace(/ -+$/g, '');
  
  
  
  
  cname = cname.replace(/,\s*$/, '');
  cname = cname.replace(/\/+(?=\s*\))|\/+(?=\s*\])|\/+(?!\s*\S)/g, "").trim(); //remove / ()[]
  cname = cname.replace(/(?<=\s{2}|^);/g, ''); //remove ; ()[]
  cname = cname.replace(/(?<=\s{2}|^|\{);/g, '') //above {}
  cname = cname.replace(/(?<!\S.|\S)\|{2,}(?=\s{2}|\)|\])|(?<=\s{2}|\(|\[\s*)\|{2,}(?!\S.|\S)/g, ''); //remove || in ()[] and blank spaces

  cname = cname.replace(/(?<!\S.|\S)\|(?=\s{1,}(?:\)|\]))|(?<=\s{1,}(?:\(|\[\s*))\|(?!\S.|\S)/g, ''); // above
  cname = cname.replace(/(?<=\()\s*\|(?=\s*\))|(?<=\[\s*)\s*\|(?=\s*\])/g, '');
  cname = cname.replace(/\|\s*\|/g, '|');
  cname = cname.replace(/\s*\|\s*\|\s*\|/g, ' |');
  cname = cname.replace(/(?<=\s{2}|^|\[)\s*;\s*(?=\]|\s{2}|$)/g, '');
  //cname = cname.replace(/(?<=\s{2}|^|\[|\()\s*-\s*(?=\]|\s{2}|$|\))/g, '');
  cname = cname.replace(/(?<=\()\s*-\s*(?=\s*\))|(?<=\[\s*)\s*-\s*(?=\s*\])/g, '');

  cname = cname.replace(/[\[\(]\s*64\s*[\]\)]/, '');
  cname = cname.replace(/\(\s*\*\s*\)|\[\s*\*\s*\]/g, '');
  cname = cname.replace(/\+/g, '');
  cname = cname.replace(/- \./g, '-');
  cname = cname.replace(/- -/g, '-');


  _r = /\[.*\s-\s.*\]/;
  if (!_r.test(cname)) {
   
    _r = /(?<!\S)-+(?=\s{2,}|$)/  //old "/ -+(?=\s*\S)/"
    if (!_r.test(cname)) {
   
      cname = cname.replace(/ -+(?!\s*\S)/, '')
      cname = cname.replace(/ -+$/g, '');
      cname = cname.replace(/\(\s*-\s*\)|\[\s*-\s*\]/g, ''); // eliminar - dentro de ()[]

      


    } else {


      _r = / -+(?=\s*\S)/
      if (!_r.test(cname)) {

        cname = cname.replace(/(?<=\s)-(?=\s)/g, '');
      }
      cname = cname.replace(/-(?=\s*$)/, ''); //old : /-(?=[\s]*)$/  


      




      
    }
    
  } else {
    
    cname = cname.replace(/ -+(?!\s*\S)/, '')
    cname = cname.replace(/ -+$/g, '');
  //cname = cname.replace(/ -+(?=\s*\S)(?![^\[]*\])/, '');
    cname = cname.replace(/\s-\s(?![\w\d])/g, '')

  }

  //delete words
  cname = cname.replace(/Feature Extraction/g, '');
  cname = cname.replace(/Original pretrain/g, '');





  
  cname = cname.replace(/\(\{\s*\}\)/g, '');
  cname = cname.replace(/\(\s*\.\s*\)/g, '');
  cname = cname.replace(/\[\s*,\s*\]/g, '');
  cname = cname.replace(/\(\s*\+\s*\)/g, '');
  cname = cname.replace(/\s+/g, ' ');
  cname = cname.replace(/(?<=\S)\\+(?=\s|$)/g, '');
  cname = cname.replace(/\[\|\|\]/g, '');
  cname = cname.replace(/\(\s+\)/g, '')
  cname = cname.replace(/\[\s*\]/g, '')
  cname = cname.replace(/\(\s*,\s*/g, '(');
  cname = cname.replace(/\(\s*\)|\[\s*\]/g, '');

  cname = cname.replace(/\((?![^()]*\()(?![^()]*\))/, ''); // replace last ( alone
  cname = cname.replace(/\|\s*$/, ''); // replace last | alone
  cname = cname.replace(/\(\/ - \)/g, ''); // delete (/ - )
  cname = cname.replace(/\(\s*-\s*/g, '('); // delete ( -...
  cname = cname.replace(/\{\s*\}/g, '');
  cname = cname.replace(/(\|\s*-\s*|- \|\s*)/g, '| ');
  cname = cname.replace(/-\s*,\s*/g, "-");     // "- , "
  cname = cname.replace(/-\s*\.\s*/g, "-");    // "- ."
  cname = cname.replace(/-\s*-\s*/g, "-");     // "- -"
  cname = cname.replace(/-\s*-\s*-\s*/g, "-"); // "- - -"
  cname = cname.replace(/-\s*\)/g, ')');
  cname = cname.replace(/\(\s*-/g, '(');
  cname = cname.replace(/-\s*\]/g, ']');
  cname = cname.replace(/【\s*,\s*】/g, '');
  cname = cname.replace(/\|\s*,\s*\|/g, '|');
  cname = cname.replace(/\(\//g, "(");
  cname = cname.includes('(') ? cname : cname.replace(/\)/g, '');
  cname = cname.replace(/\[\|\]/g, '');
  cname = cname.replace(/\| \|/g, "|");
  cname = cname.replace(/\( \|/g, "(");
  cname = cname.replace(/\{\s*,\s*\}/g, "");

  cname = cname.replace(/\[\; /, "[")
  cname = cname.replace(/\[\;/, "[")
  cname = cname.replace(/\( \; /, "(")
  cname = cname.replace(/\( \;/, "(")
  cname = cname.replace(/ ; \)/, ")")
  cname = cname.replace(/; \)/, ")")
  cname = cname.replace(/, \]/, "]")
  cname = cname.replace(/ ,\]/, "]")
  cname = cname.replace(/,\]/, "]")
  cname = cname.replace(/\[ , /, "[")
  cname = cname.replace(/\[, /, "[")
  cname = cname.replace(/\[,/, "[")
  cname = cname.replace(/\[ \- /, "[")
  cname = cname.replace(/\[ \-/, "[")
  cname = cname.replace(/\[- /, "[")
  cname = cname.replace(/\[-/, "[")
  cname = cname.replace(/\] \]/, "]")
  cname = cname.replace(/;/g, " ")
  cname = cname.replace(/ {3}/g, "  ")
  cname = cname.replace(/ {2}/g, " ")
  cname = cname.replace(/\|,/g, '|');
  cname = cname.replace(/ , \)/g, ')');
  cname = cname.replace(/, \)/g, ')');
  cname = cname.replace(/,\)/g, ')');
  cname = cname.replace(/\)\)/g, ')');
  cname = cname.replace(/\) \)/g, ')');
  cname = cname.replace(/ \| \)/g, ')');
  cname = cname.replace(/\| \)/g, ')');
  cname = cname.replace(/\( \/ /g, '(');
  cname = cname.replace(/\( \//g, '(');
  cname = cname.replace(/ \| \]/g, ']');
  cname = cname.replace(/\| \]/g, ']');
  cname = cname.replace(/\/\//g, '/');
  cname = cname.replace(/\[\/ /g, '[');
  cname = cname.replace(/\[\//g, '[');
  cname = cname.replace(/\(- /g, '(');
  cname = cname.replace(/\(-/g, '(');

  cname = cname.replace(/\(\s*\)|(?<=\()(\s*)(?=\))/g, '')
  cname = cname.replace(/\[ \)/g, '')
  cname = cname.replace(/\[\)/g, '')
  cname = cname.replace(/\[\]/g, '')
  cname = cname.replace(/\( /g, '(')
  cname = cname.replace(/ \)/g, ')')
  cname = cname.replace(/\[ /g, '[');
  cname = cname.replace(/ \]/g, ']');
  cname = cname.replace(/\) - \(/g, ') (');
  cname = cname.replace(/\) \| \[/g, ') [');
  cname = cname.replace(/\) , \(/g, ') (');

  cname = cname.match(/\|/g) && cname.match(/\|/g).length <= 1 ? cname.replace(/\|/g, '') : cname;
  //cname = cname.match(/,/g) && cname.match(/,/g).length <= 1 ? cname.replace(/,/g, '') : cname;
  //cname = cname.match(/-/g) && cname.match(/-/g).length <= 1 ? cname.replace(/-/g, '') : cname;

  cname = cname.replace(/\([^a-zA-Z\d\s]*,[\s]*\)/g, "") //remove (,)
  cname = cname.replace(/\(\.0\)/g, '');
  cname = cname.replace(/\(\)/g, "")
  cname = cname.replace(/\/\s\//g, "")
  cname = cname.replace(/\*\s\*/g, "")
  cname = cname.replace(/ {3}/g, "  ")
  cname = cname.replace(/ {2}/g, " ")
  cname = cname.replace(/\(\.\)/g, "");
  cname = cname.replace(/\(&\)/g, "");

  //delete steps
  cname = cname.replace(/\((\d+)steps\)/i, "")
  cname = cname.replace(/\((\d+)\s*steps\)/i, "")
  cname = cname.replace(/\[(\d+)\s*Steps\]/i, "")
  cname = cname.replace(/\,\s*(\d+)\s*steps/i, "")
  cname = cname.replace(/(\d+)\s*steps\b/i, "")
  cname = cname.replace(/(\d+)\s*stepts\b/i, "")

  //delete """
  cname = cname.replace(/"{3}/g, '""');
  cname = cname.replace(/\.\""\s""/g, '""');
  cname = cname.replace(/""\. \.""/g, '');
  cname = cname.replace(/"\. \."\s"/g, "")
  cname = cname.replace(/"\. \."/g, "")

  

  
  
  
  
  
  









  _r = /\[.*\s-\s.*\]/;
  if (!_r.test(cname)) {
   
    _r = /(?<!\S)-+(?=\s{2,}|$)/  //old "/ -+(?=\s*\S)/"
    if (!_r.test(cname)) {
   
      cname = cname.replace(/ -+(?!\s*\S)/, '')
      cname = cname.replace(/ -+$/g, '');
      cname = cname.replace(/\(\s*-\s*\)|\[\s*-\s*\]/g, ''); // eliminar - dentro de ()[]



    } else {
      _r = / -+(?=\s*\S)/
      if (!_r.test(cname)) {

        cname = cname.replace(/(?<=\s)-(?=\s)/g, '');
      }
      cname = cname.replace(/-(?=\s*$)/, ''); //old : /-(?=[\s]*)$/  


      


      
    }

    
    
  } else {
    
    cname = cname.replace(/ -+(?!\s*\S)/, '')
    cname = cname.replace(/ -+$/g, '');
  //cname = cname.replace(/ -+(?=\s*\S)(?![^\[]*\])/, '');
    cname = cname.replace(/\s-\s(?![\w\d])/g, '')

  }

  cname = cname.trim();





  

  

  return { cname, epochs, algorithm, types };
}
function generateLinkDescription(supportedSites) {
  const descriptions = [];

  for (const site in supportedSites) {
    if (supportedSites.hasOwnProperty(site)) {
      const links = supportedSites[site];

      const linkDescriptions = links.map(link => `[${site}](${link.split('>')[0]})`);
      descriptions.push(...linkDescriptions);
    }
  }

  return descriptions.length > 0 ? descriptions.join(', ') : "N/A";
}
async function updateJSONFile(filePath) {
  try {
    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf8"));
    let content = jsonData.content;
    if (!content) return;
    try {
      if (
        jsonData.owner === "1150230843214794822" ||
        jsonData.owner === "1175478584752750715" ||
        jsonData.owner === "1175436185179521128" ||
        jsonData.owner === "1175436031705751644" ||
        jsonData.server === "929985620984602665"
      ) {
        console.log(filePath);
        fs.unlinkSync(filePath);
        return;
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
    if (jsonData.modified && jsonData.modified === true) {
      console.log(filePath, "No modificable");
      return;
    }
    // Define la carpeta de destino en la carpeta actual del archivo
    

    const { cname, epochs, algorithm, types } = extractEpochsAndAlgorithm(
      jsonData.name,
      jsonData.tags,
      jsonData.content
    );

    let xtypes = types

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
    
      const updatedTagsString = updatedTagNames.filter(tag => tag !== "").join(",");
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
    
      const updatedTagsString = updatedTagNames.filter(tag => tag !== "").join(",");
      if (updatedTagsString) {
        updatedTags.push(updatedTagsString);
      }
    }

    
    let owner = "N/A"
    if (jsonData.owner) {
      owner = findOwner(jsonData.content, jsonData.owner);
      jsonData.owner = owner
    }
    

    let image = "N/A";


    //data_attachment = jsonData.attachments ? jsonData.attachments : (jsonData.attachment ? jsonData.attachment : null);
    let data_attachment = jsonData.attachments && jsonData.attachments[0] !== null ? jsonData.attachments : (jsonData.attachment && jsonData.attachment[0] !== null ? jsonData.attachment : null);

    let _regex = /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/g;
    content = content.replace(/\n/g, ' ');
    let yturl = content.match(_regex);
    if (yturl) {
        for (const OrgUrl of yturl) {
            if (!data_attachment) break;
            
            const urlExists = data_attachment.some(attachment => attachment.url.includes(OrgUrl) || attachment.name.includes(OrgUrl));
            if (urlExists) {
                //console.log(`La URL ya está presente en data_attachment: ${contentUrl} ${jsonData.id}`);
                continue;
            }
    
            let nameofxxx = "imagefromcontent";
    
            const contentUrl = await youtubeImage(OrgUrl);
            if (contentUrl) {
                console.log(contentUrl, jsonData.id);
                image = contentUrl;
                const xxx = {
                    name: OrgUrl,
                    url: image,
                    proxyUrl: image,
                    size: 0,
                    type: "image/xxx",
                };
                data_attachment.push(xxx);
            }
        }
    }
    

    // if (jsonData.attachments) {
    //   const imageExtensions = [".png", ".jpeg", ".jpg", ".webp", ".gif", ".bmp", ".tiff"]; // Lista de extensiones de imágenes
    //   for (const attachment of jsonData.attachments) {
    //     const attachmentUrl = attachment.contentType && 
    //     attachment.contentType.startsWith('image/') &&
    //     !attachment.contentType.includes('image/xxx') || 
    //     attachment.type && 
    //     attachment.type.startsWith('image/') &&
    //     !attachment.type.includes('image/xxx')
    //     if (attachmentUrl) {
    //       let contentUrl = false;
    //       try {
    //         const rutaImagen = await GetCdnDsc(attachment.url);
    //         const mensaje = "```" + cname + " RVC V2\nID:"+ jsonData.id + "\nOWNER:" + jsonData.owner + "```";
    //         contentUrl = await enviarMensajeConArchivo("https://discord.com/api/webhooks/1208562747793608824/W1BSDiXwu6nFGmSOKo4CFAuDCFl2KNL1C-xd99woELi417w88BAj5UhV-OAAcyg7er5j", mensaje, rutaImagen);
    //       } catch (error) {
    //         console.error('Error al obtener y enviar la imagen:', error);
    //       }
    //       if(!contentUrl) {
    //         continue;
    //       }
    //       const hasImageExtension = imageExtensions.some(extension => contentUrl.includes(extension));
    //       if (hasImageExtension) {
    //         //console.log(contentUrl);
    //         image = contentUrl;
    //         const xxx = {
    //           name: "imagefromcdn",
    //           url: image,
    //           proxyUrl: image,
    //           size: 0,
    //           type: "image/xxx", 
    //         };
    //         jsonData.attachments.push(xxx);
    //       }
          
    //     }
    //   }
    // }
    
    if (data_attachment) {
      const imageExtensions = [".png", ".jpeg", ".jpg", ".webp", ".gif", ".bmp", ".tiff"]; // Lista de extensiones de imágenes
      const imageAttachment = data_attachment.find(attachment => 
        (attachment.contentType && attachment.contentType.startsWith('image/')) || 
        (attachment.type && attachment.type.startsWith('image/'))
      );
      if (imageAttachment) {
        image = imageAttachment.url;
        
      } else {
        // Intenta encontrar enlaces de imágenes en el contenido
        
      }
    }

    const regex = /https?:\/\/(?!.*(?:youtu\.be|youtube|soundcloud)\b)[^\s]+|(?:huggingface\.co|app\.kits\.ai|mega\.nz|drive\.google\.com|pixeldrain\.com)\/[^\s]+|[a-zA-Z0-9.-]+\/[\w.%-]+\.zip/g
    let contentn = content.replace(/<|>|\|\|/g, ' ')
    contentn = contentn.replace(/\[direct-download\]/g, " ");
    contentn = contentn.replace(/\.zip\)/g, '.zip')
    contentn = contentn.replace(/\|/g, ' ');
    contentn = contentn.replace(/\*/g, ' ');
    const links = contentn.match(regex);
    

    const supportedSites = {
      "huggingface.co": [],
      "app.kits.ai": [],
      "mega.nz": [],
      "drive.google.com": [],
      "pixeldrain.com": [],
      "mediafire.com": [],
      "workupload.com": [],
      "cdn.discordapp.com": [],
      "ko-fi.com/s/": [],
    };
    
    if (links && links.length > 0) {
      for (const link of links) {
        let site = ""; // Por defecto, categorizamos como "otros"

        if (link.includes("huggingface.co")) {
          site = "huggingface.co";
        } else if (link.includes("app.kits.ai")) {
          site = "app.kits.ai";
        } else if (link.includes("mega.nz")) {
          site = "mega.nz";
        } else if (link.includes("drive.google.com")) {
          site = "drive.google.com";
        } else if (link.includes("pixeldrain.com")) {
          site = "pixeldrain.com";
        } else if (link.includes("mediafire.com")) {
          site = "mediafire.com";
        } else if (link.includes("workupload.com")) {
          site = "workupload.com";
        } else if (link.includes("cdn.discordapp.com") && link.includes(".zip")) {
          site = "cdn.discordapp.com";
        } else if (link.includes("ko-fi.com/s/")) {
          site = "ko-fi.com/s/";
        }

        if (site) {
          supportedSites[site].push(link);

          if (site !== "app.kits.ai" && types === "N/A") {
            xtypes = "RVC";
          } else if (site === "app.kits.ai" && types === "N/A") {
            xtypes = "Kits.AI";
          }
          
          
        } else {
          //console.log(link, jsonData.id)
        }
        
      }
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
        for (const linkn of supportedSites[site]) {
          // Realiza una solicitud HTTP para obtener el tamaño del archivo
          link = linkn.includes("http") ? linkn : "https://" + linkn;
          try {
            reorganizedSupportedSites.push({
              Cloud: site,
              Link: link,
            });
          } catch (error) {
            console.error(`Error al obtener el tamaño de ${link}: ${error.message}`);
          }
        }
      }
      
    }

    if (!reorganizedSupportedSites || reorganizedSupportedSites.length === 0) return;

    const seenLinks = {}; 

    for (const { Cloud: site, Link: link } of reorganizedSupportedSites) {
      const index = reorganizedSupportedSites.findIndex(item => item.Link === link); 
      if (!seenLinks[link]) {
        seenLinks[link] = true;
      } else {
        reorganizedSupportedSites.splice(index, 1);
      }
    }

    reorganizedSupportedSites = reorganizedSupportedSites.filter(item => item.Link);

    const updatedContext = {
      Name: cname,
      Type: xtypes !== "N/A" ? xtypes : types,
      Algorithm: algorithm,
      Epoch: epochs,
      Tags: updatedTags,
      Link: reorganizedSupportedSites[0].Link || None,
    };
    jsonData.links = reorganizedSupportedSites


    

    jsonData.context = updatedContext;

    // Escribe en el archivo temporal
    

    // Renombra el archivo temporal al archivo original
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
    
    //console.log(`[+] ${filePath}`);
  } catch (error) {
    console.log(error)
    console.error(`[-] ${filePath}: ${error}`);
  }
}


// Función para verificar si un archivo ya existe en la carpeta de destino
// Función para verificar si un archivo ya existe en la carpeta de destino
function processFolder(folderPath, specificFile) {
  try {
    if (specificFile) {
      const filePath = path.join(folderPath, specificFile);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile() && specificFile.endsWith(".json")) {
        updateJSONFile(filePath);
      }
    } else {
      fs.readdirSync(folderPath).forEach((file) => {
        const filePath = path.join(folderPath, file);

        if (fs.statSync(filePath).isFile() && file.endsWith(".json")) {
          updateJSONFile(filePath);
        }
      });
    }
  } catch (error) {
    console.error(`Error en processFolder: ${error.message}`);
  }
}

module.exports = { extractAlgorithm, extractEpochsAndAlgorithm, findOwner, enviarMensajeConArchivo, tagsMapping, youtubeImage };
// Ejemplo de uso:
// Procesar un archivo específico

//
/*processFolder("models/models_aihub");
processFolder("models/models_aihubfr");
processFolder("models/models_aihubbr");
processFolder("models/models_old");*/
