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
			await Promise.all(pages.map(async (page, idx) => {
				let p = null;
				p = await page;
				if (!p.ok) {
					const rawdata = await p.text();
					throw new Error(`Intra API error: ${p.status} ${p.statusText} on ${p.url}. Response: ${rawdata}`);
				}
				const xPage = parseInt(p.headers.get('X-Page') ?? '0');
				const xTotal = parseInt(p.headers.get('X-Total') ?? '0'); // total amount of items, not total amount of pages
				const xPerPage = parseInt(p.headers.get('X-Per-Page') ?? '0');
				const data = await p.json();
				console.debug(`Fetched page ${++i} of ${pages.length} on ${path}...`);
				await callback(data, xPage, xTotal);
			}));
			return resolve();
		}
		catch (err) {
			return reject(err);
		}
	});
};
