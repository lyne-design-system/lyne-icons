const fs = require('fs');
const rimraf = require('rimraf');

module.exports = (iconData, config) => {

  // make sure folder is there
  const outputFolder = `./${config.output.folder}`;

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
  }

  // delete dist folder
  rimraf.sync(outputFolder);

  // create folders
  const subFolder = `${outputFolder}/${config.output.subfolder}`;

  fs.mkdirSync(outputFolder);
  fs.mkdirSync(subFolder);

  // save icons
  iconData.icons.forEach((icon) => {
    try {
      fs.writeFileSync(`${subFolder}/${icon.fullName}.svg`, icon.svg);
    } catch (err) {
      console.log('SVG INFO: error writing file', icon.fullName);
    }
  });

  // save info file
  fs.writeFileSync(`${outputFolder}/${config.output.infoFile}.json`, JSON.stringify(iconData));

  console.log('SVG INFO: saved svg\'s');

};
