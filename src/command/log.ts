import * as Path from 'path';
import { git } from '../core/git';
import { RepositoryPath } from '../model/repository';

/**
 * Returns with an chronologically ordered array of commit SHA for the given file. The last element is the `HEAD` commit.
 *
 * @param repository the repository or the absolute FS path to the local clone.
 * @param path the absolute FS path of the file from the repository which history information has to be retrieved.
 * @param branch the branch to run the history query. Default is the currently active branch.
 */
export async function logCommitSHAs(repository: RepositoryPath, path: string, branch?: string): Promise<string[]> {
    const repositoryPath = RepositoryPath.getPath(repository);
    const result = await git(['log', '--follow', '--pretty="%h"', Path.relative(repositoryPath, path)], repositoryPath, 'logCommitSHAs');
    return result.stdout.trim().split('\n').map(sh => sh.replace(/^"(.*)"$/, '$1'));
}