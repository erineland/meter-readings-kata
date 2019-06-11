import * as KoaRouter from 'koa-router';
import * as data from './data';
import { continueStatement, metaProperty } from '@babel/types';
const router = new KoaRouter();

router.get('/', (ctx, next) => {
  ctx.body = 'Hello Bulb!';
  next();
});

router.get('/readings', async (ctx, next) => {
  let meterReadings;
  try {
    meterReadings = await data.getAllMeterReadings();
  } catch (getReadingsError) {
    const readingsError = new Error(`An error occurred at get '/readings': ${getReadingsError.message}`)
    ctx.status = 500;
    ctx.body = readingsError.message;
    ctx.app.emit('error', readingsError, ctx);
    next();
  }

  ctx.status = 200;
  ctx.body = meterReadings;
  next();
});

export default router;
