import { createExpressApp } from '../src/serverApp';

const app = createExpressApp();

export default (req: any, res: any) => {
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url === '/' ? '' : req.url);
  }
  return app(req, res);
};
