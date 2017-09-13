import * as path from 'path';
import * as temp from 'temp';
import * as fs from 'fs';
import { expect } from 'chai';
import { stage, unstage, getStagedFiles } from './stage';
import { getStatus } from './status';
import { FileStatus } from '../model/status';
import { add, modify, remove, rename, createTestRepository } from './test-helper';

const track = temp.track();

describe('stage', async () => {

    after(async () => {
        track.cleanupSync();
    });

    describe('stage', async () => {

        it('missing', async () => {
            try {
                await stage('/does/not/exist', []);
                throw new Error('Expected error when getting status from a non-existing repository.');
            } catch (error) {
                expect(error.message).to.be.equal('Unable to find path to repository on disk.');
            }
        });

        it('new', async () => {
            const repositoryPath = await createTestRepository(track.mkdirSync());
            const filePaths = add(repositoryPath, { path: 'X.txt' });

            const beforeStatus = await getStatus(repositoryPath);
            let files = beforeStatus.workingDirectory.files;
            expect(files).to.have.lengthOf(1);
            expect(files[0].path).to.be.equal(path.relative(repositoryPath, filePaths[0]));
            expect(files[0].status).to.be.equal(FileStatus.New);
            expect(files[0].staged).to.be.false;

            await stage(repositoryPath, filePaths);
            const afterStatus = await getStatus(repositoryPath);

            files = afterStatus.workingDirectory.files;
            expect(files).to.have.lengthOf(1);
            expect(files[0].path).to.be.equal(path.relative(repositoryPath, filePaths[0]));
            expect(files[0].status).to.be.equal(FileStatus.New);
            expect(files[0].staged).to.be.true;
        });

        it('deleted', async () => {
            const repositoryPath = await createTestRepository(track.mkdirSync());
            const filePaths = remove(repositoryPath, 'A.txt');

            const beforeStatus = await getStatus(repositoryPath);
            let files = beforeStatus.workingDirectory.files;
            expect(files).to.have.lengthOf(1);
            expect(files[0].path).to.be.equal(path.relative(repositoryPath, filePaths[0]));
            expect(files[0].status).to.be.equal(FileStatus.Deleted);

            await stage(repositoryPath, filePaths);
            const afterStatus = await getStatus(repositoryPath);

            files = afterStatus.workingDirectory.files;
            expect(files).to.have.lengthOf(1);
            expect(files[0].path).to.be.equal(path.relative(repositoryPath, filePaths[0]));
            expect(files[0].status).to.be.equal(FileStatus.Deleted);
            expect(files[0].staged).to.be.true;
        });

        it('modified', async () => {
            const repositoryPath = await createTestRepository(track.mkdirSync());
            const filePaths = modify(repositoryPath, { path: 'A.txt', data: 'content' });

            const beforeStatus = await getStatus(repositoryPath);
            let files = beforeStatus.workingDirectory.files;
            expect(files).to.have.lengthOf(1);
            expect(files[0].path).to.be.equal(path.relative(repositoryPath, filePaths[0]));
            expect(files[0].status).to.be.equal(FileStatus.Modified);

            await stage(repositoryPath, filePaths);
            const afterStatus = await getStatus(repositoryPath);

            files = afterStatus.workingDirectory.files;
            expect(files).to.have.lengthOf(1);
            expect(files[0].path).to.be.equal(path.relative(repositoryPath, filePaths[0]));
            expect(files[0].status).to.be.equal(FileStatus.Modified);
            expect(files[0].staged).to.be.true;
        });

    });

    describe('getStagedFiles', async () => {

        it('missing', async () => {
            try {
                await getStagedFiles('/does/not/exist');
                throw new Error('Expected error when getting status from a non-existing repository.');
            } catch (error) {
                expect(error.message).to.be.equal('Unable to find path to repository on disk.');
            }
        });

        it('new/deleted/modified', async () => {
            const repositoryPath = await createTestRepository(track.mkdirSync());
            const toStage = [
                ...add(repositoryPath, { path: 'X.txt', data: 'X' }),
                ...remove(repositoryPath, 'A.txt'),
                ...rename(repositoryPath, { oldPath: 'B.txt', newPath: 'Y.txt' })
            ];

            await stage(repositoryPath, toStage);
            let files = await getStagedFiles(repositoryPath);
            expect(files).to.be.lengthOf(3);
            expect(files.map(f => f.path)).to.deep.equal(['A.txt', 'X.txt', 'Y.txt']);
            expect(files.map(f => f.oldPath).filter(p => p)).to.deep.equal(['B.txt']);

            await unstage(repositoryPath, toStage.filter(f => f.endsWith('A.txt')));
            files = await getStagedFiles(repositoryPath);
            expect(files).to.be.lengthOf(2);
            expect(files.map(f => f.path)).to.deep.equal(['X.txt', 'Y.txt']);
            expect(files.map(f => f.oldPath).filter(p => p)).to.deep.equal(['B.txt']);
        });

        it('modifying a staged file should result in two changes', async () => {
            const repositoryPath = await createTestRepository(track.mkdirSync('foo'));

            await stage(repositoryPath, modify(repositoryPath, { path: 'A.txt', data: 'new content' }));
            const stagedFiles = await getStagedFiles(repositoryPath);
            expect(stagedFiles).to.be.lengthOf(1);
            expect(stagedFiles.map(f => f.path)).to.deep.equal(['A.txt']);


            fs.writeFileSync(path.join(repositoryPath, 'A.txt'), 'yet another new content', 'utf8');
            expect(fs.readFileSync(path.join(repositoryPath, 'A.txt'), 'utf8')).to.be.deep.equal('yet another new content');

            const status = await getStatus(repositoryPath);
            const changedFiles = status.workingDirectory.files;
            expect(changedFiles).to.be.lengthOf(2);
            expect(changedFiles.map(f => f.path)).to.deep.equal(['A.txt', 'A.txt']);
            expect(changedFiles.map(f => f.staged).sort()).to.deep.equal([false, true]);
        });

    });

});

