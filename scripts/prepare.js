// @ts-check
const fs = require("fs");
const glob = require("glob");
const path = require("path");
const RNW = path.resolve(
  __dirname,
  "../node_modules/react-native-web/src/exports"
);
const SRC = path.resolve(__dirname, "../src");
const srcFiles = glob.sync("**/*/index.js", {
  cwd: SRC
});
const rnwFiles = glob.sync("**/*/index.js", {
  cwd: RNW
});
const getModuleName = file => {
  return path.dirname(file);
};
const createModuleContent = name => {
  return `
import ${name} from 'react-native-web/src/exports/${name}'
export default ${name};
    `;
};
const createDirectory = name => {
  return new Promise((resolve, reject) => {
    const dir = path.join(SRC, name);
    console.log(dir);
    fs.mkdir(dir, { recursive: true }, err => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};
const writeFile = name => {
  return new Promise((resolve, reject) => {
    const filename = path.join(SRC, name, "index.js");
    const content = createModuleContent(name);
    console.log(filename, content);
    const writable = fs.createWriteStream(filename, {
      encoding: "utf-8",
      flags: "w"
    });
    writable.on("finish", resolve);
    writable.on("error", reject);
    writable.write(content);
    writable.end();
  });
};
const createJob = async name => {
  await createDirectory(name);
  await writeFile(name);
};
const srcSet = new Set();
const rnwSet = new Set();

srcFiles.forEach(file => {
  srcSet.add(getModuleName(file));
});

rnwFiles.forEach(file => {
  let moduleName = getModuleName(file);
  if (srcSet.has(moduleName) || /(IOS|Android)$/i.test(moduleName)) {
    return;
  }
  rnwSet.add(moduleName);
});

const jobs = [];

for (const name of rnwSet) {
  jobs.push(createJob(name));
}

Promise.all(jobs).then(
  () => {
    console.log("prepare done");
  },
  err => {
    console.log("prepare error", err);
  }
);
