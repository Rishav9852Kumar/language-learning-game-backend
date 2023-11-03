import { Router } from 'itty-router';
import { handleRequest as getUser } from './account/user.js';
import { handleRequest as putUser } from './account/putUser.js';
import { handleRequest as handleEndpoint2 } from './score/endpoint2.js';

// Router
const router = Router();

// Account
router.get('/user', (request) => getUser(request));
router.put('/user/update', (request) => putUser(request));


router.get('/api/endpoint2', (request) => handleEndpoint2(request));

export default {
  async fetch(request, env, ctx) {
    const result = await router.handle(request, env, ctx);

    if (!result) {
      return new Response('Invalid URL', { status: 404 });
    }

    return result;
  },
};