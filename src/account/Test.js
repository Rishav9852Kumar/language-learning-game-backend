import { ps_connection } from '../../db_helper/ps_connection';

export const getUserQuery = async (env, email) => {
	const errors = new CustomError();
	const connection = ps_connection(env); // Establish a database connection

	// SQL query to retrieve user data by email
	const query = 'SELECT * FROM Users WHERE UserEmail = ?';
	const queryParams = [email];

	try {
		const userData = (await connection.execute(query, queryParams)).rows[0];

		if (!userData) {
			errors.handleCustomError('User not found', 404); // Handle custom error when the user is not found
		}

		return userData;
	} catch (error) {
		errors.handleDatabaseError(error); // Handle any database errors
		return null; // Return null or handle the error based on your specific logic
	}
};
