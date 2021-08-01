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
    contentFile: 'icons',
    folder: 'dist',
    infoFile: 'iconsMeta',
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

    console.log(`SVG INFO: fetched ${pages.length} pages`);

    if (!pages || pages.length < 1) {
      throw new Error('No relevant figma pages found.');
    }

    const iconMeta = {
      icons: [],
      version: '0.0.0'
    };

    const iconSvgs = {
      icons: {},
      version: '0.0.0'
    };

    for await (const page of pages) {
      const frames = figma.frames(page, config.frameIgnorePattern);
      const {
        icons,
        meta
      } = await figmaIcons(frames, apiConfig, page.name, config.componentIgnorePattern, figmaComponents);

      meta.forEach((icon) => {
        iconMeta.icons.push(icon);
      });

      Object.keys(icons)
        .forEach((key) => {
          const icon = icons[key];

          iconSvgs.icons[key] = icon;
        });
    }

    writeSvgData(iconMeta, iconSvgs, config);

    console.log('-->> FIGMA SVG FILES SAVED');

    shell.exit(0);

  } catch (error) {
    console.log(error);
    shell.exit(1);
  }
})();
