import * as path from 'path';
import { git } from '../core/git';
import { getStatus } from './status';
import { WorkingDirectoryFileChange } from '../model/status';

/**
 * Add the given files to the index, stages the files.
 *
 * @param repository the repository path to the local Git clone.
 * @param filePaths the absolute FS path of the files to stage.
 */
export async function stage(repositoryPath: string, filePaths: string | string[]): Promise<void> {
    const paths = (Array.isArray(filePaths) ? filePaths : [filePaths]).map(f => path.relative(repositoryPath, f));
    await git(['add', ...paths], repositoryPath, 'stage');
}

/**
 * Removes the given files from the index. In other words, unstages the files.
 *
 * @param repository the repository path to the local Git clone.
 * @param filePaths the absolute FS path of the files to unstage.
 */
export async function unstage(repositoryPath: string, filePaths: string | string[]): Promise<void> {
    const paths = (Array.isArray(filePaths) ? filePaths : [filePaths]).map(f => path.relative(repositoryPath, f));
    await git(['reset', '--', ...paths], repositoryPath, 'unstage');
}

/**
 * Returns with a list of all staged files from the repository.
 *
 * @param repository the repository or its FS path to get the staged files from.
 */
export async function getStagedFiles(repositoryPath: string): Promise<WorkingDirectoryFileChange[]> {
    const status = await getStatus(repositoryPath);
    return status.workingDirectory.files.filter(f => f.staged);
}