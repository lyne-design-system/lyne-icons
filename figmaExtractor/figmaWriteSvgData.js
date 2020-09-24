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
    fs.writeFileSync(`${subFolder}/${icon.name}.svg`, icon.svg);
  });

  // save info file
  fs.writeFileSync(`${outputFolder}/${config.output.infoFile}.json`, JSON.stringify(iconData));

  console.log('SVG INFO: saved svg\'s');

};
