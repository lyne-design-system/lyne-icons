[![Build Status](https://travis-ci.org/lyne-design-system/lyne-icons.svg?branch=master)](https://travis-ci.org/lyne-design-system/lyne-icons) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release) ![GitHub tag (latest SemVer)](https://img.shields.io/github/v/tag/lyne-design-system/lyne-icons?label=release)

# Lyne Icons

Automatically generate SVG Icons for the Lyne Design System based on the Figma Lyne Icon Library:
- Lyne Design System: [https://github.com/lyne-design-system](https://github.com/lyne-design-system).
- Lyne Figma Library [https://www.figma.com/file/mWknI2rC5DJmOgRO61WKai/LyneDesignSystemLibrary?node-id=2%3A2](https://www.figma.com/file/mWknI2rC5DJmOgRO61WKai/LyneDesignSystemLibrary?node-id=2%3A2)

## Installation

Install the Icons with the following command:
```bash
npm install --save-dev lyne-icons
```

## Usage

Have a look at the dist folder inside node_modules: `./node_modules/lyne-icons/dist/`. There you will find a folder containing all the icons and a json file which will list all icons with their name, id and the svg contents.

## Development

### Conventional Commits

Please follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification to make sure we can automatically determine the next release version if necessary.

### Env Variables

To test and develop the workflow on your local machine, you need to setup an `.env` file in the root directory of the project with the following content:
```bash
FIGMA_ACCESS_TOKEN=XXX
FIGMA_ICONS_FILE_ID=XXX
TRAVIS_TOKEN=XXX
```

## Deployment

The TravisCI job to build and deploy the Icons will be triggered as soon as the Figma Team Library file for the Icons got changed and published. In this case, the configured Figma Webhook will fire a request to the Express Server hosted on Heroku (https://powerful-harbor-93786.herokuapp.com/). After the Express Server has verified that the request comes from the corresponding Figma file, it will trigger the Travis build via API.

Furthermore, TravisCI is building as soon as a branch gets merged into the master branch. After successful linting, the Lyne Icons package will be published to npm. You can find the package on npm [here](https://www.npmjs.com/package/lyne-icons).

After successful build, the job for lyne-components will be triggered.
