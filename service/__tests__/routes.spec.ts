import 'jest';
import * as request from 'supertest';
import * as data from '../src/data';
// import * as nock from 'nock';
import server from '../src/index';
import { config } from '../src/config';

const sampleData = require('../sampleData.json');
const serviceUrl = 'http://localhost:4000';
let instance;
describe('routes', () => {

    beforeAll(() => {
        data.initialize();
        instance = server().listen(config.port);
    });

    it('should retrieve a list of meter readings from the database', async () => {
        // Make a GET request to the /readings endpoint.
        // Use supertest to send a request to the server
        const response = await request(instance).get('/readings');
        expect(response.body.length).toBe(sampleData.electricity.length);
    });

    xit('should add a new meter reading that gets stored in the database', async done => {
        const newTestReadingToInsert = {
            "cumulative": 99999,
            "readingDate": "2017-06-11T00:00:00.000Z",
            "unit": "kWh"
        };

        try {
            const response = await request(instance).post(sampleData.electricity[0]);
        } catch (writeMeterReadingError) {
            expect(writeMeterReadingError).toBe(null);
        }

        // Read from the database and assert the meter reading was added.
        data.connection.serialize(() => {
            data.connection.all(
                'SELECT * FROM meter_reads WHERE cumulative=99999',
                (error, selectedResult) => {
                    expect(error).toBe(null);
                    expect(selectedResult).toEqual(newTestReadingToInsert);
                    done();
                }
            );
        });
    });
});
