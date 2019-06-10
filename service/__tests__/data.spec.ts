import * as data from '../src/data';
import * as sqlite3 from 'sqlite3';
import 'jest';
import { read } from 'fs';
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
    describe('When the read operation is successful', () => {
      it('reads all of the meter readings out of the database', async () => {
        const meterReadings: any = await data.getAllMeterReadings();
        expect(meterReadings.length).toEqual(sampleData.electricity.length);
      });
    });

    // describe('When the read operation is unsuccessful', () => {
    //   beforeEach(() => {
    //     // sqlite3('sqlite3', () => {
    //     //   Database: () => {
    //     //     all: jest.fn((query, cb) => cb(new Error('all error'), null));
    //     //     serialize: cb => cb();
    //     //   }
    //     // });
    //   });

    //   it('Should reject the promise with an error', async () => {
    //     try {
    //       const meterReadings: any = await data.getAllMeterReadings();
    //     } catch (readError) {
    //       expect(readError.message)
    //         .toBe('An error poo when attempting to read from the database: all error');
    //     }
    //   })
    // });
  });
});
