import { Express } from 'express';
import NodeCache from 'node-cache';
import { WEBHOOK_SECRET_SCALE_TEAM_UPDATE } from './env';
import { handleScaleTeamUpdate, parseScaleTeamUpdate } from './utils/scale_team';

const deliveryCache = new NodeCache({ stdTTL: 60 * 60 }); // Cache for 1 hour

const logwh = (XDelivery: string | undefined, message: string, data?: any) => {
	const now = new Date();
	console.log(`${now.toISOString()} - ${XDelivery || 'undefined'} - ${message}`, data || '');
};

export const setupRoutes = function(app: Express): void {
	app.post('/hooks/intra', async (req, res) => {
		const XModel = req.header('X-Model');
		const XEvent = req.header('X-Event');
		const XDelivery = req.header('X-Delivery');
		const XSecret = req.header('X-Secret');
		logwh(XDelivery, 'Received webhook from ' + req.ip, { XModel, XEvent, XDelivery });

		if (!XModel || !XEvent || !XDelivery || !XSecret) {
			logwh(XDelivery, 'Missing required headers', { XModel, XEvent, XDelivery, XSecret });
			return res.status(400).json({ error: 'Missing required headers' });
		}

		if (!deliveryCache.has(XDelivery)) {
			deliveryCache.set(XDelivery, true);
		} else {
			logwh(XDelivery, 'Duplicate delivery detected', { XDelivery });
			return res.status(208).json({ error: 'Duplicate delivery' });
		}

		switch (XModel) {
			case 'ScaleTeam':
				if (XEvent === 'update' && XSecret === WEBHOOK_SECRET_SCALE_TEAM_UPDATE) {
					try {
						const scaleTeam = parseScaleTeamUpdate(req.body);
						logwh(XDelivery, 'Received ScaleTeam update', { scaleTeam });
						await handleScaleTeamUpdate(scaleTeam);
						logwh(XDelivery, 'Processed ScaleTeam update successfully');
						return res.status(200).json({ message: 'ScaleTeam update processed successfully' });
					}
					catch (err) {
						logwh(XDelivery, 'Failed to parse ScaleTeam update', { error: err });
						return res.status(500).json({ error: 'Internal server error', detail: err instanceof Error ? err.message : String(err) });
					}
				}
				break;
			default:
				logwh(XDelivery, 'Unsupported model received', { XModel });
				return res.status(400).json({ error: 'Unsupported model' });
		}
	});
};
