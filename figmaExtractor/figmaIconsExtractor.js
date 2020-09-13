const shell = require('shelljs');
const figma = require('lyne-helper-figma-api');
const figmaIcons = require('./figmaIcons');
const writeSvgData = require('./figmaWriteSvgData');

require('dotenv')
  .config();

// general configuration
const config = {
  frameIgnorePattern: '***ignore***',
  output: {
    folder: 'dist',
    infoFile: 'icons',
    subfolder: 'icons'
  },
  pagesIgnorePattern: '***ignore***'
};

(async () => {
  try {

    const apiConfig = {
      file: `https://api.figma.com/v1/files/${process.env.FIGMA_ICONS_FILE_ID}`,
      fileId: process.env.FIGMA_ICONS_FILE_ID,
      token: process.env.FIGMA_ACCESS_TOKEN
    };

    const figmaDocument = await figma.document(apiConfig.file, apiConfig.token);
    const pages = figma.pages(figmaDocument, config.pagesIgnorePattern);

    if (!pages || pages.length < 1) {
      throw new Error('No relevant figma pages found.');
    }

    const frames = figma.frames(pages[0], config.frameIgnorePattern);
    const iconData = await figmaIcons(frames, apiConfig);

    writeSvgData(iconData, config);

    console.log('-->> FIGMA SVG FILES SAVED');
    shell.exit(0);

  } catch (error) {
    console.log(error);
    shell.exit(1);
  }
})();
