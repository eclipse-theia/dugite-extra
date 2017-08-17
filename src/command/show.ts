import { ChildProcess } from 'child_process'
import { git } from '../core/git'
import { RepositoryPath } from '../model/repository'

/**
 * Retrieve the binary contents of a blob from the repository at a given
 * reference, commit, or tree.
 *
 * Returns a promise that will produce a Buffer instance containing
 * the binary contents of the blob or an error if the file doesn't
 * exists in the given revision.
 *
 * @param repositoryPath - The repository from where to read the blob. Or the FS path to the repository.
 *
 * @param commitish  - A commit SHA or some other identifier that
 *                     ultimately dereferences to a commit/tree.
 *
 * @param path       - The file path, relative to the repository
 *                     root from where to read the blob contents
 */
export async function getBlobContents(repositoryPath: RepositoryPath, commitish: string, path: string): Promise<Buffer> {
    const successExitCodes = new Set([0, 1]);
    const setBinaryEncoding: (process: ChildProcess) => void = cb => cb.stdout.setEncoding('binary');
    const args = ['show', `${commitish}:${path}`];
    const opts = {
        successExitCodes,
        processCallback: setBinaryEncoding,
    };
    const blobContents = await git(args, RepositoryPath.getPath(repositoryPath), 'getBlobContents', opts);
    return Buffer.from(blobContents.stdout, 'binary');
}