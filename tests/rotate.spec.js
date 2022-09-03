//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
chai.use(chaiHttp);

require('dotenv').config('../.env');


// https://www.tabnine.com/code/javascript/functions/chai/Assertion/status
describe('Test /lol', () => {

  describe('Check on /rotate', () => {

    const regions = [
      "BR", "BR1", "EUN", "EUN1",
      "EUW", "EUW1", "JP", "JP1",
      "KR", "LA1", "LA2", "NA", "NA1",
      "OC", "OC1", "TR", "TR1", "RU"
    ];

    it('Parameter region is missing', (done) => {
      chai.request(server)
        .get('/lol/rotate/')
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });

    it('Region is invalid', (done) => {
      chai.request(server)
        .get('/lol/rotate/NAA')
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });

    regions.forEach(region => {
      it(`${region} is valid`, (done) => {

        chai.request(server)
          .get('/lol/rotate/' + region)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.to.be.html;
            done();
          });
      });

    });

  });
});