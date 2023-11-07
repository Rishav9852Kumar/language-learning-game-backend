import { Router } from 'itty-router';
import handleRequest from './account/user.js';
import handleleaderBoardRequest from './account/leaderBoard.js';
import handleLanguageRequest from './subjects/subjectsList.js';
import handleQuizQuestionsRequest from './questions/quizQuestions.js';

// Router
const router = Router();

// User Routes
router.get('/user', (request, env) => handleRequest(request,env));
router.put('/user', (request, env) => handleRequest(request, env));
router.post('/user', (request, env) => handleRequest(request, env));
router.delete('/user', (request, env) => handleRequest(request, env));

// Leaderboard Routes
router.get('/leaderboard', (request, env) => handleleaderBoardRequest(request, env));
router.put('/leaderboard', (request, env) => handleleaderBoardRequest(request, env));
router.post('/leaderboard', (request, env) => handleleaderBoardRequest(request, env));
router.delete('/leaderboard', (request, env) => handleleaderBoardRequest(request, env));

// Language Lists Routes
router.get('/languages', (request, env) => handleLanguageRequest(request, env));
router.post('/languages', (request, env) => handleLanguageRequest(request, env));

// Quiz Questions Routes
router.get('/game/questions', (request, env) => handleQuizQuestionsRequest(request, env));
router.post('/game/questions', (request, env) => handleQuizQuestionsRequest(request, env));


router.get('/api/endpoint2', (request,env) => getLeaderboardBySubject(request));

export default {
	async fetch(request, env, ctx) {
		const result = await router.handle(request, env, ctx);

		if (!result) {
			return new Response('Invalid URL', { status: 404 });
		}

		return result;
	},
};
