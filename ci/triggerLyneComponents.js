const axios = require('axios');
const shell = require('shelljs');
const argv = require('minimist');
const getCommit = require('./getTravisCommit');

require('dotenv')
  .config();

const triggerTravis = async (_commitMessage) => {
  const travisUrl = 'https://api.travis-ci.org/repo/lyne-design-system%2Flyne-components/requests';
  const travisToken = process.env.TRAVIS_TOKEN;
  const commitMessage = `${_commitMessage} (triggered from icons build)`;
  const requestHeaders = {
    'Accept': 'application/json',
    'Authorization': `token ${travisToken}`,
    'Content-Type': 'application/json',
    'Travis-API-Version': '3'
  };

  const body = {
    request: {
      message: commitMessage
    }
  }

  console.log('-->> Will trigger lyne-components job with message: ', commitMessage);

  const requestConfig = {
    data: body,
    headers: requestHeaders,
    method: 'POST',
    url: travisUrl
  };

  await axios.request(requestConfig);
};

(async () => {
  try {
    const jobId = argv(process.argv.slice(2))['i'];
    const commitMessage = await getCommit(jobId);

    await triggerTravis(commitMessage);

    shell.exit(0);
  } catch (e) {
    console.log('-->> Error while triggering travis build on lyne-components.');
    console.log(e);

    shell.exit(1);
  }
})();
