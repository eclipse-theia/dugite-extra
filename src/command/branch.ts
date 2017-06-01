import { git, envForAuthentication, gitNetworkArguments } from '../util/git';
import { RepositoryPath } from '../model/repository';
import { Branch, BranchType } from '../model/branch';
import { Account } from '../model/account';

/** 
 * Create a new branch from the given start point.
 * 
 * @param repositoryPath - The repository in which to create the new branch or its FS path.
 * @param name       - The name of the new branch
 * @param startPoint - A committish string that the new branch should be based
 *                     on, or undefined if the branch should be created based
 *                     off of the current state of HEAD
 */
export async function createBranch(repositoryPath: RepositoryPath, name: string, startPoint?: string): Promise<true> {
    const args = startPoint
        ? ['branch', name, startPoint]
        : ['branch', name];

    await git(args, RepositoryPath.getPath(repositoryPath), 'createBranch');
    return true;
}

/** Rename the given branch to a new name. */
export async function renameBranch(repositoryPath: RepositoryPath, branch: Branch, newName: string): Promise<void> {
    await git(['branch', '-m', Branch.nameWithoutRemote(branch), newName], RepositoryPath.getPath(repositoryPath), 'renameBranch');
}

/**
 * Delete the branch. If the branch has a remote branch, it too will be
 * deleted.
 */
export async function deleteBranch(repositoryPath: RepositoryPath, branch: Branch, account?: Account): Promise<true> {
    if (branch.type === BranchType.Local) {
        await git(['branch', '-D', branch.name], RepositoryPath.getPath(repositoryPath), 'deleteBranch');
    }

    const remote = Branch.remote(branch);

    // If the user is not authenticated, the push is going to fail
    // Let this propagate and leave it to the caller to handle
    if (remote) {
        const args = [
            ...gitNetworkArguments,
            'push', remote, `:${Branch.nameWithoutRemote(branch)}`,
        ];

        const opts = { env: envForAuthentication(account) };
        await git(args, RepositoryPath.getPath(repositoryPath), 'deleteBranch', opts);
    }

    return true;
}