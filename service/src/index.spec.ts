import * as Koa from 'koa';

import server from './index';
import { expect } from 'chai';

describe('index', () => {
  it('should create an instance of a Koa server', () => {
    const instance = server();
    expect(instance).to.be.instanceof(Koa);
  });

  it('should retrieve a list of meter readings from the database', () => {
    const instance = server();
    expect(instance).to.be.instanceof();
  });
});
