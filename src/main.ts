// Load the .env file
import dotenv from 'dotenv';
dotenv.config({ path: '.env', debug: (process.env.NODE_ENV === 'development') });

// Imports for the server
import express from 'express';
import bodyParser from 'body-parser';
import { setupRoutes } from './routes';

// Imports for the Intra API
import Fast42 from '@codam/fast42';
import { INTRA_API_SECRET, INTRA_API_UID, NODE_ENV } from './env';
import { balanceEconomy, trimAllExcessPointsNow } from './utils/eval_points';

export let api: Fast42 | null = null;

const main = async () => {
	// Set up the Express app
	const app = express();

	// Use body-parser middleware to parse JSON and URL-encoded request bodies
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));

	// Adding size limit to json request (DoS); 10kb seems to be standard
	app.use(express.json({ limit: "10kb" }));

	// Handle Intra API initialization and initial synchronization
	try {
		console.log('Initializing the Intra API...');
		api = await new Fast42([{
			client_id: INTRA_API_UID,
			client_secret: INTRA_API_SECRET,
		}]).init();
	}
	catch (error) {
		console.error('Failed to initialize the Intra API:', error);
		process.exit(1);
	}

	// Initial check to trim everyone's excess points on startup, in case there were changes while the balancer was offline
	await trimAllExcessPointsNow(api);

	// Modify the pool to achieve the desired average points per user in the economy on startup, in case there were changes while the balancer was offline
	await balanceEconomy(api);

	// Configure status page
	app.get('/status', async (req, res) => {
		return res.json({
			status: 'ok',
		});
	});

	// Set up routes
	setupRoutes(app);

	// Start the Express server
	app.listen(4000, async () => {
		console.log('Server is running on http://localhost:4000 in ' + NODE_ENV + ' mode');
	});

	// Every week, balance the economy by modifying the pool to achieve the desired average points per user in the economy
	setInterval(async () => {
		try {
			await balanceEconomy(api!);
		}
		catch (err) {
			console.error('Failed to balance the economy:', err);
		}
	}, 7 * 24 * 60 * 60 * 1000); // Every week
};

main(); // is async because of API synchronization
