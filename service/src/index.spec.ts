import * as Koa from 'koa';

import server from './index';
// import { expect } from 'chai';

describe('index', () => {
  it('should create an instance of a Koa server', () => {
    const instance = server();
    expect(instance).toBeInstanceOf(Koa);
  });

  it('should retrieve a list of meter readings from the database', () => {
    const instance = server();

    //Retrieve list of all readings from the databse.

    // Make a GET request to the /readings endpoint.


  });

  // it('should add a new meter reading that gets stored in the database', () => {

  // });
});
