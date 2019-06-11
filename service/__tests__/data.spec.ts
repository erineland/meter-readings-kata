import * as data from '../src/data';
import * as sqlite3 from 'sqlite3';
import 'jest';
import { read, write } from 'fs';
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
    it('reads all of the meter readings out of the database', async () => {
      const meterReadings: any = await data.getAllMeterReadings();
      expect(meterReadings.length).toEqual(sampleData.electricity.length);
    });
  });

  describe('When writing a meter reading into the database', () => {
    it('writes the provided meter reading object into the database', async done => {
      const newTestReadingToInsert = {
        "cumulative": 99999,
        "readingDate": "2017-06-11T00:00:00.000Z",
        "unit": "kWh"
      };

      try {
        await data.writeMeterReading(newTestReadingToInsert);
        data.connection.serialize(() => {
          data.connection.all(
            'SELECT * FROM meter_reads WHERE cumulative=99999',
            (error, selectedResult) => {
              expect(error).toBe(null);
              expect(selectedResult[0].cumulative)
                .toEqual(newTestReadingToInsert.cumulative);
              expect(selectedResult[0].reading_date)
                .toEqual(newTestReadingToInsert.readingDate);
              expect(selectedResult[0].unit)
                .toEqual(newTestReadingToInsert.unit);
              done();
            }
          );
        });
      } catch (writeTestError) {
        expect(writeTestError).toBe(null);
      }
    });
  });

  describe('When attempting to get the average monthly usage for each month', () => {
    it('calculates and returns the average monthly usage for all months which have a meter reading', async () => {
      try {
        const monthlyAverageUsages: any = await data.calculateMonthlyAverageUsage();
        expect(monthlyAverageUsages.length).not.toEqual(0);
      } catch (error) {
        expect(error).toBe(null);
      }
    });
  });
});
