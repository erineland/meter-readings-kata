import 'jest';
import * as request from 'supertest';
import * as data from '../src/data';
import server from '../src/index';
import { config } from '../src/config';
import * as path from 'path';
import * as fs from 'fs';

const sampleData = require('../sampleData.json');
const serviceUrl = 'http://localhost:4000';
const loadMock = mockPath => {
    const pathName = path.resolve(__dirname, `./__mocks__/${mockPath}.json`);
    return fs.readFileSync(pathName, 'utf8');
};

let instance;
describe('routes', () => {
    beforeAll(() => {
        instance = server().listen(config.port);
    });

    beforeEach(() => {
        data.initialize();
    });

    afterEach(() => {
        data.destroy();
    })

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

    it('should retrieve a list of monthly average estimated usages', async () => {
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
            { "month": "February", "year": "2018", "estimateEnergyUsageInKwh": 329},
            { "month": "March", "year": "2018", "estimateEnergyUsageInKwh": 198 },
        ]

        try {
            const calculatedMonthlyUsages = await request(instance)
                .get('/estimatedmonthlyusages');

            expect(calculatedMonthlyUsages.body).toEqual(expectedMonthlyUsages);
        } catch (writeMeterReadingError) {
            expect(writeMeterReadingError).toBe(null);
        }
    });
});
