import { connect } from '@planetscale/database';

async function handleUpdateUserScoreRequest(request, env) {
	const config = {
		host: env.DATABASE_HOST,
		username: env.DATABASE_USERNAME,
		password: env.DATABASE_PASSWORD,
		fetch: (url, init) => {
			delete init['cache'];
			return fetch(url, init);
		},
	};
	const conn = connect(config);

	try {
		const url = new URL(request.url);
		const userId = parseInt(url.searchParams.get('userId'));
		const subjectName = url.searchParams.get('language');
		const scoreParam = url.searchParams.get('score');
		let score = 0;
		let scoreParamFound = false;

		if (scoreParam !== null) {
			score = parseInt(scoreParam);
			scoreParamFound = true;
		}

		const userSubjectQuery =
			'SELECT us.ScoreId, us.SubjectScore, us.ExercisesCompleted FROM UserScores us ' +
			'INNER JOIN LanguageSubjects ls ON us.SubjectId = ls.SubjectId ' +
			'WHERE us.UserId = ? AND ls.SubjectName = ?';
		const userSubjectParams = [userId, subjectName];
		const userSubjectResult = await conn.execute(userSubjectQuery, userSubjectParams);

		if (userSubjectResult.error || userSubjectResult.rows.length === 0) {
			return new Response('User or subject not found', {
				status: 404,
				headers: {
					'Content-Type': 'text/plain',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
			});
		}

		const existingScore = userSubjectResult.rows[0].SubjectScore;
		let existingAssignmentsCompleted = userSubjectResult.rows[0].ExercisesCompleted;
		const userScoreId = userSubjectResult.rows[0].ScoreId;

		if (!scoreParamFound) {
			// Case 1: set score to 0
			score = 0;
		} else {
			// Case 2: 
			score += existingScore;
			existingAssignmentsCompleted++;
		}

		const updateUserScoreQuery = `
      UPDATE UserScores
      SET SubjectScore = ?, ExercisesCompleted = ?
      WHERE ScoreId = ?;
    `;
		const updateUserScoreParams = [score, existingAssignmentsCompleted, userScoreId];

		const updateUserScoreResult = await conn.execute(updateUserScoreQuery, updateUserScoreParams);

		if (updateUserScoreResult.error) {
			return new Response(updateUserScoreResult.error, {
				status: 500,
				headers: {
					'Content-Type': 'text/plain',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
			});
		}

		return new Response('User score updated successfully', {
			status: 200,
			headers: {
				'Content-Type': 'text-plain',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			},
		});
	} catch (error) {
		return new Response(error.message, {
			status: 500,
			headers: {
				'Content-Type': 'text-plain',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			},
		});
	}
}

export default handleUpdateUserScoreRequest;
