//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../src/app');
let should = chai.should();
// let assert = chai.assert;
// let expect = chai.expect;
chai.use(chaiHttp);

require('dotenv').config();

// https://www.tabnine.com/code/javascript/functions/chai/Assertion/status
describe('Test /lol', () => {

  describe('Check on /summonerInfo', () => {

    it('The summoner doesn\'t exist', (done) => {
      chai.request(server)
        .get('/lol/summonerInfo/NA1/BedyApiTest')
        .end((err, res) => {
          res.should.have.status(200); // 400
          res.should.to.be.html;
          res.text.should.be.match(/^[a-zA-Z0-9 -]+$/gi);  

          done();
        });
    });

    it('The summoner exists', (done) => {
      chai.request(server)
        .get('/lol/summonerInfo/NA1/Bohe?json=1')
        .end((err, res) => {
          res.should.have.status(200);
          res.should.to.be.json;
          res.body.should.have.property('id');
          res.body.should.have.property('name');
          res.body.should.have.property('summonerLevel');
          done();
        });
    });

  });
});