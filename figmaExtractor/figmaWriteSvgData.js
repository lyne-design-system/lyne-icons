const fs = require('fs');
const rimraf = require('rimraf');

module.exports = (iconsMeta, iconsSvg, config) => {
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
  Object.keys(iconsSvg.icons)
    .forEach((key) => {
      const icon = iconsSvg.icons[key];

      try {
        fs.writeFileSync(`${subFolder}/${key}.svg`, icon);
      } catch (err) {
        console.log('SVG INFO: error writing file', key);
      }
    });

  // save json files with svg meta and svg content
  try {
    fs.writeFileSync(`${outputFolder}/${config.output.contentFile}.json`, JSON.stringify(iconsSvg));
    fs.writeFileSync(`${outputFolder}/${config.output.infoFile}.json`, JSON.stringify(iconsMeta));
  } catch (err) {
    console.log('SVG INFO: error writing icons json file', err);
  }

  console.log('SVG INFO: saved svg\'s');

};
