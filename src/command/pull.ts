import { git, envForAuthentication, expectedAuthenticationErrors, GitError, IGitExecutionOptions, gitNetworkArguments } from '../util/git';
import { RepositoryPath } from '../model/repository';
import { Account } from '../model/account';
import { IPullProgress, PullProgressParser, executionOptionsWithProgress } from '../progress';

/**
 * Pull from the specified remote.
 *
 * @param repositoryPath - The repository in which the pull should take place or its FS path.
 *
 * @param remote     - The name of the remote that should be pulled from
 *
 * @param progressCallback - An optional function which will be invoked
 *                           with information about the current progress
 *                           of the pull operation. When provided this enables
 *                           the '--progress' command line flag for
 *                           'git pull'.
 */
export async function pull(repositoryPath: RepositoryPath, account: Account | undefined, remote: string, progressCallback?: (progress: IPullProgress) => void): Promise<void> {

    let opts: IGitExecutionOptions = {
        env: envForAuthentication(account),
        expectedErrors: expectedAuthenticationErrors(),
    };

    if (progressCallback) {
        const title = `Pulling ${remote}`;
        const kind = 'pull';

        opts = executionOptionsWithProgress(opts, new PullProgressParser, (progress) => {
            // In addition to progress output from the remote end and from
            // git itself, the stderr output from pull contains information
            // about ref updates. We don't need to bring those into the progress
            // stream so we'll just punt on anything we don't know about for now.
            if (progress.kind === 'context') {
                if (!progress.text.startsWith('remote: Counting objects')) {
                    return;
                }
            }

            const description = progress.kind === 'progress'
                ? progress.details.text
                : progress.text;

            const value = progress.percent;

            progressCallback({ kind, title, description, value, remote });
        })

        // Initial progress
        progressCallback({ kind, title, value: 0, remote });
    }

    const args = progressCallback
        ? [...gitNetworkArguments, 'pull', '--no-rebase', '--progress', remote]
        : [...gitNetworkArguments, 'pull', '--no-rebase', remote];

    const result = await git(args, RepositoryPath.getPath(repositoryPath), 'pull', opts);

    if (result.gitErrorDescription) {
        throw new GitError(result, args);
    }
}