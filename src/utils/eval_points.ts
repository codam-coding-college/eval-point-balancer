import Fast42 from "@codam/fast42"
import { Pool, PoolPointGiven, StandardUser } from "../interfaces";
import { CAMPUS_ID, CURSUS_ID, DESIRED_AVG_EVAL_POINTS, MAX_EVAL_POINTS, NODE_ENV, POOL_ID, WEBHOOK_SECRET_COALITION_POINT_DONATION, WEBHOOK_URL_COALITION_POINT_DONATION } from "../env";
import { MAX, v4 as uuidv4 } from 'uuid';
import { fetchMultiple42ApiPagesCallback } from "./fast42";
import { getUserById, getUserByLogin, parseStandardUser } from "./users";

export const getUserEvalPointAmount = async function(api: Fast42, userId: number | string): Promise<number> {
	const user = (typeof userId === 'number') ? await getUserById(api, userId) : await getUserByLogin(api, userId);
	if (!user) {
		throw new Error(`Failed to fetch user data for user ${userId} to get eval point amount`);
	}
	return user.correction_point || 0;
};

export const removeUserEvalPoints = async function(api: Fast42, userId: number | string, pointsToRemove: number, reason: string) {
	if (NODE_ENV !== 'production') {
		console.log(`[DEV MODE] Would remove ${pointsToRemove} eval points from user ${userId} for reason: ${reason}`);
		return;
	}
	const req = await api.delete(`/users/${userId}/correction_points/remove`, {
		amount: pointsToRemove,
		reason: reason
	});
	if (!req.ok) {
		throw new Error(`Failed to remove eval points for user ${userId}`);
	}
};

export const addPointsToPool = async function(api: Fast42, userId: number | string | null, pointsToAdd: number) {
	if (NODE_ENV !== 'production') {
		console.log(`[DEV MODE] Would add ${pointsToAdd} points to the pool from user ${userId}`);
		return;
	}
	const reqIntra = await api.post(`/pools/${POOL_ID}/points/add`, {
		points: pointsToAdd,
	});
	if (!reqIntra.ok) {
		throw new Error(`Failed to donate ${pointsToAdd} points to the pool from user ${userId}`);
	}

	// Trigger webhook for point donation in the coalition system manually.
	// Intra won't do it for us, as you cannot donate points as a user using the API, only anonymously.
	if (userId && WEBHOOK_URL_COALITION_POINT_DONATION && WEBHOOK_SECRET_COALITION_POINT_DONATION) {
		console.log(`Triggering coalition system webhook for donation of ${pointsToAdd} points to the pool from user ${userId}...`);
		const pool = await getPool(api, POOL_ID);
		if (!pool) {
			throw new Error(`Failed to fetch pool data for pool ${POOL_ID} to trigger coalition point donation webhook for user ${userId}`);
		}
		const user = (typeof userId === 'number') ? await getUserById(api, userId) : await getUserByLogin(api, userId);
		if (!user) {
			throw new Error(`Failed to fetch user data for user ${userId} to award coalition points`);
		}

		const PoolPointGivenData: PoolPointGiven = {
			id: POOL_ID,
			campus_id: CAMPUS_ID,
			cursus_id: CURSUS_ID,
			given_by: {
				id: user.id,
				first_name: user.first_name,
				last_name: user.last_name,
				usual_first_name: user.usual_first_name,
				email: user.email,
				login: user.login,
				correction_points: user.correction_point
			},
			points: {
				old: pool.current_points,
				current: pool.current_points + pointsToAdd,
			},
			max_points: pool.max_points,
		};
		const reqCoalition = await fetch(WEBHOOK_URL_COALITION_POINT_DONATION, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Secret': WEBHOOK_SECRET_COALITION_POINT_DONATION,
				'X-Model': 'pool',
				'X-Event': 'point_given',
				'X-Delivery': `balancer-${uuidv4().substring(9)}`,
			},
			body: JSON.stringify(PoolPointGivenData),
		});
		if (!reqCoalition.ok) {
			throw new Error(`Failed to trigger webhook for point donation from user ${userId}`);
		}
	}
};

export const removePointsFromPool = async function(api: Fast42, pointsToRemove: number, removeToZero: boolean = false) {
	if (NODE_ENV !== 'production') {
		console.log(`[DEV MODE] Would remove ${pointsToRemove} points from the pool`);
		return;
	}
	const pool = await getPool(api, POOL_ID);
	if (!pool) {
		throw new Error(`Failed to fetch pool data for pool ${POOL_ID} to remove points from the pool`);
	}
	if (pool.current_points < pointsToRemove) {
		if (!removeToZero) {
			throw new Error(`Cannot remove ${pointsToRemove} points from the pool, because it only has ${pool.current_points} points`);
		}
		console.warn(`Cannot remove ${pointsToRemove} points from the pool, because it only has ${pool.current_points} points. Removing all remaining points from the pool instead because removeToZero is set to true.`);
		pointsToRemove = pool.current_points;
	}
	const req = await api.delete(`/pools/${POOL_ID}/points/remove`, {
		points: pointsToRemove,
	});
	if (!req.ok) {
		throw new Error(`Failed to remove ${pointsToRemove} points from the pool`);
	}
};

export const forceDonatePoints = async function(api: Fast42, userId: number | string, pointsToDonate: number) {
	try {
		await removeUserEvalPoints(api, userId, pointsToDonate, `Provided points to the pool.`); // Reason MUST be "Provided points to the pool.", or the Bill Gates achievement won't work! Hardcoded Intra shit.
		await addPointsToPool(api, userId, pointsToDonate);
	}
	catch (err) {
		throw new Error(`Failed to donate points for user ${userId}: ${err instanceof Error ? err.message : String(err)}`);
	}
};

export const trimUserExcessPoints = async function(api: Fast42, userId: number | string, currentEvalPoints: number | null) {
	if (currentEvalPoints === null) {
		currentEvalPoints = await getUserEvalPointAmount(api, userId);
	}

	if (currentEvalPoints > MAX_EVAL_POINTS) {
		const excessPoints = currentEvalPoints - MAX_EVAL_POINTS;
		console.log(`User ${userId} has ${currentEvalPoints} eval points, which exceeds the maximum of ${MAX_EVAL_POINTS}. Removing ${excessPoints} excess points by donating them to the pool.`);
		await forceDonatePoints(api, userId, excessPoints);
	}
};

export const getPool = async function(api: Fast42, poolId: number): Promise<Pool | null> {
	const req = await api.get(`/pools/${poolId}`);
	if (!req.ok) {
		return null;
	}
	const pool = await req.json();
	return {
		id: pool.id,
		current_points: pool.current_points,
		max_points: pool.max_points,
		cursus_id: pool.cursus_id,
		campus_id: pool.campus_id,
	};
};

export const actOnAllActiveUsers = async function(api: Fast42, action: (user: StandardUser) => Promise<void>) {
	await fetchMultiple42ApiPagesCallback(api, `/cursus/${CURSUS_ID}/users`, { 'filter[primary_campus_id]': `${CAMPUS_ID}` }, async (users) => {
		for (const user of users) {
			if (user['active?'] === false || user.kind !== 'student') {
				continue; // Skip inactive and non-student users, as they won't be interacting in the eval system
			}
			if (user.correction_point > MAX_EVAL_POINTS || user.correction_point < 0) {
				console.log(`User ${user.login} has an unexpected amount of ${user.correction_point} eval points`); // Log each user's amount of correction points for debugging and transparency
			}
			const standardUser = parseStandardUser(user);
			await action(standardUser);
		}
	});
};

export const trimAllExcessPointsNow = async function(api: Fast42) {
	console.log(`Trimming excess points for all users in cursus ${CURSUS_ID} of campus ${CAMPUS_ID}...`);
	await actOnAllActiveUsers(api, async (user) => {
		try {
			await trimUserExcessPoints(api, user.login, user.correction_point);
		}
		catch (err) {
			console.error(`Failed to trim excess points for user ${user.login}: ${err instanceof Error ? err.message : String(err)}`);
		}
	});
};

export const balanceEconomy = async function(api: Fast42) {
	console.log(`Checking if the average points per user in the entire economy exceeds the desired average of ${DESIRED_AVG_EVAL_POINTS} points...`);
	const pool = await getPool(api, POOL_ID);
	if (!pool) {
		throw new Error(`Failed to fetch pool data for pool ${POOL_ID} to check economy balance`);
	}
	let active_user_count = 0;
	const all_point_amounts: number[] = [pool.current_points]; // Add the number of points in the pool to the list of all points in the economy
	await actOnAllActiveUsers(api, async (user) => {
		all_point_amounts.push(Math.min(user.correction_point, MAX_EVAL_POINTS)); // Add each user's amount of correction points to the list of all points in the economy
		active_user_count++; // Count active users to count the average points per active user
	});
	const total_points = all_point_amounts.reduce((a, b) => a + b, 0);
	const avg_points = total_points / active_user_count;
	console.log(`Current average points per user: ${avg_points.toFixed(2)} (${total_points} total points among ${active_user_count} users)`);

	if (avg_points > DESIRED_AVG_EVAL_POINTS) {
		console.log(`The average points per user in the economy exceeds the desired average. Reducing the amount of points in the pool to balance the economy...`);
		const excess_points = total_points - (DESIRED_AVG_EVAL_POINTS * active_user_count);
		console.log(`Removing ${excess_points} excess points from the pool...`);
		await removePointsFromPool(api, excess_points);
		console.log(`Economy balanced successfully.`);
	}
	else if (avg_points < DESIRED_AVG_EVAL_POINTS) {
		console.log(`The average points per user in the economy is below the desired average. Adding points to the pool to balance the economy...`);
		const needed_points = Math.ceil((DESIRED_AVG_EVAL_POINTS * active_user_count) - total_points);
		if (needed_points > pool.max_points * 2) {
			console.warn(`Attempting to add an extreme amount of evaluation points to the pool (${needed_points} points, which is more than twice the pool's maximum capacity of ${pool.max_points} points). This likely indicates a bug or an issue with the eval point economy. Aborting to prevent potential damage to the economy.`);
			return;
		}

		console.log(`Adding ${needed_points} points to the pool...`);
		await addPointsToPool(api, null, needed_points);
		console.log(`Economy balanced successfully.`);
	}
	else {
		console.log(`The average points per user in the economy is exactly at the desired average. No action needed.`);
	}
};
