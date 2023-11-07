import { connect } from '@planetscale/database';

async function handleQuizQuestionsRequest(request, env) {
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
			return handleGetQuizQuestions(request, conn);
		case 'POST':
			return handlePostQuizQuestion(request, conn);
		default:
			return new Response('Invalid request method', {
				headers: { 'content-type': 'text/plain' },
				status: 400, // Bad Request
			});
	}
}

async function handleGetQuizQuestions(request, conn) {
	try {
		const url = new URL(request.url);
		const subjectLanguage = url.searchParams.get('subjectLanguage');
		const level = url.searchParams.get('level');

		let query = 'SELECT * FROM QuizQuestions WHERE SubjectName = ?';

		if (level === 'easy') {
			query += ' AND (QuestionLevel = 1 OR QuestionLevel = 2 OR QuestionLevel = 3) ORDER BY RAND() LIMIT 10';
		} else if (level === 'medium') {
			query += ' AND (QuestionLevel = 3 OR QuestionLevel = 4) ORDER BY RAND() LIMIT 10';
		} else if (level === 'hard') {
			query += ' AND (QuestionLevel >= 3 AND QuestionLevel <= 5) ORDER BY RAND() LIMIT 10';
		} else {
			return new Response('Invalid level', {
				headers: {
					'content-type': 'text/plain',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
				status: 400, // Bad Request
			});
		}

		const questionsData = await conn.execute(query, [subjectLanguage]);

		if (questionsData.error) {
			return new Response(questionsData.error, {
				headers: {
					'content-type': 'text/plain',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
				status: 500, // Internal Server Error
			});
		}

		return new Response(JSON.stringify(questionsData.rows), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			},
		});
	} catch (error) {
		return new Response(error + '\n' + request, {
			headers: {
				'content-type': 'text/plain',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			},
			status: 500, // Internal Server Error
		});
	}
}
async function getSubjectIdBySubjectName(conn, subjectName) {
	const subjectData = await conn.execute('SELECT SubjectId FROM LanguageSubjects WHERE SubjectName = ?;', [subjectName]);
	if (subjectData.error || subjectData.rows.length === 0) {
		return null; // Subject not found
	}
	return subjectData.rows[0].SubjectId;
}
async function handlePostQuizQuestion(request, conn) {
	try {
		const url = new URL(request.url);
		const question = url.searchParams.get('question');
		const optionA = url.searchParams.get('optionA');
		const optionB = url.searchParams.get('optionB');
		const optionC = url.searchParams.get('optionC');
		const optionD = url.searchParams.get('optionD');
		const correctAnswer = url.searchParams.get('correctAnswer');
		const questionLevel = parseInt(url.searchParams.get('questionLevel'));
		const subjectName = url.searchParams.get('subjectLanguage'); // Get the subjectName

		// Get the SubjectId from LanguageSubjects based on the provided subjectName
        const subjectId = await getSubjectIdBySubjectName(conn, subjectName);
		if (!subjectId) {
			return new Response('Subject not found ' + subjectName, {
				headers: {
					'content-type': 'text/plain',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
				status: 404, // Not Found
			});
		}

		const insertResult = await conn.execute(
			'INSERT INTO QuizQuestions (Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer, QuestionLevel, SubjectId, SubjectName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
			[question, optionA, optionB, optionC, optionD, correctAnswer, questionLevel, subjectId, subjectName]
		);

		if (insertResult.error) {
			return new Response(insertResult.error, {
				headers: {
					'content-type': 'text/plain',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
				status: 500, // Internal Server Error
			});
		}

		return new Response('Question was added successfully', {
			status: 200,
			headers: {
				'content-type': 'text/plain',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			},
		});
	} catch (error) {
		return new Response(error + '\n' + request, {
			headers: {
				'content-type': 'text/plain',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			},
			status: 500, // Internal Server Error
		});
	}
}



export default handleQuizQuestionsRequest;
