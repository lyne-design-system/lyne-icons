const shell = require('shelljs');
const figma = require('lyne-helper-figma-api');
const figmaIcons = require('./figmaIcons');
const writeSvgData = require('./figmaWriteSvgData');

require('dotenv')
  .config();

// general configuration
const config = {
  componentIgnorePattern: '_',
  frameIgnorePattern: '_',
  output: {
    folder: 'dist',
    infoFile: 'icons',
    subfolder: 'icons'
  },
  pagesIgnorePattern: '_'
};

(async () => {
  try {

    const apiConfig = {
      file: `https://api.figma.com/v1/files/${process.env.FIGMA_ICONS_FILE_ID}`,
      fileId: process.env.FIGMA_ICONS_FILE_ID,
      token: process.env.FIGMA_ACCESS_TOKEN
    };

    const figmaDocument = await figma.document(apiConfig.file, apiConfig.token);

    const figmaComponents = figmaDocument.components;

    const pages = figma.pages(figmaDocument, config.pagesIgnorePattern);

    console.log('SVG INFO: fetched pages');

    if (!pages || pages.length < 1) {
      throw new Error('No relevant figma pages found.');
    }

    const iconData = {
      icons: [],
      version: '0.0.0'
    };

    for await (const page of pages) {
      const frames = figma.frames(page, config.frameIgnorePattern);
      const iconsOfFrame = await figmaIcons(frames, apiConfig, page.name, config.componentIgnorePattern, figmaComponents);

      iconsOfFrame.forEach((icon) => {
        iconData.icons.push(icon);
      });
    }

    writeSvgData(iconData, config);

    console.log('-->> FIGMA SVG FILES SAVED');

    shell.exit(0);

  } catch (error) {
    console.log(error);
    shell.exit(1);
  }
})();
