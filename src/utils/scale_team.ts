import { CURSUS_ID } from "../env";
import { ScaleTeamUpdate } from "../interfaces";
import { api } from '../main';
import { trimUserExcessPoints } from "./eval_points";
import { userIsStudent } from "./users";

export const parseScaleTeamUpdate = function(data: any): ScaleTeamUpdate {
	return {
		id: data.id,
		team: data.team,
		flag: data.flag,
		begin_at: data.begin_at,
		comment: data.comment,
		final_mark: data.final_mark,
		filled_at: data.filled_at,
		created_at: data.created_at,
		updated_at: data.updated_at,
		project: {
			id: data.project.id,
			name: data.project.name,
			slug: data.project.slug,
		},
		user: {
			id: data.user.id,
			email: data.user.email,
			login: data.user.login,
			first_name: data.user.first_name,
			last_name: data.user.last_name,
			correction_point: data.user.correction_point,
		},
	};
};

export const handleScaleTeamUpdate = async (scaleTeamUpdate: ScaleTeamUpdate) => {
	if (!api) {
		throw new Error('API not initialized');
	}

	// Check if the scale team contains a user
	if (!scaleTeamUpdate.user || !scaleTeamUpdate.user.login) {
		console.log(`ScaleTeam update ${scaleTeamUpdate.id} does not contain a user, skipping`);
		return;
	}

	// Skip supervisor evaluations (Internship evaluations)
	if (scaleTeamUpdate.user.login === 'supervisor') {
		console.log(`ScaleTeam update ${scaleTeamUpdate.id} is from supervisor (Internship evaluation), skipping`);
		return;
	}

	// Check if the evaluation has been completed
	if (scaleTeamUpdate.filled_at === null) {
		console.log(`ScaleTeam update ${scaleTeamUpdate.id} evaluation form is not filled yet, skipping`);
		return;
	}

	// Check if the evaluator is a student within the specified cursus
	const isStudent = await userIsStudent(api, scaleTeamUpdate.user.login);
	if (!isStudent) {
		console.log(`User ${scaleTeamUpdate.user.login} is not an active student within cursus ${CURSUS_ID}, skipping ScaleTeam update`);
		return;
	}

	// Trim excess points if needed
	await trimUserExcessPoints(api, scaleTeamUpdate.user.id, scaleTeamUpdate.user.correction_point);
};
