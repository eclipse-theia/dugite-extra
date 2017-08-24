import * as temp from 'temp';
import * as path from 'path';
import { expect } from 'chai';
import { getStatus } from './status';
import { FileStatus } from '../model/status';
import { initRepository, add, remove, modify, TEST_REPOSITORY_01 } from './test-helper';


const track = temp.track();

describe('status', async () => {

    after(async () => {
        track.cleanupSync();
    });

    it('missing', async () => {
        try {
            await getStatus({ path: '/does/not/exist' });
            throw new Error('Expected error when getting status from a non-existing repository.');
        } catch (error) {
            expect(error.message).to.be.equal('Unable to find path to repository on disk.');
        }
    });

    it('empty', async () => {
        const repositoryPath = await createRepository();
        const status = await getStatus({ path: repositoryPath });

        expect(status.workingDirectory.files).to.be.empty;
    });

    it('new', async () => {
        const repositoryPath = await createRepository();
        const filePaths = add(repositoryPath, { path: 'X.txt' })

        const status = await getStatus({ path: repositoryPath });
        const files = status.workingDirectory.files;
        expect(files).to.have.lengthOf(1);
        expect(files[0].path).to.be.equal(path.relative(repositoryPath, filePaths[0]));
        expect(files[0].status).to.be.equal(FileStatus.New);
    });

    it('deleted', async () => {
        const repositoryPath = await createRepository();
        const filePaths = remove(repositoryPath, 'A.txt');

        const status = await getStatus({ path: repositoryPath });
        const files = status.workingDirectory.files;
        expect(files).to.have.lengthOf(1);
        expect(files[0].path).to.be.equal(path.relative(repositoryPath, filePaths[0]));
        expect(files[0].status).to.be.equal(FileStatus.Deleted);
    });

    it('modified', async () => {
        const repositoryPath = await createRepository();
        const filePaths = modify(repositoryPath, { path: 'A.txt', data: 'content' });

        const status = await getStatus({ path: repositoryPath });
        const files = status.workingDirectory.files;
        expect(files).to.have.lengthOf(1);
        expect(files[0].path).to.be.equal(path.relative(repositoryPath, filePaths[0]));
        expect(files[0].status).to.be.equal(FileStatus.Modified);
    });

});

async function createRepository(name: string = 'test_repository', directoryGraph: object = TEST_REPOSITORY_01, commit: boolean = true): Promise<string> {
    return initRepository(track.mkdirSync(name), directoryGraph, commit);
}
