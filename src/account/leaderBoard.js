import { connect } from '@planetscale/database';

async function handleleaderBoardRequest(request, env) {
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

	switch (request.method) {
		case 'GET':
			return handleGetLeaderboardRequest(request, conn);
		case 'DELETE':
			return handleDeleteLeaderboardRequest(request, conn);
		case 'PUT':
			return handlePutLeaderboardRequest(request, conn);
		case 'POST':
			return handlePostLeaderboardRequest(request, conn);
		default:
			return new Response('Invalid request method', {
				headers: { 'content-type': 'text/plain' },
				status: 400, // Bad Request
			});
	}
}

// Function to get SubjectId by SubjectName
async function getSubjectIdBySubjectName(conn, subjectName) {
	const subjectData = await conn.execute('SELECT SubjectId FROM LanguageSubjects WHERE SubjectName = ?;', [subjectName]);
	if (subjectData.error || subjectData.rows.length === 0) {
		return null; // Subject not found
	}
	return subjectData.rows[0].SubjectId;
}
// Function to get User's Subject details
async function getUserSubjectDetails(conn, userId, subjectId) {
	const userDetails = await conn.execute(
		'SELECT UserId, SubjectId, SubjectScore, ExercisesCompleted FROM UserScores WHERE UserId = ? AND SubjectId = ?;',
		[userId, subjectId]
	);

	if (userDetails.error) {
		throw new Error(userDetails.error); // Handle the error as per your needs
	}

	return userDetails.rows[0]; // Assuming there should be only one row for the given user and subject
}

async function handleGetLeaderboardRequest(request, conn) {
	try {
		//const subjectName = request.params.subjectName;
		const url = new URL(request.url);
		const subjectName = url.searchParams.get('subjectName');
		if (!subjectName) {
			return new Response(JSON.stringify('Subject not found ' + subjectName), {
				headers: { 'content-type': 'text/plain' },
				status: 404, // Not Found
			});
		}
		const subjectId = await getSubjectIdBySubjectName(conn, subjectName);

		if (!subjectId) {
			return new Response(JSON.stringify('Unable to load leaderboard for  ' + subjectName), {
				headers: { 'content-type': 'text/plain' },
				status: 404, // Not Found
			});
		}

		// Get leaderboard data for the specified SubjectId
		const leaderboardData = await conn.execute(
			'SELECT UserId, SubjectScore, ExercisesCompleted FROM UserScores WHERE SubjectId = ? ORDER BY SubjectScore DESC LIMIT 10;',
			[subjectId]
		);

		if (leaderboardData.error) {
			return new Response(leaderboardData.error, {
				headers: { 'content-type': 'text/plain' },
				status: 500, // Internal Server Error
			});
		}

		return new Response(JSON.stringify(leaderboardData.rows), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	} catch (error) {
		return new Response(error + '\n' + request, {
			headers: { 'content-type': 'text/plain' },
			status: 500, // Internal Server Error
		});
	}
}

// Handle Delete user request 
async function handleDeleteLeaderboardRequest(request, conn) {
	try {
		const url = new URL(request.url);
		const userId = url.searchParams.get('userId');
		const subjectId = url.searchParams.get('subjectId');

		// Check if the user's data with the given userId and subjectId exists
		const userExists = await conn.execute('SELECT * FROM UserScores WHERE UserId = ? AND SubjectId = ?;', [userId, subjectId]);

		if (userExists.rows.length === 0) {
			return new Response('User does not Exist', {
				headers: { 'content-type': 'text/plain' },
				status: 404, // Not Found
			});
		}

		// Delete the user's data
		const deleteResult = await conn.execute('DELETE FROM UserScores WHERE UserId = ? AND SubjectId = ?;', [userId, subjectId]);

		if (deleteResult.error) {
			return new Response(deleteResult.error, {
				headers: { 'content-type': 'text/plain' },
				status: 500, // Internal Server Error
			});
		}

		return new Response(JSON.stringify(deleteResult.rows), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	} catch (error) {
		return new Response(error + '\n' + request, {
			headers: { 'content-type': 'text/plain' },
			status: 500, // Internal Server Error
		});
	}
}

// handle update user scores and exercises completed for a user , subject id 
async function handlePutLeaderboardRequest(request, conn) {
	try {
		const url = new URL(request.url);
		const userId = url.searchParams.get('userId');
		const subjectId = url.searchParams.get('subjectId');
		const updatedSubjectScore = url.searchParams.get('updatedSubjectScore');
		const updatedExercisesCompleted = url.searchParams.get('updatedExercisesCompleted');

		// Check if the user's data with the given userId and subjectId exists
		const userExists = await conn.execute('SELECT * FROM UserScores WHERE UserId = ? AND SubjectId = ?;', [userId, subjectId]);

		if (userExists.rows.length === 0) {
			return new Response('User does not Exist', {
				headers: { 'content-type': 'text/plain' },
				status: 404, // Not Found
			});
		}

		// Update the user's data and get the updated row
		const updateResult = await conn.execute(
			'UPDATE UserScores SET SubjectScore = ?, ExercisesCompleted = ? WHERE UserId = ? AND SubjectId = ?;',
			[updatedSubjectScore, updatedExercisesCompleted, userId, subjectId]
		);

		if (updateResult.error) {
			return new Response(updateResult.error, {
				headers: { 'content-type': 'text/plain' },
				status: 500, // Internal Server Error
			});
		}
		// Fetch the updated user details
		const updatedData = await getUserSubjectDetails(conn, userId, subjectId);

		if (!updatedData) {
			return new Response('User details not found after update', {
				headers: { 'content-type': 'text/plain' },
				status: 500, // Internal Server Error
			});
		}
		return new Response(JSON.stringify(updatedData), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	} catch (error) {
		return new Response(error + '\n' + request, {
			headers: { 'content-type': 'text/plain' },
			status: 500, // Internal Server Error
		});
	}
}

// handle post request to add a new user, subject id to the leaderboard
async function handlePostLeaderboardRequest(request, conn) {
	try {
		const url = new URL(request.url);
		const userId = url.searchParams.get('userId');
		const subjectId = url.searchParams.get('subjectId');
		const subjectScore = url.searchParams.get('subjectScore');
		const exercisesCompleted = url.searchParams.get('exercisesCompleted');

		// Insert a new row into the UserScores table
		const insertResult = await conn.execute(
			'INSERT INTO UserScores (UserId, SubjectId, SubjectScore, ExercisesCompleted) VALUES (?, ?, ?, ?);',
			[userId, subjectId, subjectScore, exercisesCompleted]
		);

		if (insertResult.error) {
			return new Response(insertResult.error, {
				headers: { 'content-type': 'text/plain' },
				status: 500, // Internal Server Error
			});
		}
		// Fetch the updated user details
		const updatedData = await getUserSubjectDetails(conn, userId, subjectId);

		if (!updatedData) {
			return new Response('User details not found after update', {
				headers: { 'content-type': 'text/plain' },
				status: 500, // Internal Server Error
			});
		}
		return new Response(JSON.stringify(updatedData), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	} catch (error) {
		return new Response(error + '\n' + request, {
			headers: { 'content-type': 'text/plain' },
			status: 500, // Internal Server Error
		});
	}
}

export default handleleaderBoardRequest;
