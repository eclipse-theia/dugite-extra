import { git } from '../core/git';

/** Merge the named branch into the current branch. */
export async function merge(repositoryPath: string, branch: string): Promise<void> {
    await git(['merge', branch], repositoryPath, 'merge');
}
