import * as temp from 'temp';
import * as fs from 'fs-extra';
import *  as Path from 'path';
import { expect } from 'chai';
import { createCommit } from './commit';
import { initRepository } from './test-helper';
import { git } from '../core/git';
import { listBranch, createBranch } from './branch';

const track = temp.track();

let path: string;

const createAndCommit = async(filename: string, message: string): Promise<void> =>  {
    fs.createFileSync(Path.join(path, filename));

    await git(['add', '.'], path, 'add');
    await createCommit(path, message);
}

describe('branch', async () => {

    beforeEach(async () => {
        path = track.mkdirSync('branch');
        await initRepository(path);
    });

    afterEach(async () => {
        await track.cleanup();
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

    it('new branch is selected on creation', async () => {
        await createAndCommit('some-file.txt', 'first commit');

        const newBranch = 'branch1';
        await createBranch(path, newBranch);

        const localBranches = await listBranch(path, 'all');
        expect(localBranches.length).to.be.equal(2);
        expect(localBranches[0].name).to.be.equal('master');
        expect(localBranches[1].name).to.be.equal(newBranch);

        const currentBranch = await listBranch(path, 'current');
        expect(currentBranch).to.not.be.undefined;
        expect(currentBranch!.name).to.be.equal(newBranch);
    });

    it('new branch is not created until first commit', async () => {
        const newBranch = 'branch1';
        await createBranch(path, newBranch);

        const localBranches = await listBranch(path, 'all');
        expect(localBranches.length).to.be.equal(0);
    });

    it('new branch is created on first commit in place of master', async () => {
        const newBranch = 'branch1';
        await createBranch(path, newBranch);

        await createAndCommit('some-file.txt', 'first commit');

        const localBranches = await listBranch(path, 'all');
        expect(localBranches.length).to.be.equal(1);
        expect(localBranches[0].name).to.be.equal(newBranch);

        const currentBranch = await listBranch(path, 'current');
        expect(currentBranch).to.not.be.undefined;
        expect(currentBranch!.name).to.be.equal(newBranch);
    });

});
