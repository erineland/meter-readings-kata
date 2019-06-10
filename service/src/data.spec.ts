import * as data from './data';
// import * as chai from 'chai';
import * as sqlite3 from 'sqlite3';
import { jsxEmptyExpression } from '@babel/types';
// import { sinon } from 'sinon';
const SQLite = sqlite3.verbose();
// const expect = chai.expect;
const sampleData = require('../sampleData.json');

describe('data', () => {
  it('initialize should import the data from the sampleData file', done => {
    data.initialize();

    data.connection.serialize(() => {
      data.connection.all(
        'SELECT * FROM meter_reads ORDER BY cumulative',
        (error, selectResult) => {
          expect(error).to.be.null;
          expect(selectResult).to.have.length(sampleData.electricity.length);
          selectResult.forEach((row, index) => {
            expect(row.cumulative).to.equal(
              sampleData.electricity[index].cumulative
            );
          });
          done();
        }
      );
    });
  });

  describe('When reading meter readings out of the database', () => {

    describe('When an error occurs attempting to read from the database', () => {

      beforeEach(() => {
      })

      it('handles errors gracefully by logging them out', () => {
        // sinon.stub(console, 'error', () => {});
        jest.mock(SQLite.Database.prototype, 'all', (query, callback) => {
          // Immediately invoke the callback and throw an error to test error handling
          const testReadError = new Error('this is a test .all error');
          callback(testReadError, null);
        });
        data.getAllMeterReadings();
        sinon.assert.calledOnce(console.error);
      });
    })

    // it('reads all of the meter readings out of the database', done => {
    // data.connection.serialize(() => {
    //   data.connection.all(
    //     'SELECT * FROM meter_reads ORDER BY cumulative',
    //     (error, selectResult) => {
    //       expect(error).to.be.null;
    //       expect(selectResult).to.have.length(sampleData.electricity.length);
    //       selectResult.forEach((row, index) => {
    //         expect(row.cumulative).to.equal(
    //           sampleData.electricity[index].cumulative
    //         );
    //       });
    //       done();
    //     }
    //   );
    // });
    // });
  });

});
