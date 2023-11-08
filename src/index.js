import { Router } from 'itty-router';
import handleRequest from './account/user.js';
import handleleaderBoardRequest from './account/leaderBoard.js';
import handleLanguageRequest from './subjects/subjectsList.js';
import handleQuizQuestionsRequest from './questions/quizQuestions.js';
import handleUserScoresRequest from './account/userSubjectsLists.js'
import handleGetUsersCountRequest from './account/admin/totalUserCount.js';
import handleGetQuestionsCountRequest from './account/admin/totalQuestionsCount.js';
import handleUpdateUserScoreRequest from './account/game/userScore.js';

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

// User Subject Scores Routes
router.get('/user/languages', (request, env) => handleUserScoresRequest(request, env));
router.post('/user/languages', (request, env) => handleUserScoresRequest(request, env));
router.put('/user/languages', (request, env) => handleUserScoresRequest(request, env));
router.delete('/user/languages', (request, env) => handleUserScoresRequest(request, env));

// Admin Routes
router.get('/admin/totalUsers', (request, env) => handleGetUsersCountRequest(request, env));
router.get('/admin/totalQuestions', (request, env) => handleGetQuestionsCountRequest(request, env));

// user score Routes
router.post('/game/userScore', (request, env) => handleUpdateUserScoreRequest(request, env));

export default {
	async fetch(request, env, ctx) {
		const result = await router.handle(request, env, ctx);

		if (!result) {
			return new Response('Invalid URL', { status: 404 });
		}

		return result;
	},
};
