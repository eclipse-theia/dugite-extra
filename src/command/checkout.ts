import { git } from '../core/git'
import { ChildProcess } from 'child_process'
import { ICheckoutProgress, CheckoutProgressParser, progressProcessCallback } from '../progress'

type ProcessCallback = (process: ChildProcess) => void
export type ProgressCallback = (progress: ICheckoutProgress) => void

/**
 * Check out the given branch.
 *
 * @param repository - The repository in which the branch checkout should
 *                     take place
 *
 * @param name       - The branch name that should be checked out
 *
 * @param progressCallback - An optional function which will be invoked
 *                           with information about the current progress
 *                           of the checkout operation. When provided this
 *                           enables the '--progress' command line flag for
 *                           'git checkout'.
 */
export async function checkoutBranch(repositoryPath: string, name: string, progressCallback?: ProgressCallback): Promise<void> {
    let processCallback: ProcessCallback | undefined = undefined
    if (progressCallback) {
        const title = `Checking out branch ${name}`
        const kind = 'checkout'
        const targetBranch = name

        processCallback = progressProcessCallback(
            new CheckoutProgressParser(),
            progress => {
                if (progress.kind === 'progress') {
                    const description = progress.details.text
                    const value = progress.percent

                    progressCallback({ kind, title, description, value, targetBranch })
                }
            }
        )

        // Initial progress
        progressCallback({ kind, title, value: 0, targetBranch })
    }

    const args = processCallback
        ? ['checkout', '--progress', name, '--']
        : ['checkout', name, '--']

    await git(args, repositoryPath, 'checkoutBranch', { processCallback });
}

/** Check out the paths at HEAD. */
export async function checkoutPaths(repositoryPath: string, paths: string[]): Promise<void> {
    await git(['checkout', 'HEAD', '--', ...paths], repositoryPath, 'checkoutPaths');
}

/**
 * Reverts the state of the file to the specified one.
 *
 * @param repositoryPath the local Git clone or its FS path.
 * @param path the absolute file path that has to be checked out.
 * @param commitSHA the commit SHA to check out. If not given, `HEAD` will be checked out.
 */
export async function checkout(repositoryPath: string, path: string, commitSHA?: string): Promise<void> {

}