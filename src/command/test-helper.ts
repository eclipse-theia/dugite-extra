import * as path from 'path';
import * as fs from 'fs-extra';
import { git } from '../core/git';
import { RepositoryPath } from '../model/repository';
const jsodDir = require('jsondir');

/**
 * Initializes a new Git repository to the destination folder. On demand, creates the desired folder structure and commits the changes.
 *
 * @param path the desired destination folder for the new Git repository.
 * @param directoryGraph a JSON object that describes the desired Git repository structure. For more details check: https://github.com/dwieeb/node-jsondir#simple-examples
 * @param commit `true` if the directory structure has to be committed.
 */
export async function initRepository(path: string, directoryGraph?: object, commit?: boolean): Promise<string> {
    if ((await git(['init'], path, 'init')).exitCode !== 0) {
        throw new Error(`Error while initializing a repository under ${path}.`);
    }
    if (directoryGraph) {
        (<any>directoryGraph)['-path'] = path;
        await new Promise<void>((resolve, reject) => {
            jsodDir.json2dir(directoryGraph, (error: any) => { error ? reject(error) : resolve() });
        });
        if (commit) {
            if ((await git(['add', '.'], path, 'add')).exitCode !== 0) {
                throw new Error(`Error while staging changes into the repository.`);
            }
            if ((await git(['commit', '-F', '-'], path, 'createCommit', { stdin: 'Initial commit.' })).exitCode !== 0) {
                throw new Error(`Error while committing changes into the repository`);
            }
        }
    }
    return path;
}

export const TEST_REPOSITORY_01 = {
    "A.txt": {
        "-content": 'A'
    },
    "B.txt": {
        "-content": 'B'
    },
    "folder": {
        "C.txt": {
            "-content": 'C'
        }
    }
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
