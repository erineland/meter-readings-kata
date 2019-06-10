import * as Koa from 'koa';
import * as KoaRouter from 'koa-router';
import { initialize } from './data';

const PORT = process.env.PORT || 3000;

export default function createServer() {
  const server = new Koa();

  const router = new KoaRouter();
  router.get('/', (ctx, next) => {
    ctx.body = 'Hello world';
    next();
  });

  server.use(router.allowedMethods());
  server.use(router.routes());

  return server;
}

if (!module.parent) {
  initialize();
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`server listening on port ${PORT}`);
  });
}
