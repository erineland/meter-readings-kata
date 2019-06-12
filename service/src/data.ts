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

          console.log(`The data in date order is: ${JSON.stringify(selectResults)}`);
          console.log(`The number of retrieved results is: ${selectResults.length}`);

          // Iterate the data from the table.
          selectResults.forEach((currentReading, index) => {
            console.log(`\n\n NEXT ITERATION: ${moment(currentReading.reading_date).format('MMMM, YYYY')}: \n`);
            console.log(`The current reading being checked is: ${JSON.stringify(currentReading)}`);

            const currentReadingDateMoment = moment(currentReading.reading_date);
            console.log(`The moment representation of the current reading's date is: ${currentReadingDateMoment.toString()}`);

            // Find the last day of the current record's month
            const endOfMonthDate = currentReadingDateMoment.endOf('month');
            console.log(`The last day of the current reading's month is: ${endOfMonthDate.toString()}`);

            const previousIndex = index - 1;
            console.log(`The previous index is: ${previousIndex}`);
            console.log(`The current index is: ${index}`);

            // Don't check previous reading if this is the first reading.
            if (previousIndex > -1) {
              // From 2nd to penultimate reading...
              const previousReading = selectResults[previousIndex];
              console.log(`The PREVIOUS meter reading is: ${JSON.stringify(previousReading)}`);

              // console.log(`The previous reading's date is: ${previousReading.reading_date}`);
              // console.log(`The current reading's date is: ${currentReading.reading_date}`);

              const noOfDaysBetweenReadings = daysBetween(
                previousReading.reading_date,
                currentReading.reading_date,
              );
              console.log(`The number of days between the current and previous reading dates is: ${noOfDaysBetweenReadings}`);

              // Find the difference in meter readings between the previous and next reading.
              console.log(`The previous meter reading in kWh is: ${previousReading.cumulative}`);
              console.log(`The current meter reading in kWh is: ${currentReading.cumulative}`);
              const energyUsedBetweenReadings = currentReading.cumulative - previousReading.cumulative;
              console.log(`The energy used in kWh between current and previous is: ${energyUsedBetweenReadings}`);

              // Find the average daily usage
              // TODO: This could be the problem area... Math.abs() ?
              const averageDailyEnergyUsage = energyUsedBetweenReadings / noOfDaysBetweenReadings;
              console.log(`The average daily energy usage is: ${averageDailyEnergyUsage}`);

              // HANDLE CASE: what if you estimate that it's higher than it actually is!!!!
              // PROBLEM: The estimate for the month was WAY HIGHER than the actual reading for the month!!!!
              // Add this edge case to how you work out the ESTIMATE.
              // (diff in usage previous -> current) / days between

              // Find the days between the current reading's reading date and end of reading's month
              console.log(`The current reading's date is: ${currentReading.reading_date}`);
              console.log(`The end of the month of the current meter reading is: ${endOfMonthDate.toISOString()}`);
              const daysToEndOfMonth = daysBetween(
                currentReading.reading_date,
                endOfMonthDate.toISOString(),
              )
              console.log(
                `The number of days from the current reading's date to the end of the month is: ${daysToEndOfMonth}`
              );

              // Find the amount of energy usage to add to the current reading, to get end of month usage
              const estimatedEnergyUsageUntilEndOfMonth =
                daysToEndOfMonth * averageDailyEnergyUsage;
              console.log(
                `The extra amount of energy estimated to be used up until the end of the month in kWh is: ${estimatedEnergyUsageUntilEndOfMonth}`
              );

              console.log(`The current meter reading in kWh is: ${currentReading.cumulative}`);
              // Now calculate the actual reading at the end of the month of the current reading.
              let endOfMonthReadingEstimate = currentReading.cumulative + estimatedEnergyUsageUntilEndOfMonth;
              console.log(`The estimated energy reading in kWh at the end of the month of the current reading is: ${endOfMonthReadingEstimate}`);

              /* EDGE CASE:
                If energy usage rate, changed dramatically between the 2 readings.
                If the ESTIMATE for the END of the current reading's month is LOWER than the previous end of month reading.
                Then AS A POSSIBLE SOLUTION, simply say 0 energy used in that month,
                as the previous month's higher estimate bill will ensure average energy is paid across the months...
              */
              const previousEstimate = endOfMonthReadingEstimates[endOfMonthReadingEstimates.length - 1];
              console.log(`The previous estimate is: ${JSON.stringify(previousEstimate)}`);
              if (previousEstimate) {
                console.log(`The endOfMonthReadingEstimate is: ${endOfMonthReadingEstimate} the previousEstimate.estimateInKwh: ${previousEstimate.estimateInKwh}`);
                if (endOfMonthReadingEstimate < previousEstimate.estimateInKwh) {
                  endOfMonthReadingEstimate = 0;
                }
              }

              // Construct an object and store the end of month estimate
              const endOfMonthEstimate = {
                month: currentReadingDateMoment.format('MMMM'),
                year: currentReadingDateMoment.format('YYYY'),
                estimateInKwh: Math.round(endOfMonthReadingEstimate),
              }
              console.log(`The end of month estimate for the current reading's month is: ${JSON.stringify(endOfMonthEstimate)}`);
              endOfMonthReadingEstimates.push(endOfMonthEstimate);
              console.log(`\n\n END OF ITERATION \n\n`);
            }
          });

          console.log(`The list of end of month estimated readings is: ${JSON.stringify(endOfMonthReadingEstimates)}`);
          // Now use the end of month readings to come up with monthly usages.
          endOfMonthReadingEstimates.forEach((endOfMonthReading, index) => {
            console.log(`index is: ${index}`);

            // handle here? if reading < estimate use reading!!!

            if (index > 0) {
              // Now calculate the monthly use, using the end of month reading estimates.
              const monthlyReadingEstimate = {
                month: endOfMonthReading.month,
                year: endOfMonthReading.year,
                estimateEnergyUsageInKwh: Math.round(endOfMonthReading.estimateInKwh - endOfMonthReadingEstimates[index - 1].estimateInKwh),
              }
              console.log(
                `The estimated energy used in the whole month of the current reading is: ${JSON.stringify(monthlyReadingEstimate)}`
              );
              monthlyReadingEstimates.push(monthlyReadingEstimate);
            }
          });

          console.log(`The list of monthly estimate usages is now: ${JSON.stringify(monthlyReadingEstimates)}`);

          resolve(monthlyReadingEstimates);
        }
      );
    });
  });
}
