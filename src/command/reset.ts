import { git } from '../util/git';
import { RepositoryPath } from '../model/repository';

/**
 * The reset modes which are supported.
 */
export enum GitResetMode {
    Hard = <any>'--hard',
    Soft = <any>'--soft',
    Mixed = <any>'--mixed'
}

/**
 * Resets with the mode to the ref.
 * 
 * @param repositoryPath the repository path.
 * @param mode the reset mode.
 * @param ref the reference. By default, resets to `HEAD`.
 */
export async function reset(repositoryPath: RepositoryPath, mode: GitResetMode, ref: string = 'HEAD'): Promise<true> {
    await git(['reset', `${mode}`, ref, '--'], RepositoryPath.getPath(repositoryPath), 'reset');
    return true;
}

/**
 * Unstages all paths in the repository.
 * 
 * @param repositoryPath the path to the repository.
 */
export async function unstageAll(repositoryPath: RepositoryPath): Promise<true> {
    await git(['reset', '--', '.'], RepositoryPath.getPath(repositoryPath), 'unstageAll');
    return true;
}