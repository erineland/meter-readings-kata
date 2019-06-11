import 'jest';
import * as request from 'supertest';
// import * as nock from 'nock';
import server from '../src/index';
import { config } from '../src/config';

const sampleData = require('../sampleData.json');
const serviceUrl = 'http://localhost:4000';

describe('routes', () => {

    // afterEach(nock.cleanAll);

    it('should retrieve a list of meter readings from the database', async () => {
        const instance = server().listen(config.port);

        // Use nock to fake the server response
        // nock(serviceUrl)
        //     .get('/readings')
        //     .reply(200, [{
        //         message: 'from nock'
        //     }]);

        // Make a GET request to the /readings endpoint.
        // Use supertest to send a request to the server
        const response = await request(instance).get('/readings');
        expect(response.body).toBe(sampleData);
        // Assert against the response.

    });

    it('should add a new meter reading that gets stored in the database', () => {

    });
});
