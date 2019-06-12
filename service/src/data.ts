import * as sqlite3 from 'sqlite3';
import * as moment from 'moment';
const sampleData = require('../sampleData.json');
const SQLite = sqlite3.verbose();

// Private utility functions go here...
function daysBetween(from, to) {
  const toDate: any = new Date(to);
  const fromDate: any = new Date(from);
  const msBetween = (toDate - fromDate) / 1000 / 60 / 60 / 24;
  return Math.floor(msBetween);
}

export const connection = new SQLite.Database(':memory:');

/**
 * Imports the data from the sampleData.json file into a `meter_reads` table.
 * The table contains three columns - cumulative, reading_date and unit.
 *
 * An example query to get all meter reads,
 *   connection.all('SELECT * FROM meter_reads', (error, data) => console.log(data));
 *
 * Note, it is an in-memory database, so the data will be reset when the
 * server restarts.
 */
export function initialize() {
  connection.serialize(() => {
    connection.run(
      'CREATE TABLE meter_reads (cumulative INTEGER, reading_date TEXT, unit TEXT)'
    );

    const { electricity } = sampleData;
    electricity.forEach(data => {
      connection.run(
        'INSERT INTO meter_reads (cumulative, reading_date, unit) VALUES (?, ?, ?)',
        [data.cumulative, data.readingDate, data.unit]
      );
    });
  });
}

export function destroy() {
  connection.serialize(() => {
    connection.run(
      'DROP TABLE meter_reads'
    );
  });
}

export function getAllMeterReadings() {
  return new Promise((resolve, reject) => {
    connection.serialize(() => {
      connection.all(
        'SELECT * FROM meter_reads ORDER BY cumulative',
        (error, readResults) => {
          if (error) {
            const readError =
              new Error(`An error occurred when attempting to read from the database: ${error.message}`);
            reject(readError);
          }

          resolve(readResults);
        }
      );
    });
  });
}

export function writeMeterReading(meterReading) {
  return new Promise((resolve, reject) => {
    try {
      connection.serialize(() => {
        connection.run(
          `INSERT INTO meter_reads (cumulative, reading_date, unit) VALUES (?, ?, ?)`,
          [meterReading.cumulative, meterReading.readingDate, meterReading.unit]
        );
        resolve();
      });
    } catch (writeError) {
      const dataWriteError = new Error(`Error at data.writeMeterReading: ${writeError.message}`);
      reject(dataWriteError);
    }
  });
}

export function calculateMonthlyAverageUsage() {
  // Retrieve all of the data from the table first, ordered by date
  return new Promise((resolve, reject) => {
    const endOfMonthReadingEstimates = [];
    const monthlyReadingEstimates = [];

    connection.serialize(() => {
      connection.all(
        'SELECT * FROM meter_reads ORDER BY reading_date ASC',
        (error, selectResults) => {
          if (error) {
            const readError =
              new Error(`An error occurred attempting to read records in data order: ${error.message}`);
            reject(readError);
          }

          // Iterate the data from the table.
          selectResults.forEach((currentActualReading, index) => {
            const currentReadingDateMoment = moment(currentActualReading.reading_date);
            console.log(`\n \n Now calculating estimate for the end of the actual reading taken on: ${currentReadingDateMoment.format('DD, MMMM, YYYY')} \n`)

            // Find the last day of the current record's month
            const endOfCurrentReadingsMonthDate = currentReadingDateMoment.endOf('month');

            const nextIndex = index + 1;

            // Don't check next reading if this is the last reading.
            if (nextIndex + 1 < selectResults.length) {
              // From 1st to penultimate reading...
              const nextActualReading = selectResults[nextIndex];
              console.log(`The next actual reading date is: ${moment(nextActualReading.reading_date).format('DD, MMMM, YYYY')}`);

              // Find the number of days between the 2 readings
              const noOfDaysBetweenReadings = daysBetween(
                currentActualReading.reading_date,
                nextActualReading.reading_date,
              );
              console.log(`The number of days between the current reading and the next is: ${noOfDaysBetweenReadings}`);

              // Find the difference in meter readings between the previous and next reading.
              const energyUsedBetweenReadings = nextActualReading.cumulative - currentActualReading.cumulative;

              // Find the average daily usage
              const averageDailyEnergyUsage = energyUsedBetweenReadings / noOfDaysBetweenReadings;

              // TODO: If reading_date is EOM, then the reading is the estimate!!!!

              // Find the days between the current reading's reading date and end of reading's month
              const daysToEndOfMonth = daysBetween(
                currentActualReading.reading_date,
                endOfCurrentReadingsMonthDate.toISOString(),
              )
              console.log(`The no of days until the end of the current reading month is: ${daysToEndOfMonth}`);

              // Find ADDITIONAL the amount of energy usage to add to the current reading, to get end of month usage
              const estimatedAdditionalUsage =
                daysToEndOfMonth * averageDailyEnergyUsage;

              // Now calculate the estimated reading at the end of the month of the current reading.
              let endOfMonthReadingEstimate = Math.round(currentActualReading.cumulative + estimatedAdditionalUsage);
              console.log(
                `The endOfMonthReadingEstimate for the month ${currentReadingDateMoment.format('MMMM, YYYY')} is: ${endOfMonthReadingEstimate}`
              )

              const endOfMonthEstimate = {
                month: currentReadingDateMoment.format('MMMM'),
                year: currentReadingDateMoment.format('YYYY'),
                estimateInKwh: Math.round(endOfMonthReadingEstimate),
              }

              console.log(`The endOfMonthEstimate is: ${JSON.stringify(endOfMonthEstimate)}`);
              endOfMonthReadingEstimates.push(endOfMonthEstimate);
            }
          });

          // Now use the end of month readings to come up with monthly usages.
          endOfMonthReadingEstimates.forEach((endOfMonthReading, index) => {
            if (index > 0) {
              // Now calculate the monthly use, using the end of month reading estimates.
              let estimateEnergyUsageInKwh;

              const currentMonthEstimate = endOfMonthReading.estimateInKwh;

              const previousMonthEstimate = endOfMonthReadingEstimates[index - 1].estimateInKwh;

              estimateEnergyUsageInKwh = Math.round(currentMonthEstimate - previousMonthEstimate);

              const monthlyReadingEstimate = {
                month: endOfMonthReading.month,
                year: endOfMonthReading.year,
                estimateEnergyUsageInKwh
              }
              monthlyReadingEstimates.push(monthlyReadingEstimate);
            }
          });

          console.info(`The monthlyReadingEstimates are: ${JSON.stringify(monthlyReadingEstimates)}`);

          resolve(monthlyReadingEstimates);
        }
      );
    });
  });
}
