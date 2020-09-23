const fs = require('fs');
const path = require('path');

const getAllFiles = (dirPath, arrayOfFiles) => {
  const files = fs.readdirSync(dirPath);

  let _arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    const filePath = `${dirPath}/${file}`;
    const isDirectory = fs
      .statSync(filePath)
      .isDirectory();

    if (isDirectory) {
      _arrayOfFiles = getAllFiles(filePath, _arrayOfFiles);
    } else {
      _arrayOfFiles.push(path.join(dirPath, '/', file));
    }
  });

  return _arrayOfFiles;
};

module.exports = getAllFiles;
