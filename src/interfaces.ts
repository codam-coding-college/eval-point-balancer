export interface ScaleTeamUpdate {
	id: number;
	team: {
		id: number;
		project_id: number;
		name: string;
		created_at: string;
		updated_at: string;
		locked_at: string | null;
		closed_at: string | null;
		final_mark: number | null;
		status: string;
	};
	flag: {
		id: number;
		name: string;
		positive: boolean;
	};
	begin_at: string;
	comment: string | null;
	final_mark: number | null;
	filled_at: string | null;
	created_at: string;
	updated_at: string;
	project: {
		id: number;
		name: string;
		slug: string;
	};
	user: {
		id: number;
		email: string;
		login: string;
		first_name: string;
		last_name: string;
		correction_point: number; // here it's correction_point, without an S, intentional!
	} | null;
};

export interface PoolPointGiven {
	id: number;
	campus_id: number;
	cursus_id: number;
	given_by: {
		id: number;
		first_name: string;
		last_name: string;
		usual_first_name: string | null;
		email: string;
		login: string;
		correction_points: number; // here it's correction_pointS, with an S, intentional!
	} | null;
	points: {
		old: number;
		current: number;
	};
	max_points: number;
};


/*
export interface FullUser {
	// TODO user from /v2/users/:id
};
*/

// single user from /v2/users
export interface StandardUser {
	id: number;
	email: string;
	login: string;
	first_name: string;
	last_name: string;
	usual_full_name: string;
	usual_first_name: string | null;
	correction_point: number; // here it's correction_point, without an S, intentional!
	kind: string;
	// There's more but for now this goes unused, so we skip it
};

// single user embedded in most other endpoints
export interface SimpleUser {
	id: number;
	login: string;
	url: string;
};

export interface Pool {
	id: number;
	current_points: number;
	max_points: number;
	cursus_id: number;
	campus_id: number;
};
