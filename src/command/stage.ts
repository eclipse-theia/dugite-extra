import * as path from 'path';
import { git, IGitExecutionOptions } from '../core/git';
import { getStatus } from './status';
import { WorkingDirectoryFileChange } from '../model/status';

/**
 * Add the given files to the index, stages the files.
 *
 * @param repository the repository path to the local Git clone.
 * @param filePaths the absolute FS path of the files to stage. If not specified, or an empty array, the it stages all changes.
 */
export async function stage(repositoryPath: string, filePaths?: string | string[], options?: IGitExecutionOptions): Promise<void> {
    const paths: string[] = [];
    if (filePaths === undefined || (Array.isArray(filePaths) && filePaths.length === 0)) {
        paths.push('.');
    } else {
        paths.push(...(Array.isArray(filePaths) ? filePaths : [filePaths]).map(f => path.relative(repositoryPath, f)));
    }
    await git(['add', ...paths], repositoryPath, 'stage', options);
}

/**
 * Removes the given files from the index. In other words, unstages the files.
 *
 * @param repository the repository path to the local Git clone.
 * @param filePaths the absolute FS path of the files to unstage. If not specified, or an empty array, is resets everything.
 * @param treeish the treeish to reset to. If not specified, then `HEAD` will be used.
 * @param where `index` to reset the index state, `working-tree` to reset the working tree but keep the index state. `all` to perform a hard reset. `all` be default.
 */
export async function unstage(
    repositoryPath: string,
    filePaths: string | string[] = [],
    treeish: string = 'HEAD',
    where: 'index' | 'working-tree' | 'all' = 'all',
    options?: IGitExecutionOptions): Promise<void> {

    const _treeish = treeish || 'HEAD';
    const _where = where || 'all';
    const branch = await git(['branch'], repositoryPath, 'branch', options);
    const args: string[] = [];
    // Detached HEAD.
    if (!branch.stdout.trim()) {
        args.push(...['rm', '--cached', '-r', '--']);
    } else {
        switch (_where) {
            case 'working-tree':
                args.push(...['checkout', '-q', '--']);
                break;
            case 'index':
                args.push(...['reset', '-q', _treeish, '--']);
                break;
            case 'all':
                args.push(...['reset', '-q', '--hard', _treeish]);
                break;
            default:
                break;
        }
    }
    if (_where !== 'all') {
        const paths: string[] = [];
        if (filePaths === undefined || (Array.isArray(filePaths) && filePaths.length === 0)) {
            paths.push('.');
        } else {
            paths.push(...(Array.isArray(filePaths) ? filePaths : [filePaths]).map(f => path.relative(repositoryPath, f)));
        }
        args.push(...paths);
    }
    await git(args, repositoryPath, 'unstage', options);
}

/**
 * Returns with a list of all staged files from the repository.
 *
 * @param repository the repository or its FS path to get the staged files from.
 */
export async function getStagedFiles(repositoryPath: string, options?: IGitExecutionOptions): Promise<WorkingDirectoryFileChange[]> {
    const status = await getStatus(repositoryPath, true, Number.MIN_SAFE_INTEGER, options);
    return status.workingDirectory.files.filter(f => f.staged);
}
