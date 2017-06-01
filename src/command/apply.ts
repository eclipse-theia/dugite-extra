import { git } from '../util/git'
import { FileStatus, WorkingDirectoryFileChange } from '../model/status'
import { DiffType } from '../model/diff'
import { RepositoryPath } from '../model/repository'
import { getWorkingDirectoryDiff } from './diff'
import { formatPatch } from '../util/patch-formatter'

export async function applyPatchToIndex(repositoryPath: RepositoryPath, file: WorkingDirectoryFileChange): Promise<void> {

    const path = RepositoryPath.getPath(repositoryPath);
    // If the file was a rename we have to recreate that rename since we've
    // just blown away the index. Think of this block of weird looking commands
    // as running `git mv`.
    if (file.status === FileStatus.Renamed && file.oldPath) {
        // Make sure the index knows of the removed file. We could use
        // update-index --force-remove here but we're not since it's
        // possible that someone staged a rename and then recreated the
        // original file and we don't have any guarantees for in which order
        // partial stages vs full-file stages happen. By using git add the
        // worst that could happen is that we re-stage a file already staged
        // by updateIndex.
        await git(['add', '--u', '--', file.oldPath], path, 'applyPatchToIndex');

        // Figure out the blob oid of the removed file
        // <mode> SP <type> SP <object> TAB <file>
        const oldFile = await git(['ls-tree', 'HEAD', '--', file.oldPath], path, 'applyPatchToIndex');

        const [info] = oldFile.stdout.split('\t', 1);
        const [mode, , oid] = info.split(' ', 3);

        // Add the old file blob to the index under the new name
        await git(['update-index', '--add', '--cacheinfo', mode, oid, file.path], path, 'applyPatchToIndex');
    }

    const applyArgs: string[] = ['apply', '--cached', '--unidiff-zero', '--whitespace=nowarn', '-'];

    const diff = await getWorkingDirectoryDiff(path, file);

    if (diff.kind !== DiffType.Text) {
        throw new Error(`Unexpected diff result returned: '${diff.kind}'`);
    }

    const patch = await formatPatch(file, diff);
    await git(applyArgs, path, 'applyPatchToIndex', { stdin: patch });

    return Promise.resolve();
}