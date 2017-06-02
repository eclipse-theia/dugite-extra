import * as chai from 'chai';
import * as temp from 'temp';
import { clone } from './clone';
import { status } from './status';

const expect = chai.expect;
const track = temp.track();

describe('command/clone', () => {

    after(() => {
        track.cleanupSync();
    });

    it('clone existing public repository', async () => {
        const path = track.mkdirSync();
        const url = 'https://github.com/TypeFox/dugite-extra';
        await clone(url, path);
        const result = await status(path);
        return expect(result).to.be.not.undefined;
    });

});