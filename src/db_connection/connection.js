import { connect } from '@planetscale/database';

// This provides connection for planet scale DB for query
export const ps_connection = () => {
	const config = {
		host: env.DATABASE_HOST,
		username: env.DATABASE_USERNAME,
		password: env.DATABASE_PASSWORD,
		fetch: (url, init) => {
			delete init['cache'];
			return fetch(url, init);
		},
	};
	return connect(config);
};
