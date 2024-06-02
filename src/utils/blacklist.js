const fs = require('fs');
const path = require('path');

const blacklistPath = path.join(__dirname, 'blacklist.json');

function loadBlacklist() {
  try {
    const data = fs.readFileSync(blacklistPath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    } else {
      throw err;
    }
  }
}


function saveBlacklist(blacklist) {
  fs.writeFileSync(blacklistPath, JSON.stringify(blacklist, null, 2));
}

let blacklist = loadBlacklist();

async function AddBlackList(value) {
  if (!blacklist.includes(value)) {
    blacklist.push(value);
    saveBlacklist(blacklist);
  }
}

async function RemoveBlackList(value) {
  blacklist = blacklist.filter(item => item !== value);
  saveBlacklist(blacklist);
}

function IsInBlacklist(value) {
  return blacklist.includes(value);
}

module.exports = {
  AddBlackList,
  RemoveBlackList,
  IsInBlacklist
};
