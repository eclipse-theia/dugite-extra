/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
// Extracted and stripped down version of from VSCode's `git.ts`
// https://raw.githubusercontent.com/Microsoft/vscode/5553acb377ec3fd1187d717c40be2233f2603c61/extensions/git/src/git.ts

import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';

/**
 * Returns with the path of the currently available `git` executable.
 */
export function findGit(hint: string | undefined): Promise<{ path: string, version: string }> {
    const first = hint ? findSpecificGit(hint) : Promise.reject<{ path: string, version: string }>(null);

    return first.then(void 0, () => {
        switch (process.platform) {
            case 'darwin': return findGitDarwin();
            case 'win32': return findGitWin32();
            default: return findSpecificGit('git');
        }
    });
}

function promisify<R>(fn: Function): (...args: any[]) => Promise<R> {
    return (...args) => new Promise<R>((resolve, reject) => fn(...args, (err: any, r: any) => err ? reject(err) : resolve(r)));
}

function findSpecificGit(path: string): Promise<{ path: string, version: string }> {
    return new Promise<{ path: string, version: string }>((c, e) => {
        const buffers: Buffer[] = [];
        const child = cp.spawn(path, ['--version']);
        child.stdout.on('data', (b: Buffer) => buffers.push(b));
        child.on('error', e);
        child.on('exit', code => code ? e(new Error('Not found')) : c({ path, version: parseVersion(Buffer.concat(buffers).toString('utf8').trim()) }));
    });
}

function findGitDarwin(): Promise<{ path: string, version: string }> {
    return new Promise<{ path: string, version: string }>((c, e) => {
        cp.exec('which git', (err, gitPathBuffer) => {
            if (err) {
                return e('git not found');
            }

            const path = gitPathBuffer.toString().replace(/^\s+|\s+$/g, '');

            function getVersion(path: string) {
                // make sure git executes
                cp.exec('git --version', (err, stdout: Buffer) => {
                    if (err) {
                        return e('git not found');
                    }

                    return c({ path, version: parseVersion(stdout.toString('utf8').trim()) });
                });
            }

            if (path !== '/usr/bin/git') {
                return getVersion(path);
            }

            // must check if XCode is installed
            cp.exec('xcode-select -p', (err: any) => {
                if (err && err.code === 2) {
                    // git is not installed, and launching /usr/bin/git
                    // will prompt the user to install it

                    return e('git not found');
                }

                getVersion(path);
            });
        });
    });
}

function findSystemGitWin32(base: string): Promise<{ path: string, version: string }> {
    if (!base) {
        return Promise.reject<{ path: string, version: string }>('Not found');
    }

    return findSpecificGit(path.join(base, 'Git', 'cmd', 'git.exe'));
}

function findGitHubGitWin32(): Promise<{ path: string, version: string }> {
    const github = path.join(process.env['LOCALAPPDATA'], 'GitHub');
    const readdir = promisify<string[]>(fs.readdir);
    return readdir(github).then(children => {
        const git = children.filter(child => /^PortableGit/.test(child))[0];

        if (!git) {
            return Promise.reject<{ path: string, version: string }>('Not found');
        }

        return findSpecificGit(path.join(github, git, 'cmd', 'git.exe'));
    });
}

function findGitWin32(): Promise<{ path: string, version: string }> {
    return findSystemGitWin32(process.env['ProgramW6432'])
        .then(void 0, () => findSystemGitWin32(process.env['ProgramFiles(x86)']))
        .then(void 0, () => findSystemGitWin32(process.env['ProgramFiles']))
        .then(void 0, () => findSpecificGit('git'))
        .then(void 0, () => findGitHubGitWin32());
}

function parseVersion(raw: string): string {
    return raw.replace(/^git version /, '');
}