import * as KoaRouter from 'koa-router';

const router = new KoaRouter();

router.get('/', (ctx, next) => {
  ctx.body = 'Hello Bulb!';
  next();
});

router.get('/readings', async (ctx, next) => {
    // Make a call to the database

    // Have success and error handling

    ctx.status = 201;
    ctx.body = 'test';
    next();
});

export default router;
