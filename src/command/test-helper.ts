import * as path from 'path';
import * as fs from 'fs-extra';
import { git, IGitResult } from '../core/git';
import { RepositoryPath } from '../model/repository';

const sync = require('klaw-sync');
type Entry = { path: string };

const defaultFixturesPath = path.join(__dirname, '..', '..', 'resources', 'fixtures');

/**
 * Initializes a new Git repository to the destination folder.
 * @param path the desired destination folder for the new Git repository.
 */
export async function initRepository(path: string): Promise<IGitResult> {
    return git(['init'], path, 'init');
}

/**
 * Creates a new Git fixture repository for testing. Returns with the path to the test repository.
 *
 * @param repositoryName the name of the Git repository from `test-resources/fixtures` to setup for testing.
 * @param destinationPath the destination FS path where the repository will be created.
 * @param fixturesPath the the FS path to the fixtures folder. If not given, the `../../resources/fixtures`.
 */
export function setupRepository(repositoryName: string, destinationRoot: string, fixturesPath?: string): string {
    const repositoryPath = path.join(fixturesPath || defaultFixturesPath, repositoryName);
    if (!fs.existsSync(repositoryPath)) {
        throw new Error(`No fixture repository exists under '${fixturesPath}' with name '${repositoryName}'.`);
    }

    const destinationPath = path.join(destinationRoot, repositoryName);
    fs.mkdirpSync(destinationPath);
    fs.copySync(repositoryPath, destinationPath);
    fs.renameSync(
        path.join(destinationPath, '_git'),
        path.join(destinationPath, '.git')
    );

    const ignoreHiddenFiles = (item: Entry) => {
        const basename = path.basename(item.path);
        return basename === '.' || basename[0] !== '.';
    };

    const entries: ReadonlyArray<Entry> = sync(destinationPath);
    const visiblePaths = entries.filter(ignoreHiddenFiles);
    const subModules = visiblePaths.filter(
        entry => path.basename(entry.path) === '_git'
    );

    subModules.forEach(entry => {
        const directory = path.dirname(entry.path);
        const newPath = path.join(directory, '.git');
        fs.renameSync(entry.path, newPath);
    });

    return destinationPath;
}

export function remove(repositoryPath: string | RepositoryPath, filesToDelete: string | string[]): string[] {
    const repoPath = typeof repositoryPath === 'string' ? repositoryPath : RepositoryPath.getPath(repositoryPath);
    const files = (Array.isArray(filesToDelete) ? filesToDelete : [filesToDelete]).map(f => path.join(repoPath, f));
    for (const f of files) {
        if (!fs.existsSync(f)) {
            throw new Error(`Cannot delete file ${f}, it does not exist.`);
        }
        if (!fs.statSync(f).isFile()) {
            throw new Error(`Only files can be deleted, directories not: ${f}.`);
        }
        fs.unlinkSync(f);
        if (fs.existsSync(f)) {
            throw new Error(`Cannot delete file: ${f}.`);
        }
    }
    return files;
}

export function add(repositoryPath: string | RepositoryPath, filesToCreate: { path: string, data?: string } | { path: string, data?: string }[]): string[] {
    const repoPath = typeof repositoryPath === 'string' ? repositoryPath : RepositoryPath.getPath(repositoryPath);
    const files = (Array.isArray(filesToCreate) ? filesToCreate : [filesToCreate]).map(f => {
        return { path: path.join(repoPath, f.path), data: f.data || '' }
    });
    for (const f of files) {
        if (fs.existsSync(f.path)) {
            throw new Error(`File ${f.path}, already exists.`);
        }
        fs.writeFileSync(f.path, f.data);
        if (!fs.existsSync(f.path)) {
            throw new Error(`Cannot create new file: ${f.path}.`);
        }
    }
    return files.map(f => f.path);
}

export function modify(repositoryPath: string | RepositoryPath, filesToModify: { path: string, data: string } | { path: string, data: string }[]): string[] {
    const repoPath = typeof repositoryPath === 'string' ? repositoryPath : RepositoryPath.getPath(repositoryPath);
    const files = (Array.isArray(filesToModify) ? filesToModify : [filesToModify]).map(f => {
        return { path: path.join(repoPath, f.path), data: f.data }
    });
    for (const f of files) {
        if (!fs.existsSync(f.path)) {
            throw new Error(`Cannot modify the content of the file ${f.path}, it does not exist.`);
        }
        if (!fs.statSync(f.path).isFile()) {
            throw new Error(`Only files can be modified, directories not: ${f.path}.`);
        }
        fs.writeFileSync(f.path, f.data);
        if (!fs.existsSync(f.path) || fs.readFileSync(f.path, 'utf-8') !== f.data) {
            throw new Error(`Cannot modify the file content file: ${f.path}.`);
        }
    }
    return files.map(f => f.path);
}

export function rename(repositoryPath: string | RepositoryPath, filesToRename: { oldPath: string, newPath: string } | { oldPath: string, newPath: string }[]): string[] {
    const repoPath = typeof repositoryPath === 'string' ? repositoryPath : RepositoryPath.getPath(repositoryPath);
    const files = (Array.isArray(filesToRename) ? filesToRename : [filesToRename]).map(f => {
        return { oldPath: path.join(repoPath, f.oldPath), newPath: path.join(repoPath, f.newPath) }
    });
    for (const f of files) {
        if (!fs.existsSync(f.oldPath)) {
            throw new Error(`Cannot rename the file ${f.oldPath}, it does not exist.`);
        }
        if (fs.existsSync(f.newPath)) {
            throw new Error(`Cannot rename the file ${f.oldPath}, a file already exists in the destination: ${f.newPath}.`);
        }
        if (!fs.statSync(f.oldPath).isFile()) {
            throw new Error(`Only files can be renamed, directories not: ${f.oldPath}.`);
        }
        fs.renameSync(f.oldPath, f.newPath);
        if (!fs.existsSync(f.newPath) || fs.existsSync(f.oldPath)) {
            throw new Error(`Cannot rename file: ${f.oldPath} -> ${f.newPath}.`);
        }
    }
    return [...files.map(f => f.oldPath), ...files.map(f => f.newPath)];
}
