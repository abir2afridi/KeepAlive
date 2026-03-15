import app from '../app.js';

export default async function handler(req: any, res: any) {
  // Handle the request with Express app
  return new Promise((resolve, reject) => {
    app(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}
