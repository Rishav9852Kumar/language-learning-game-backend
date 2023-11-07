import { connect } from '@planetscale/database';

async function handleUserScoresRequest(request, env) {
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
            return handleGetUserScoresRequest(request, conn);
        case 'PUT':
            return handlePutUserScoresRequest(request, conn);
        case 'POST':
            return handlePostUserScoresRequest(request, conn);
        case 'DELETE':
            return handleDeleteUserScoresRequest(request, conn);
        default:
            return new Response('Invalid request method', {
                headers: {
                    'content-type': 'text/plain',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
                status: 400, // Bad Request
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

async function getSubjectNameBySubjectId(conn, subjectId) {
    const subjectData = await conn.execute('SELECT SubjectName FROM LanguageSubjects WHERE SubjectId = ?;', [subjectId]);
    if (subjectData.error || subjectData.rows.length === 0) {
        return null; // Subject not found
    }
    return subjectData.rows[0].SubjectName;
}

async function handleGetUserScoresRequest(request, conn) {
	try {
		const url = new URL(request.url);
		const userId = url.searchParams.get('userId');

		if (!userId) {
			return new Response('User ID is required', {
				headers: {
					'content-type': 'text/plain',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
				status: 400, // Bad Request
			});
		}

		// Get all user scores for the specified user ID
		const userScoresData = await conn.execute('SELECT * FROM UserScores WHERE UserId = ?;', [userId]);

		if (userScoresData.error) {
			return new Response(userScoresData.error, {
				headers: {
					'content-type': 'text/plain',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
				status: 500, // Internal Server Error
			});
		}

		// Create an array to hold user scores with subject names
		const userScoresWithSubjectNames = [];
		for (const row of userScoresData.rows) {
			const subjectName = await getSubjectNameBySubjectId(conn, row.SubjectId);
			if (subjectName) {
				const userScoreWithSubjectName = {
					UserId: row.UserId,
					SubjectId: row.SubjectId,
					SubjectScore: row.SubjectScore,
					ExercisesCompleted: row.ExercisesCompleted,
					SubjectName: subjectName,
				};
				userScoresWithSubjectNames.push(userScoreWithSubjectName);
			}
		}

		return new Response(JSON.stringify(userScoresWithSubjectNames), {
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


async function handlePutUserScoresRequest(request, conn) {
    try {
        const url = new URL(request.url);
        const userId = parseInt(url.searchParams.get('userId'));
        const subjectName = url.searchParams.get('subjectName');
        const score = parseInt(url.searchParams.get('score'));

        if (!userId || !subjectName || isNaN(score)) {
            return new Response('User ID, Subject Name, and Score are required and must be numbers', {
                headers: {
                    'content-type': 'text/plain',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
                status: 400, // Bad Request
            });
        }

        const subjectId = await getSubjectIdBySubjectName(conn, subjectName);

        if (!subjectId) {
            return new Response('Subject not found', {
                headers: {
                    'content-type': 'text/plain',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
                status: 404, // Not Found
            });
        }

        // Check if the user and subject combination exists
        const userScoreData = await conn.execute(
            'SELECT * FROM UserScores WHERE UserId = ? AND SubjectId = ?;',
            [userId, subjectId]
        );

        if (userScoreData.error) {
            return new Response(userScoreData.error, {
                headers: {
                    'content-type': 'text/plain',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
                status: 500, // Internal Server Error
            });
        }

        if (userScoreData.rows.length === 0) {
            return new Response('User and Subject combination does not exist', {
                headers: {
                    'content-type': 'text/plain',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
                status: 404, // Not Found
            });
        }

        const currentScore = userScoreData.rows[0].SubjectScore;
        const currentExercisesCompleted = userScoreData.rows[0].ExercisesCompleted;

        // Update the user's data
        const updateResult = await conn.execute(
            'UPDATE UserScores SET SubjectScore = ?, ExercisesCompleted = ? WHERE UserId = ? AND SubjectId = ?;',
            [currentScore + score, currentExercisesCompleted + 1, userId, subjectId]
        );

        if (updateResult.error) {
            return new Response(updateResult.error, {
                headers: {
                    'content-type': 'text/plain',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
                status: 500, // Internal Server Error
            });
        }

        return new Response('User data updated', {
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

async function handlePostUserScoresRequest(request, conn) {
    try {
        const url = new URL(request.url);
        const userId = parseInt(url.searchParams.get('userId'));
        const subjectName = url.searchParams.get('subjectName');

        if (!userId || !subjectName) {
            return new Response('User ID and Subject Name are required', {
                headers: {
                    'content-type': 'text/plain',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
                status: 400, // Bad Request
            });
        }

        const subjectId = await getSubjectIdBySubjectName(conn, subjectName);

        if (!subjectId) {
            return new Response('Subject not found', {
                headers: {
                    'content-type': 'text/plain',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
                status: 404, // Not Found
            });
        }

        // Check if the user and subject combination already exists
        const userScoreData = await conn.execute(
            'SELECT * FROM UserScores WHERE UserId = ? AND SubjectId = ?;',
            [userId, subjectId]
        );

        if (userScoreData.error) {
            return new Response(userScoreData.error, {
                headers: {
                    'content-type': 'text/plain',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
                status: 500, // Internal Server Error
            });
        }

        if (userScoreData.rows.length > 0) {
            return new Response('User and Subject combination already exists', {
                headers: {
                    'content-type': 'text/plain',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
                status: 400, // Bad Request
            });
        }

        // Insert a new row into the UserScores table with initial values
        const insertResult = await conn.execute(
            'INSERT INTO UserScores (UserId, SubjectId, SubjectScore, ExercisesCompleted) VALUES (?, ?, 0, 0);',
            [userId, subjectId]
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

        return new Response('User and Subject combination created', {
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
async function handleDeleteUserScoresRequest(request, conn) {
	try {
		const url = new URL(request.url);
		const userId = parseInt(url.searchParams.get('userId'));
		const subjectName = url.searchParams.get('subjectName');

		if (!userId || !subjectName) {
			return new Response('User ID and Subject Name are required', {
				headers: {
					'content-type': 'text/plain',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
				status: 400, // Bad Request
			});
		}

		const subjectId = await getSubjectIdBySubjectName(conn, subjectName);

		if (!subjectId) {
			return new Response('Subject not found', {
				headers: {
					'content-type': 'text/plain',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
				status: 404, // Not Found
			});
		}

		// Check if the user and subject combination exists
		const userScoreData = await conn.execute('SELECT * FROM UserScores WHERE UserId = ? AND SubjectId = ?;', [userId, subjectId]);

		if (userScoreData.error) {
			return new Response(userScoreData.error, {
				headers: {
					'content-type': 'text/plain',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
				status: 500, // Internal Server Error
			});
		}

		if (userScoreData.rows.length === 0) {
			return new Response('User and Subject combination not found', {
				headers: {
					'content-type': 'text/plain',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
				status: 404, // Not Found
			});
		}

		// Delete the user and subject combination from the table
		const deleteResult = await conn.execute('DELETE FROM UserScores WHERE UserId = ? AND SubjectId = ?;', [userId, subjectId]);

		if (deleteResult.error) {
			return new Response(deleteResult.error, {
				headers: {
					'content-type': 'text/plain',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
				status: 500, // Internal Server Error
			});
		}

		// Return a response with status 204 and no body (No Content)
		return new Response('User and Subject combination Deleted', {
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

export default handleUserScoresRequest;