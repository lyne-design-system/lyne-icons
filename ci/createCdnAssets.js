const fs = require('fs');
const shell = require('shelljs');
const argv = require('minimist');
const simpleGit = require('simple-git');
const getAllFiles = require('./deepGetFilesOfFolder');
const {
  ncp
} = require('ncp');

require('dotenv')
  .config();

const git = simpleGit();

const config = {
  archiveFolder: 'versions',
  cdnFolder: 'cdn',
  distFolder: 'dist',
  iconsInfoFile: 'icons.json'
};

const writeVersionJsonFile = (version) => {
  const infoJsonRaw = fs.readFileSync(`./${config.distFolder}/${config.iconsInfoFile}`);
  const infoJson = JSON.parse(infoJsonRaw);

  infoJson.version = version;

  fs.writeFileSync(`./${config.distFolder}/${config.iconsInfoFile}`, JSON.stringify(infoJson));
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

(async () => {
  const args = argv(process.argv.slice(2));
  const version = args['i'];
  const cdnDir = `./${config.cdnFolder}`;
  const distDir = `./${config.distFolder}`;
  const archiveDir = `${cdnDir}/${config.archiveFolder}`;
  const versionDir = `${archiveDir}/${version}`;

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

  // write new version icons.json
  writeVersionJsonFile(version);

  try {
    // copy files to archive version folder
    await copyFiles(distDir, versionDir);

    // copy files to cdn folder
    await copyFiles(distDir, cdnDir);

    // commit and push files in cdn folder
    const cdnFiles = getAllFiles(cdnDir);

    await git.add(cdnFiles);
    await git.commit(`chore: add CDN assets for version ${version} [skip ci]`);
    await git.push('origin', 'master', {
      '--force': true
    });

    console.log('-->> Generate CDN Assets: generated and pushed assets to git');
  } catch (error) {
    console.log(`-->> Generate CDN Assets: ${error}`);
  }
})();
