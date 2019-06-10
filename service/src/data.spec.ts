import * as data from './data';
import * as sqlite3 from 'sqlite3';
import { jsxEmptyExpression } from '@babel/types';
const SQLite = sqlite3.verbose();
const sampleData = require('../sampleData.json');

describe('data', () => {
  it('initialize should import the data from the sampleData file', done => {
    data.initialize();

    data.connection.serialize(() => {
      data.connection.all(
        'SELECT * FROM meter_reads ORDER BY cumulative',
        (error, selectResult) => {
          expect(error).toBe(null);
          expect(selectResult.length).toEqual(sampleData.electricity.length);
          selectResult.forEach((row, index) => {
            expect(row.cumulative).toEqual(
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
        SQLite.Database.all = jest.fn();
        data.getAllMeterReadings();
        // sinon.assert.calledOnce(console.error);
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
