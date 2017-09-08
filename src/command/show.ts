import { relative } from 'path';
import { ChildProcess } from 'child_process'
import { git } from '../core/git'
import { RepositoryPath } from '../model/repository'

const successExitCodes = new Set([0, 1]);
const utf8Encoding: (process: ChildProcess) => void = cb => cb.stdout.setEncoding('utf8');
const binaryEncoding: (process: ChildProcess) => void = cb => cb.stdout.setEncoding('binary');

/**
 * Retrieve the text (UTF-8) contents of a file from the repository at a given
 * reference, commit, or tree.
 *
 * Returns a promise that will produce a Buffer instance containing
 * the text (UTF-8) contents of the resource or an error if the file doesn't
 * exists in the given revision.
 *
 * @param repositoryPath - The repository from where to read the file. Or the FS path to the repository.
 * @param commitish  - A commit SHA or some other identifier that ultimately dereferences to a commit/tree. `HEAD` is the `HEAD`. If empty string, shows the index state.
 * @param path       - The absolute FS path which is contained in the repository.
 */
export async function getTextContents(repository: RepositoryPath, commitish: string, path: string): Promise<Buffer> {
    const repositoryPath = RepositoryPath.getPath(repository);
    const args = ['show', `${commitish}:${relative(repositoryPath, path)}`];
    const opts = {
        successExitCodes,
        processCallback: utf8Encoding,
    };
    const blobContents = await git(args, RepositoryPath.getPath(repositoryPath), 'getTextContents', opts);
    return Buffer.from(blobContents.stdout, 'utf8');
}

/**
 * Retrieve the binary contents of a blob from the repository at a given
 * reference, commit, or tree.
 *
 * Returns a promise that will produce a Buffer instance containing
 * the binary contents of the blob or an error if the file doesn't
 * exists in the given revision.
 *
 * @param repositoryPath - The repository from where to read the blob. Or the FS path to the repository.
 * @param commitish  - A commit SHA or some other identifier that ultimately dereferences to a commit/tree. `HEAD` is the `HEAD`. If empty string, shows the index state.
 * @param path       - The absolute FS path which is contained in the repository.
 */
export async function getBlobContents(repositoryPath: RepositoryPath, commitish: string, path: string): Promise<Buffer> {
    const args = ['show', `${commitish}:${path}`];
    const opts = {
        successExitCodes,
        processCallback: binaryEncoding,
    };
    const blobContents = await git(args, RepositoryPath.getPath(repositoryPath), 'getBlobContents', opts);
    return Buffer.from(blobContents.stdout, 'binary');
}