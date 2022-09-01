//During the test the env variable is set to test
// process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
chai.use(chaiHttp);

require('dotenv').config();

// https://www.tabnine.com/code/javascript/functions/chai/Assertion/status
describe('Test /dragon', () => {

  describe('Dragon check on /version', () => {

    it('Dragon should be okay', (done) => {
      chai.request(server)
        .get('/dragon/version')
        .end((err, res) => {
          res.should.have.status(200);
          res.should.to.be.html;
          res.text.should.be.contain("Dragon version");
          done();
        });
    });

  });
});