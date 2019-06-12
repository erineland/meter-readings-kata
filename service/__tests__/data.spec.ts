import * as data from '../src/data';
import * as sqlite3 from 'sqlite3';
import 'jest';
import { read, write } from 'fs';
const sampleData = require('../sampleData.json');

describe('data', () => {
  beforeEach(() => {
    data.initialize();
  });

  afterEach(() => {
    data.destroy();
  })

  it('initialize should import the data from the sampleData file', done => {
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
        const expectedMonthlyUsages = [
          { "month": "April", "year": "2017", "estimateEnergyUsageInKwh": 307 },
          { "month": "May", "year": "2017", "estimateEnergyUsageInKwh": 235 },
          { "month": "June", "year": "2017", "estimateEnergyUsageInKwh": 169 },
          { "month": "July", "year": "2017", "estimateEnergyUsageInKwh": 132 },
          { "month": "August", "year": "2017", "estimateEnergyUsageInKwh": 167 },
          { "month": "September", "year": "2017", "estimateEnergyUsageInKwh": 157 },
          { "month": "October", "year": "2017", "estimateEnergyUsageInKwh": 251 },
          { "month": "November", "year": "2017", "estimateEnergyUsageInKwh": 358 },
          { "month": "December", "year": "2017", "estimateEnergyUsageInKwh": 281 },
          { "month": "January", "year": "2018", "estimateEnergyUsageInKwh": 339 },
          { "month": "February", "year": "2018", "estimateEnergyUsageInKwh": 329 },
          { "month": "March", "year": "2018", "estimateEnergyUsageInKwh": 198 },
        ]
        const monthlyAverageUsages: any = await data.calculateMonthlyAverageUsage();
        expect(monthlyAverageUsages).toEqual(expectedMonthlyUsages);
      } catch (error) {
        expect(error).toBe(null);
      }
    });
  });
});
