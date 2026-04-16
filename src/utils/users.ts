import Fast42 from "@codam/fast42";
import { StandardUser } from "../interfaces";
import { CAMPUS_ID, CURSUS_ID } from "../env";

export const filterLogin = function(login: string): string {
	return login.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
};

export const parseStandardUser = function(data: any): StandardUser {
	return {
		id: data.id,
		email: data.email,
		login: data.login,
		first_name: data.first_name,
		last_name: data.last_name,
		usual_full_name: data.usual_full_name,
		usual_first_name: data.usual_first_name,
		correction_point: data.correction_point,
		kind: data.kind,
	};
};

export const checkIfStudentExists = async function(api: Fast42, login: string): Promise<boolean> {
	login = filterLogin(login);
	const req = await api.get(`/users?filter[login]=${encodeURIComponent(login)}&filter[primary_campus_id]=${encodeURIComponent(CAMPUS_ID)}`);
	const users = await req.json();
	return users.length > 0;
};

export const getUserById = async function(api: Fast42, userId: number | string): Promise<StandardUser | null> {
	const req = await api.get(`/users/?filter[id]=${encodeURIComponent(userId)}&filter[primary_campus_id]=${encodeURIComponent(CAMPUS_ID)}`);
	if (!req.ok) {
		return null;
	}
	const users = await req.json();
	if (users.length === 0) {
		return null;
	}
	return parseStandardUser(users[0]);
};

export const getUserByLogin = async function(api: Fast42, login: string): Promise<StandardUser | null> {
	login = filterLogin(login);
	const req = await api.get(`/users?filter[login]=${encodeURIComponent(login)}&filter[primary_campus_id]=${encodeURIComponent(CAMPUS_ID)}`);
	const users = await req.json();
	if (users.length === 0) {
		return null;
	}
	return parseStandardUser(users[0]);
};

export const getUserIdByLogin = async function(api: Fast42, login: string): Promise<number | null> {
	const user = await getUserByLogin(api, login);
	if (!user) {
		return null;
	}
	return user.id;
};

export const userIsStudent = async function(api: Fast42, login: string): Promise<boolean> {
	login = filterLogin(login);
	const req = await api.get(`/cursus/${CURSUS_ID}/users?filter[login]=${encodeURIComponent(login)}&filter[primary_campus_id]=${encodeURIComponent(CAMPUS_ID)}`);
	const users = await req.json();
	return users.length > 0;
};
