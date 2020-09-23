const shell = require('shelljs');
const simpleGit = require('simple-git');
const argv = require('minimist');
const getCommit = require('./getTravisCommit');
const getAllFiles = require('./deepGetFilesOfFolder');

require('dotenv')
  .config();

const git = simpleGit();

(async () => {
  try {
    const jobId = argv(process.argv.slice(2))['i'];
    const commitMessage = await getCommit(jobId);
    const propertiesFiles = getAllFiles('./dist');

    // git add and commit. Files will be pushed during semantic-release
    await git.add(propertiesFiles);
    await git.commit(`${commitMessage} [skip ci]`);

    shell.exit(0);
  } catch (e) {
    console.log('-->> Error while committing icon files.');
    console.log(e);

    shell.exit(1);
  }
})();
