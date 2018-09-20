const fs = require("fs");
const url = require("url");
const path = require("path");

var data;

function readFile() {
  return new Promise((g, b) => {
    fs.readFile(
      new url.URL(path.join("file://", __dirname, "data.json")),
      (err, out, outerr) => {
        if (err) throw err;
        g((data = JSON.parse(out.toString())));
      }
    );
  });
}
function save(newdata) {
  data = newdata;
  fs.writeFile(
    new url.URL(path.join("file://", __dirname, "data.json")),
    JSON.stringify(data),
    err => {
      if (err) throw err;
    }
  );
}

var db = {
  read: readFile,
  write: save
};
module.exports = db;
