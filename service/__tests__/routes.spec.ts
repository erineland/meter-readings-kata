import 'jest';
import * as request from 'supertest';
import * as data from '../src/data';
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
        const response = await request(instance).get('/readings');
        expect(response.body.length).toBe(sampleData.electricity.length);
    });

    it('should add a new meter reading that gets stored in the database', async done => {
        const newTestReadingToInsert = {
            "cumulative": 99999,
            "readingDate": "2017-06-11T00:00:00.000Z"
        };

        try {
            await request(instance)
                .post('/recordmeterreading')
                .send(newTestReadingToInsert);

            data.connection.serialize(() => {
                data.connection.all(
                    'SELECT * FROM meter_reads WHERE cumulative=99999',
                    (error, selectedResult) => {
                        expect(error).toBe(null);
                        expect(selectedResult[0].cumulative)
                            .toEqual(newTestReadingToInsert.cumulative);
                        expect(selectedResult[0].unit)
                            .toEqual('kWh');
                        done();
                    }
                );
            });
        } catch (writeMeterReadingError) {
            expect(writeMeterReadingError).toBe(null);
        }
    });
});
