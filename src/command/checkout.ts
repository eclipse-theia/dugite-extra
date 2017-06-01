import { ChildProcess } from 'child_process'
import { git } from '../util/git'
import { RepositoryPath } from '../model/repository'
import { CheckoutProgressParser, progressProcessCallback, ICheckoutProgress } from '../progress'

type ProcessCallback = (process: ChildProcess) => void
export type ProgressCallback = (progress: ICheckoutProgress) => void

/**
 * Checks out the given branch.
 *
 * @param repository The repository in which the branch checkout should take place.
 * @param name The branch name that should be checked out.
 * @param progressCallback An optional function which will be invoked with information about the current progress of the checkout operation. 
 *  When provided this enables the `--progress` command line flag for `git checkout`.
 */
export async function checkoutBranch(repositoryPath: RepositoryPath, name: string, progressCallback?: ProgressCallback): Promise<void> {

    let processCallback: ProcessCallback | undefined = undefined;

    if (progressCallback) {

        const title = `Checking out branch ${name}`;
        const kind = 'checkout';
        const targetBranch = name;

        processCallback = progressProcessCallback(new CheckoutProgressParser(), (progress) => {
            if (progress.kind === 'progress') {

                const description = progress.details.text
                const value = progress.percent

                progressCallback({ kind, title, description, value, targetBranch })
            }
        });

        // Initial progress
        progressCallback({ kind, title, value: 0, targetBranch });
    }

    const args = processCallback
        ? ['checkout', '--progress', name, '--']
        : ['checkout', name, '--'];

    const path = RepositoryPath.getPath(repositoryPath);
    await git(args, path, 'checkoutBranch', {
        processCallback,
    });

}

/**
 * Check out the paths at HEAD.
 *
 * @param repositoryPath the repository or its FS path.
 * @param paths the paths to check out.
 */
export async function checkoutPaths(repositoryPath: RepositoryPath, paths: ReadonlyArray<string>): Promise<void> {
    await git(['checkout', 'HEAD', '--', ...paths], RepositoryPath.getPath(repositoryPath), 'checkoutPaths');
}