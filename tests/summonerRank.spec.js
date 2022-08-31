//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
const assert = require('assert');
let server = require('../app');
// let should = chai.should();
chai.use(chaiHttp);

require('dotenv').config();

// https://www.tabnine.com/code/javascript/functions/chai/Assertion/status
describe('Test /lol/', () => {

  describe('Check on QueryParam /rank', () => {

    it('The summoner doesn\'t exist', (done) => {
      chai.request(server)
        .get('/lol/rank?summonerName=BoheTest&region=NA1&json=1')
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });

    it('The summoner is ranked', (done) => {
      chai.request(server)
        .get('/lol/rank?summonerName=Bohe&region=NA1&json=1')
        .end((err, res) => {
          res.should.have.status(200);
          res.should.to.be.json;
          res.body.should.have.property('summoner').have.property("name");
          res.body.should.have.property('region');
          res.body.should.have.property('queues');
          done();
        });
    });

    it('The summoner is not ranked', (done) => {
      chai.request(server)
        .get('/lol/rank?summonerName=LeModoDeBohe&region=NA1&json=1')
        .end((err, res) => {
          res.should.have.status(200);
          res.should.to.be.json;
          res.body.should.have.property('summoner').have.property("name");
          res.body.should.have.property('region');
          res.body.should.have.property('queues');
          res.body.queues.should.be.a('array');
          
          assert.equal(res.body.queues.length, 0);
          // res.body.queues.length.should.be.eql(0);
          // res.body.queues.should.be.eql(0);
          done();
        });
    });

  });
});