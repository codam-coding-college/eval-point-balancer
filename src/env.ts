export const NODE_ENV = process.env.NODE_ENV || 'development';
export const URL_ORIGIN = process.env.URL_ORIGIN!;
export const SESSION_SECRET = process.env.SESSION_SECRET!;
export const INTRA_API_UID = process.env.INTRA_API_UID!;
export const INTRA_API_SECRET = process.env.INTRA_API_SECRET!;
export const CAMPUS_ID: number = parseInt(process.env.INTRA_CAMPUS_ID!);
export const CURSUS_ID: number = parseInt(process.env.INTRA_CURSUS_ID!);
export const POOL_ID: number = parseInt(process.env.INTRA_POOL_ID!);
export const MAX_EVAL_POINTS: number = parseInt(process.env.MAX_EVAL_POINTS!);
export const DESIRED_AVG_EVAL_POINTS: number = parseInt(process.env.DESIRED_AVG_EVAL_POINTS!);

export const WEBHOOK_SECRET_SCALE_TEAM_UPDATE: string | null = process.env.WEBHOOK_SECRET_SCALE_TEAM_UPDATE || null;
export const WEBHOOK_URL_COALITION_POINT_DONATION: string | null = process.env.WEBHOOK_URL_COALITION_POINT_DONATION || null;
export const WEBHOOK_SECRET_COALITION_POINT_DONATION: string | null = process.env.WEBHOOK_SECRET_COALITION_POINT_DONATION || null;
