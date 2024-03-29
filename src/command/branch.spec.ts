import * as temp from 'temp';
import * as fs from 'fs-extra';
import *  as Path from 'path';
import { expect } from 'chai';
import { createCommit } from './commit';
import { initRepository } from './test-helper';
import { git } from '../core/git';
import { listBranch, createBranch } from './branch';
import { IGitResult } from 'dugite-no-gpl';

const track = temp.track();

let path: string;

const createAndCommit = async (filename: string, message: string): Promise<void> => {
    fs.createFileSync(Path.join(path, filename));

    await git(['add', '.'], path, 'add');
    await createCommit(path, message);
}
const getCommitIds = async (repoPath: string): Promise<string[]> => {
    let log: IGitResult;
    try {
        log = await git(['log', '--pretty=%H'], repoPath, 'log');
        return log.stdout.trim().split('\n');
    } catch (e) {
        if (e.name === 'GitError' && e.result && e.result.exitCode && e.result.exitCode === 128) {
            // git log on repo with no commits throws an error
            return [];
        } else {
            throw e;
        }
    }
}

describe('branch', async () => {

    beforeEach(async () => {
        path = track.mkdirSync('branch');
        await initRepository(path);
    });

    afterEach((done: ((err: any, result: temp.Stats) => void)) => {
        track.cleanup(done);
    });

    it('no branch before first commit', async () => {
        const localBranches = await listBranch(path, 'all');
        expect(localBranches.length).to.be.equal(0);

        const currentBranch = await listBranch(path, 'current');
        expect(currentBranch).to.be.undefined;
    });

    it('only master branch after first commit', async () => {
        await createAndCommit('some-file.txt', 'first commit');

        const localBranches = await listBranch(path, 'all');
        expect(localBranches.length).to.be.equal(1);
        expect(localBranches[0].name).to.be.equal('master');

        const curretnBranch = await listBranch(path, 'current');
        expect(curretnBranch).to.not.be.undefined;
        expect(curretnBranch!.name).to.be.equal('master');
    });

    it('new branch is selected on creation if checkout is true', async () => {
        await createAndCommit('some-file.txt', 'first commit');

        const newBranch = 'branch1';
        await createBranch(path, newBranch, { checkout: true });

        const localBranches = await listBranch(path, 'all');
        expect(localBranches.length).to.be.equal(2);
        expect(localBranches[1].name).to.be.equal('master');
        expect(localBranches[0].name).to.be.equal(newBranch);

        const currentBranch = await listBranch(path, 'current');
        expect(currentBranch).to.not.be.undefined;
        expect(currentBranch!.name).to.be.equal(newBranch);
    });

    it('new branch is not selected on creation if checkout is false', async () => {
        await createAndCommit('some-file.txt', 'first commit');

        const newBranch = 'branch1';
        await createBranch(path, newBranch);

        const localBranches = await listBranch(path, 'all');
        expect(localBranches.length).to.be.equal(2);
        expect(localBranches[1].name).to.be.equal('master');
        expect(localBranches[0].name).to.be.equal(newBranch);

        const currentBranch = await listBranch(path, 'current');
        expect(currentBranch).to.not.be.undefined;
        expect(currentBranch!.name).to.be.equal('master');
    });

    it('new branch is not created until first commit', async () => {
        const newBranch = 'branch1';
        await createBranch(path, newBranch, { checkout: true });

        const localBranches = await listBranch(path, 'all');
        expect(localBranches.length).to.be.equal(0);
    });

    it('new branch is created on first commit in place of master if checkout is true', async () => {
        const newBranch = 'branch1';
        await createBranch(path, newBranch, { checkout: true });

        await createAndCommit('some-file.txt', 'first commit');

        const localBranches = await listBranch(path, 'all');
        expect(localBranches.length).to.be.equal(1);
        expect(localBranches[0].name).to.be.equal(newBranch);

        const currentBranch = await listBranch(path, 'current');
        expect(currentBranch).to.not.be.undefined;
        expect(currentBranch!.name).to.be.equal(newBranch);
    });

    it('a new branch cannot be created before master if checkout is false', async () => {
        const newBranch = 'branch1';
        try {
            await createBranch(path, newBranch);
            expect.fail('An error should have been thrown by createBranch');
        } catch (e) {
            if (e.name === 'GitError' && e.result && e.result.exitCode && e.result.exitCode === 128) {
                // git branch on repo with no commits should throw an error
            } else {
                expect.fail('createBranch failed with an unexpected error')
            }
        }
    });

    it('new branch is created on correct start point', async () => {
        await createAndCommit('some-file.txt', 'first commit');

        const commitIds = await getCommitIds(path);
        const firstCommitId = commitIds[0];

        await createAndCommit('other-text.txt', 'second commit');

        const newBranch = 'branch1';
        await createBranch(path, newBranch, { startPoint: firstCommitId, checkout: true });

        const localBranches = await listBranch(path, 'all');
        expect(localBranches.length).to.be.equal(2);

        const currentBranch = await listBranch(path, 'current');
        expect(currentBranch).to.not.be.undefined;
        expect(currentBranch!.name).to.be.equal(newBranch);

        const newCommitIds = await getCommitIds(path);
        expect(newCommitIds[0]).to.be.equal(firstCommitId);
    });

});
