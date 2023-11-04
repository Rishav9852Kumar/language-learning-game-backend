import { Router } from 'itty-router';
import handleRequest from './account/user.js';
import { handleRequest as handleEndpoint2 } from './score/endpoint2.js';

// Router
const router = Router();

// Account
router.get('/user', (request, env) => handleRequest(request,env));
router.put('/user', (request, env) => handleRequest(request, env));
router.delete('/user', (request, env) => handleRequest(request, env));
router.get('/api/endpoint2', (request,env) => handleEndpoint2(request));

export default {
	async fetch(request, env, ctx) {
		const result = await router.handle(request, env, ctx);

		if (!result) {
			return new Response('Invalid URL', { status: 404 });
		}

		return result;
	},
};
