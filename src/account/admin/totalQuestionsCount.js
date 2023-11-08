import { connect } from '@planetscale/database';

async function handleGetQuestionsCountRequest(request, env) {
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
    const subjectName = url.searchParams.get('language');

    let query;
    let queryParams;

    if (subjectName) {
      query = 'SELECT COUNT(QuestionId) AS questionCount FROM QuizQuestions WHERE SubjectName = ?';
      queryParams = [subjectName];
    } else {
      query = 'SELECT SubjectName, COUNT(QuestionId) AS questionCount FROM QuizQuestions GROUP BY SubjectName';
      queryParams = [];
    }

    const result = await conn.execute(query, queryParams);

    if (result.error) {
      return new Response(result.error, {
        headers: {
          'content-type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        status: 500, // Internal Server Error
      });
    }

    if (subjectName) {
      const questionCount = result.rows[0].questionCount;
      return new Response(JSON.stringify({ subject: subjectName, totalQuestions: questionCount }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    } else {
      const questionCounts = result.rows.map((row) => ({
        subject: row.SubjectName,
        totalQuestions: row.questionCount,
      }));
      return new Response(JSON.stringify(questionCounts), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
  } catch (error) {
    return new Response(error.message, {
      headers: {
        'content-type': 'text-plain',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      status: 500, // Internal Server Error
    });
  }
}
export default handleGetQuestionsCountRequest;
