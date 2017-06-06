/**
 * Parse the GIT_ASKPASS prompt and determine the appropriate response.
 */
function responseForPrompt(prompt) {
  const username = process.env.DESKTOP_USERNAME
  if (!username || !username.length) {
    return undefined;
  }
  if (prompt.startsWith('Username')) {
    return Promise.resolve(username);
  } else if (prompt.startsWith('Password')) {
    const endpoint = process.env.DESKTOP_ENDPOINT;
    if (!endpoint || !endpoint.length) {
      return undefined;
    }
    const key = `GitHub - ${endpoint}`;
    return require('keytar').getPassword(key, username).then(result => {
      return result;
    });
  }
  return undefined;
}

const prompt = process.argv[2];
const response = responseForPrompt(prompt);
if (response) {
  response.then(r => {
    process.stdout.write(r);
  }).catch(e => {
    console.error('Error occurred during the authentication.', e);
  });
}
