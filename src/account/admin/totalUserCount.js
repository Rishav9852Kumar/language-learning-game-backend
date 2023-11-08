import { connect } from '@planetscale/database';

async function handleGetUsersCountRequest(request, env) {
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
		const language = url.searchParams.get('language');

		let query = `
      SELECT ls.SubjectName, COUNT(us.UserId) AS UserCount
      FROM LanguageSubjects ls
      LEFT JOIN UserScores us ON ls.SubjectId = us.SubjectId
    `;

		if (language) {
			query += `
        WHERE ls.SubjectName = ?;
      `;
		} else {
			query += `
        GROUP BY ls.SubjectName;
      `;
		}

		const queryParams = language ? [language] : [];

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

		const userCounts = result.rows;

		return new Response(JSON.stringify(userCounts), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			},
		});
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

export default handleGetUsersCountRequest;
