import * as sqlite3 from 'sqlite3';
const sampleData = require('../sampleData.json');

const SQLite = sqlite3.verbose();

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
