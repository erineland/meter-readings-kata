import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import router from './routes';
import { config } from './config';
import { initialize } from './data';

const PORT = process.env.PORT || 3000;

export default function createServer() {
  const server = new Koa();

  server.use(bodyParser());
  server.use(router.allowedMethods());
  server.use(router.routes());

  return server;
}

if (!module.parent) {
  initialize();
  const server = createServer();
  server.listen(config.port, () => {
    console.log(`server listening on port ${config.port}`);
  });
}
