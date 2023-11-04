import { connect } from '@planetscale/database';

async function handleRequest(request, env) {
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
			return handleGetRequest(request, conn);
		case 'PUT':
			return handlePutRequest(request, conn);
		case 'DELETE':
			return handleDeleteRequest(request, conn);
		default:
			return new Response('Invalid request method', {
				headers: { 'content-type': 'text/plain' },
				status: 400, // Bad Request
			});
	}
}
// ok working
async function handleGetRequest(request, conn) {
	const requestBody = await request.json();
	const email = requestBody.email;
	console.log(requestBody);
	const data = await conn.execute('SELECT * FROM Users where UserEmail = ?; ',[email]);
	return new Response(JSON.stringify(data.rows), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
		},
	});
}
// done working 
async function handlePutRequest(request, conn) {
	try {
		const requestBody = await request.json();
		const newUser = {
			name: requestBody.name,
			email: requestBody.email,
			date: new Date(), //initialize date
		};
		const results = await conn.execute('INSERT INTO Users (UserName, UserEmail, RegistrationDate) VALUES (?, ?, ?);', [
			newUser.name,
			newUser.email,
			newUser.date
		]);

		const createdResponse = new Response(JSON.stringify('No of Users Added = ' + results.rowsAffected), {
			headers: { 'content-type': 'application/json' },
			status: 201, // Created
		});
		return createdResponse;
	} catch (error) {
		return new Response(error + '\n' + request, {
			headers: { 'content-type': 'text/plain' },
			status: 400, // Bad Request
		});
	}
}
// done checked
async function handleDeleteRequest(request, conn) {
	try {
		const requestBody = await request.json();
		const email = requestBody.email; // Assuming the client sends the ID of the fundraiser to delete

		// Check if the fundraiser with the given ID exists
		const userExists = await conn.execute('SELECT * FROM Users where UserEmail = ?;',[email]);

		if (userExists.rows.length === 0) {
			return new Response('User does not Exist', {
				headers: { 'content-type': 'text/plain' },
				status: 404, // Not Found
			});
		}

		// Delete the fundraiser record
		const deleteResult = await conn.execute('DELETE FROM Users WHERE userEmail = ?;', [email]);

		return new Response('User deleted', {
			headers: { 'content-type': 'text/plain' },
			status: 200, // OK
		});
	} catch (error) {
		return new Response(error + '\n' + request, {
			headers: { 'content-type': 'text/plain' },
			status: 400, // Bad Request
		});
	}
}

export default handleRequest;
