import Fast42 from "@codam/fast42";

/**
 * Fetch all items from all pages of a Fast42 API endpoint, with a callback function for each page fetched.
 * Useful for larger datasets that may not fit in memory.
 * @usage const codamStudents = await fetchMultiple42ApiPages(api, '/campus/14/users');
 * @param api A Fast42 instance
 * @param path The API path to fetch
 * @param params Optional query parameters for the API request
 * @param callback A callback function to call for each page fetched
 * @returns A promise that resolves to an array containing all items from all pages of the API responses
 */
export const fetchMultiple42ApiPagesCallback = async function(api: Fast42, path: string, params: { [key: string]: string } = {}, callback: (data: any, xPage: number, xTotal: number) => void): Promise<void> {
	return new Promise(async (resolve, reject) => {
		try {
			const pages = await api.getAllPages(path, params);

			let i = 0;
			for (const page of pages) {
				let p = null;
				while (!p) {
					p = await page;
					if (!p) {
						console.log('Retrying page fetch...');
						await new Promise((resolve) => setTimeout(resolve, 1000));
						continue;
					}
					if (p.status == 429) {
						console.error('Intra API rate limit exceeded, let\'s wait a bit...');
						const waitFor = parseInt(p.headers.get('Retry-After'));
						console.log(`Waiting ${waitFor} seconds...`);
						await new Promise((resolve) => setTimeout(resolve, waitFor * 1000 + Math.random() * 1000));
						p = null;
						continue;
					}
					if (!p.ok) {
						throw new Error(`Intra API error: ${p.status} ${p.statusText} on ${p.url}`);
					}
				}
				if (p.ok) {
					const xPage = parseInt(p.headers.get('X-Page'));
					const xTotal = parseInt(p.headers.get('X-Total'));
					const data = await p.json();
					console.debug(`Fetched page ${++i} of ${pages.length} on ${path}...`);
					callback(data, xPage, xTotal);
				}
			}
			return resolve();
		}
		catch (err) {
			return reject(err);
		}
	});
};
