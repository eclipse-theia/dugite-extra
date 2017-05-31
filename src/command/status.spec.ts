import * as chai from 'chai';
import { status } from './status';

const expect = chai.expect;

describe('status', () => {

    it('pass', () => {
        expect(true).to.be.true;
    });

    it('fail', function() {
        this.skip();
        expect(false).to.be.true;
    });

    it('check status', async () => {
        console.log(await status('/Users/akos.kitta/Desktop/mocha-eperm'));
    });

});