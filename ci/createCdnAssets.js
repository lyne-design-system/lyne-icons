const fs = require('fs');
const shell = require('shelljs');
const argv = require('minimist');
const simpleGit = require('simple-git');
const rimraf = require('rimraf');

const {
  ncp
} = require('ncp');

require('dotenv')
  .config();

const git = simpleGit();

const config = {
  archiveFolder: 'versions',
  cdnFolder: 'cdn',
  cdnVersionsFile: 'versions.json',
  distFolder: 'dist',
  iconsFolder: 'icons',
  iconsMetaFile: 'iconsMeta.json',
  iconsSvgFile: 'icons.json'
};

const writeVersionJsonFile = (version, fileName) => {
  const infoJsonRaw = fs.readFileSync(`./${config.distFolder}/${fileName}`);
  const infoJson = JSON.parse(infoJsonRaw);

  infoJson.version = version;

  fs.writeFileSync(`./${config.distFolder}/${fileName}`, JSON.stringify(infoJson));
};

const copyFiles = (source, destination) => {
  const promise = new Promise((resolve, reject) => {
    ncp(source, destination, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });

  return promise;
};

const createVersionsFile = () => {
  const files = fs.readdirSync(`./${config.cdnFolder}/${config.archiveFolder}`);

  files.sort((a, b) => {
    const aRemoveDot = a.replace('.', 0);
    const bRemoveDot = b.replace('.', 0);
    const aInt = parseInt(aRemoveDot, 10);
    const bInt = parseInt(bRemoveDot, 10);

    if (aInt > bInt) {
      return 1;
    }

    if (aInt < bInt) {
      return -1;
    }

    return 0;
  });

  const reversed = files.reverse();

  const fileContent = {};

  reversed.forEach((file) => {
    const rootPath = `/${config.archiveFolder}/${file}`;

    fileContent[file] = {
      icons: `${rootPath}/${config.iconsFolder}/`,
      iconsFile: `${rootPath}/${config.iconsSvgFile}/`,
      infoFile: `${rootPath}/${config.iconsMetaFile}`,
      url: rootPath
    };

  });

  fs.writeFileSync(`./${config.cdnFolder}/${config.cdnVersionsFile}`, JSON.stringify(fileContent));
};

const createIndexHtmlPage = () => {
  const rawVersions = fs.readFileSync(`./${config.cdnFolder}/${config.cdnVersionsFile}`);
  const versions = JSON.parse(rawVersions);

  const html = `
  <!DOCTYPE html>
  <html lang="en" dir="ltr">
    <head>
      <meta charset="utf-8">
      <title>Lyne Icons CDN</title>
    </head>
    <body>
      <h1>CDN for Lyne Icons</h1>

      <p>Every release has a folder containing all the icons. Additionally, there is a icons.json file containing all icons as string representation along with other additonal info.</p>

      <p>There is a JSON-File containing all the versions along with the corresponding urls to the icon folders and the icons.json files: <a href="/${config.cdnVersionsFile}">versions.json</a></p>

      <h2>Directories</h2>

      <h3>Latest Release</h3>
      <p><a href="/${config.iconsFolder}">Icons folder</a></p>
      <p><a href="/${config.iconsMetaFile}">iconsMeta.json</a></p>
      <p><a href="/${config.iconsSvgFile}">icons.json</a></p>

      <h3>Versions</h3>
      <ul>
      ${Object.keys(versions)
    .map((key) => {
      const versionItem = versions[key];
      const liElem = `
      <li>
        <h4>Version ${key}</h4>
        <p>Root URL: <a href="${versionItem.url}/">${versionItem.url}/</a></p>
        <p>Icons folder: <a href="${versionItem.icons}">${versionItem.icons}</a></p>
        <p>Icons info file: <a href="${versionItem.infoFile}">${versionItem.infoFile}</a></p>
      </li>`;

      return liElem;
    })
    .join('')}
      </ul>

    </body>
  </html>
  `;

  fs.writeFileSync(`./${config.cdnFolder}/index.html`, html);
};

const createNetlifyToml = () => {
  const netlifyToml = `
[[headers]]
# Define which paths this specific [[headers]] block will cover.
for = "/*"
  [headers.values]
  Access-Control-Allow-Origin = "*"
  `;

  fs.writeFileSync(`./${config.cdnFolder}/netlify.toml`, netlifyToml);
};

(async () => {

  const args = argv(process.argv.slice(2));
  const version = args['i'];
  const cdnDir = `./${config.cdnFolder}`;
  const distDir = `./${config.distFolder}`;
  const archiveDir = `${cdnDir}/${config.archiveFolder}`;
  const versionDir = `${archiveDir}/${version}`;
  const rootIconsFolder = `${cdnDir}/${config.iconsFolder}`;

  console.log(`-->> Generate CDN Assets: version ${version}`);

  await git.checkout('master');
  await git.pull();

  // make sure cdn folder exists
  if (!fs.existsSync(cdnDir)) {
    fs.mkdirSync(cdnDir);
  }

  // make sure archive folder exists
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir);
  }

  // check if version folder already exists
  if (fs.existsSync(versionDir)) {
    console.log('-->> Generate CDN Assets: current release version already exists in archive.');
    shell.exit(0);
  }

  // create version folder
  fs.mkdirSync(versionDir);

  // write new version to icons.json and iconsMeta.json
  writeVersionJsonFile(version, config.iconsMetaFile);
  writeVersionJsonFile(version, config.iconsSvgFile);

  // delete icons folder in cdn folder
  rimraf.sync(rootIconsFolder);

  try {

    // copy files to archive version folder
    await copyFiles(distDir, versionDir);

    // copy files to cdn folder
    await copyFiles(distDir, cdnDir);

    // create versions file
    createVersionsFile();

    // create index page
    createIndexHtmlPage();

    // create netlify.toml
    createNetlifyToml();

    // add all files, commit and push
    await git.add(`${cdnDir}/*`);
    await git.add(`${distDir}/*`);
    await git.commit(`chore: add CDN assets for version ${version} [skip ci]`);
    await git.push('origin', 'master', {
      '--force': true
    });

    console.log('-->> Generate CDN Assets: generated and pushed assets to git');
  } catch (error) {
    console.log(`-->> Generate CDN Assets error: ${error}`);
  }
})();
