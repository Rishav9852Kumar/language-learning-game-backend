import { connect } from '@planetscale/database';

async function handleLanguageRequest(request, env) {
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
			return handleGetLanguages(request, conn);
		case 'POST':
			return handlePostLanguage(request, conn);
		default:
			return new Response('Invalid request method', {
				headers: { 'content-type': 'text/plain' },
				status: 400, // Bad Request
			});
	}
}

async function handleGetLanguages(request, conn) {
	try {
		// Retrieve all languages from the LanguageSubjects table
		const languagesData = await conn.execute('SELECT * FROM LanguageSubjects ORDER BY SubjectName ASC;');

		if (languagesData.error) {
			return new Response(languagesData.error, {
				headers: {
					'content-type': 'text/plain',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
				status: 500, // Internal Server Error
			});
		}

		return new Response(JSON.stringify(languagesData.rows), {
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

async function handlePostLanguage(request, conn) {
	try {
		// const requestBody = await request.text();
		// const newLanguage = JSON.parse(requestBody);
		const url = new URL(request.url);
		const newLanguage = url.searchParams.get('newLanguage');
		if (!newLanguage) {
			return new Response('SubjectName is required', {
				headers: {
					'content-type': 'text/plain',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
				status: 400, // Bad Request
			});
		}

		// Insert a new language into the LanguageSubjects table
		const insertResult = await conn.execute('INSERT INTO LanguageSubjects (SubjectName) VALUES (?);', [newLanguage]);

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
		const languagesData = await conn.execute('SELECT * FROM LanguageSubjects;');

		if (languagesData.error) {
			return new Response(languagesData.error, {
				headers: {
					'content-type': 'text/plain',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
				status: 500, // Internal Server Error
			});
		}

		return new Response(JSON.stringify(languagesData.rows), {
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

export default handleLanguageRequest;
