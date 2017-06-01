import { git } from '../util/git'
import { RepositoryPath } from '../model/repository'

/**
 * Merge the named branch into the current branch.
 * @param repositoryPath the repository to the local clone or its FS path.
 * @param branch the branch to merge into the current one.
 */
export async function merge(repositoryPath: RepositoryPath, branch: string): Promise<void> {
    await git(['merge', branch], RepositoryPath.getPath(repositoryPath), 'merge');
}