import { git, envForAuthentication, expectedAuthenticationErrors, IGitExecutionOptions, gitNetworkArguments } from '../util/git'
import { RepositoryPath } from '../model/repository'
import { Account } from '../model/account'
import { IPushProgress, PushProgressParser, executionOptionsWithProgress } from '../progress'

/**
 * Push from the remote to the branch, optionally setting the upstream.
 * 
 * @param repositoryPath - The repository from which to push or its FS path.
 * 
 * @param account - The account to use when authenticating with the remote
 *
 * @param remote - The remote to push the specified branch to
 *
 * @param branch - The branch to push
 *
 * @param setUpstream - Whether or not to update the tracking information
 *                      of the specified branch to point to the remote.
 * 
 * @param progressCallback - An optional function which will be invoked
 *                           with information about the current progress
 *                           of the push operation. When provided this enables
 *                           the '--progress' command line flag for
 *                           'git push'.
 */
export async function push(repositoryPath: RepositoryPath, account: Account | undefined, remote: string, branch: string, setUpstream: boolean, progressCallback?: (progress: IPushProgress) => void): Promise<void> {
  const args = [
    ...gitNetworkArguments,
    'push', remote, branch,
  ];

  if (setUpstream) {
    args.push('--set-upstream');
  }

  let opts: IGitExecutionOptions = {
    env: envForAuthentication(account),
    expectedErrors: expectedAuthenticationErrors(),
  };

  if (progressCallback) {
    args.push('--progress');
    const title = `Pushing to ${remote}`;
    const kind = 'push';

    opts = executionOptionsWithProgress(opts, new PushProgressParser(), (progress) => {
      const description = progress.kind === 'progress'
        ? progress.details.text
        : progress.text;
      const value = progress.percent;

      progressCallback({ kind, title, description, value, remote, branch });
    })

    // Initial progress
    progressCallback({ kind: 'push', title, value: 0, remote, branch });
  }

  const result = await git(args, RepositoryPath.getPath(repositoryPath), 'push', opts);

  if (result.gitErrorDescription) {
    throw new Error(result.gitErrorDescription);
  }
}