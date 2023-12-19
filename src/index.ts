/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		console.log("Got a request", request);
		console.log("Got a env", env);
		console.log("Got a ctx", ctx);
		return handleRequest(request);
	},

};
async function handleRequest(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const targetUrl = url.searchParams.get("url");
	let targetSize = url.searchParams.get("sz");
	if (targetSize === null) { targetSize = "32" }
	if (!targetUrl) {
		return new Response('Missing "url" parameter', {
			status: 400,
			headers: { "Content-Type": "text/plain" },
		});
	}
	try {//try fetch the favicon, ignore size

		throw new Error("temp fix, use google api"); //temp fix, use google api

		//TODO: fix fetch favicon
		const res = await fetch(targetUrl, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
				"Referrer-Policy": "no-referrer-when-downgrade",
			},
		});
		const html = await res.text();
		const faviconTagRegex =
			/<link\s+(?:[^>]*?\s+)?rel="(?:icon|shortcut icon|apple-touch-icon|mask-icon|fluid-icon)"(?:\s+[^>]*?)?href="([^"]+)"/gi;
		const matches = html.match(faviconTagRegex);
		//return new Response(matches[0].toString(), {status:400, headers: {'content-type': 'text/plain'}})
		let link = null;
		if (matches && matches.length > 0) {
			// Choose the last matching <link> tag
			//link = matches[matches.length - 1];
			// Choose the first matching tag
			link = matches[0].toString().match(/href="(.+?)"/)?.[1];
		}
		if (link) {
			const hrefRegex = /href="([^"]+)"/i;
			const hrefMatches = hrefRegex.exec(link);
			const href = (hrefMatches && hrefMatches[1]) || "null";

			let iconUrl: any;
			if (href && href.startsWith('http')) {
				// href is already an absolute URL, use it as-is
				iconUrl = new URL(href);
			} else if (href) {
				// href is a relative URL, combine with targetUrl to create absolute URL
				iconUrl = new URL(href, targetUrl);
			} else {
				// href is null or undefined, set iconUrl to null
				iconUrl = null;
			}
			const iconRes = await fetch(iconUrl);

			if (iconRes.ok) {
				const iconData = await iconRes.arrayBuffer();
				return new Response(iconData, {
					headers: { "Content-Type": iconRes.headers.get("Content-Type") || "image/x-icon" },
				});
			} else {
				return Response.redirect(href, 307);
			}
		} else {
			const iconUrl = new URL("/favicon.ico", targetUrl);
			const iconRes = await fetch(iconUrl, {
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
					"Referrer-Policy": "no-referrer-when-downgrade",
				},
			});
			if (iconRes.ok) {
				const iconData = await iconRes.arrayBuffer();
				return new Response(iconData, {
					headers: { "Content-Type": iconRes.headers.get("Content-Type") || "image/x-icon" },
				});
			} else {
			}
		}
	}
	catch (e) {
		console.log(e);
		try {//fallback to use google api
			const googleApiBaseUrl = "https://t0.gstatic.com/faviconV2";
			const queryParams = new URLSearchParams({
				client: 'chrome_desktop',
				nfrp: '2',
				check_seen: 'true',
				size: targetSize,
				min_size: '16',
				max_size: '256',
				url: targetUrl,
			});
			const googleApiUrl = `${googleApiBaseUrl}?${queryParams}`;
			const googleResponse = await fetch(googleApiUrl);
			if (googleResponse.ok) {
				//return Response.redirect(googleApiUrl, 307);
				const iconData = await googleResponse.arrayBuffer();
				return new Response(iconData, {
					headers: { "Content-Type": googleResponse.headers.get("Content-Type") || "image/x-icon" },
				});
			} else if (googleResponse.status === 404) {
				return Response.redirect(googleApiUrl, 307);
			} else {
				return Response.redirect("https://he.net/favicon.ico", 307);
				// return Response.redirect(googleApiUrl, 307);
			}
		} catch (e) {
			return new Response(
				`Failed to fetch favicon for ${targetUrl}: ${e}`,
				{ status: 500, headers: { "Content-Type": "text/plain" } },
			);
		}
	}

};