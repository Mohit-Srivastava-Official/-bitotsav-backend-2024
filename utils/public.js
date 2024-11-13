const dotenv = require("dotenv");
dotenv.config();

const fs = require("fs");
const path = require("path");
let base;
if (process.env.USE_TMP == "true") {
  base = '/tmp';
} else {
  base = 'public';
}
const getPath = (folder) => path.join(base, folder);

const cat = getPath("category");
const ev = getPath("event");
const qr = getPath("qr");
const club = getPath("club");

const createFolder = (path) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
};

exports.ensurePublicFolder = () => {
  createFolder(base);
  createFolder(cat);
  createFolder(ev);
  createFolder(qr);
  createFolder(club);
};
exports.base = base;
