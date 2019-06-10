import * as KoaRouter from 'koa-router';

const router = new KoaRouter();

router.get('/', (ctx, next) => {
  ctx.body = 'Hello world';
  next();
});

router.get('/test', async (ctx) => {
    ctx.status = 201;
    ctx.body = 'test';
});

export default router;
