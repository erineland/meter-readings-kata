import * as data from './data';
import * as sqlite3 from 'sqlite3';
const SQLite = sqlite3.verbose();
import 'jest';
// jest.mock('sqlite3', () => { });
const sampleData = require('../sampleData.json');
const mockAll = jest.fn();

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
    it('reads all of the meter readings out of the database', async () => {
      const meterReadings : any = await data.getAllMeterReadings();
      expect(meterReadings.length).toEqual(sampleData.electricity.length);
    });
  });

});
