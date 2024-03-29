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

function isEndOfMonth(mmt) {
  // startOf allows to ignore the time component
  // we call moment(mmt) because startOf and endOf mutate the momentj object.
  return moment
    .utc(mmt)
    .startOf('day')
    .isSame(
      moment
        .utc(mmt)
        .endOf('month')
        .startOf('day'),
    );
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

            // Find the last day of the current record's month
            const endOfCurrentReadingsMonthDate = currentReadingDateMoment.endOf('month');

            const nextIndex = index + 1;

            // Don't check next reading if this is the last reading.
            if (nextIndex < selectResults.length) {
              // From 1st to penultimate reading...
              const nextActualReading = selectResults[nextIndex];

              // Find the number of days between the 2 readings
              const noOfDaysBetweenReadings = daysBetween(
                currentActualReading.reading_date,
                nextActualReading.reading_date,
              );

              // Find the difference in meter readings between the previous and next reading.
              const energyUsedBetweenReadings = nextActualReading.cumulative - currentActualReading.cumulative;

              // Find the average daily usage
              const averageDailyEnergyUsage = energyUsedBetweenReadings / noOfDaysBetweenReadings;

              // TODO: If reading_date is EOM, then the reading is the estimate!!!!
              let endOfMonthReadingEstimate;
              if (isEndOfMonth(moment(currentActualReading.reading_date))) {
                endOfMonthReadingEstimate = currentActualReading.cumulative;
              } else {
                // Find the days between the current reading's reading date and end of reading's month
                const daysToEndOfMonth = daysBetween(
                  currentActualReading.reading_date,
                  endOfCurrentReadingsMonthDate.toISOString(),
                )

                // Find ADDITIONAL the amount of energy usage to add to the current reading, to get end of month usage
                const estimatedAdditionalUsage =
                  daysToEndOfMonth * averageDailyEnergyUsage;

                // Now calculate the estimated reading at the end of the month of the current reading.
                endOfMonthReadingEstimate = Math.round(currentActualReading.cumulative + estimatedAdditionalUsage);
              }

              const endOfMonthEstimate = {
                month: currentReadingDateMoment.format('MMMM'),
                year: currentReadingDateMoment.format('YYYY'),
                estimateInKwh: Math.round(endOfMonthReadingEstimate),
              }

              endOfMonthReadingEstimates.push(endOfMonthEstimate);
            }
          });


          // Now calculate the monthly use, using the end of month reading estimates.
          endOfMonthReadingEstimates.forEach((endOfMonthReading, index) => {
            if (index > 0) {
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

          resolve(monthlyReadingEstimates);
        }
      );
    });
  });
}
