//During the test the env variable is set to test
// process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
const assert = require('assert');
let server = require('../app');
let should = chai.should();
chai.use(chaiHttp);

require('dotenv').config();


// describe('Array', function () {
//   describe('#indexOf()', function () {
//     it('should return -1 when the value is not present', function () {
//       assert.equal([1, 2, 3].indexOf(4), -1);
//     });
//   });
// });

// https://www.tabnine.com/code/javascript/functions/chai/Assertion/status
describe('Test /dragon', () => {

    describe('Dragon check on /version', () => {

      it('Dragon should be okay', (done) => {
        chai.request(server)
        .get('/dragon/version')
        .end((err, res) => {
              res.should.have.status(200);
              // res.should.to.be.json;
              res.text.should.be.contain("Dragon version");
              // res.body.length.should.be.eql(0);
          done();
        });

        // const actualResult = dragonCheckSync();
        // expect(actualResult).to.equal('OK');
      });

    });
  });