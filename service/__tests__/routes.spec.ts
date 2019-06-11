import * as Koa from 'koa';
import server from '../src/index';
import 'jest';
import request from 'supertest';
import * as nock from 'nock';

// Test the routes in this file.
const serviceUrl = 'http://localhost:3000';

describe('routes', () => {

    // afterEach(nock.cleanAll);

    it('should retrieve a list of meter readings from the database', async () => {
        const instance = server();

        // Use nock to fake the server response
        nock(serviceUrl)
            .get('/readings')
            .reply(200, [{
                message: 'from nock'
            }]);

        // Make a GET request to the /readings endpoint.
        // Use supertest to send a request to the server

        // Assert against the response.

    });

    it('should add a new meter reading that gets stored in the database', () => {

    });
});
