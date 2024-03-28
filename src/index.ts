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
        // console.log("Got a request", request);
        // console.log("Got a env", env);
        // console.log("Got a ctx", ctx);
        return handleRequest(request);
    },

};
/**
 * @param request 
 * @returns icon file if success, otherwise redirect to google api, if error, redirect to he.net/favicon.ico
 */
async function handleRequest(request: Request): Promise<Response> {
    let params;
    try {
        params = await convertParam(new URL(request.url));
    } catch (error) {
        // return new Response("param error: " + error, { status: 400, headers: { "Content-Type": "text/plain" } });
        console.error("param error: " + error);
        return Response.redirect("https://he.net/favicon.ico", 307);
    }
    try {
        const iconResponse = await fetchIconUseGoogleApi(params.targetSize, params.targetUrl);
        return iconResponse;
    } catch (error) {
        console.error("fetch Icon Use Google Api error: " + error);
        return redirectToGoogleApi(params.targetSize, params.targetUrl);
    }
}

async function convertParam(url: URL): Promise<{ targetSize: string; targetUrl: URL }> {

    // Get the "sz" parameter and ensure it's a positive integer.
    let targetSize = url.searchParams.get("sz")?.trim() || "32";
    const numericSize = parseInt(targetSize, 10);
    if (isNaN(numericSize) || numericSize <= 0) {
        targetSize = "32";
    } else {
        targetSize = numericSize.toString();
    }

    // Validate the "url" parameter.
    const targetUrlString = url.searchParams.get("url")?.trim();
    if (!targetUrlString) {
        throw new Error('Missing or empty "url" parameter');
    }
    let targetUrl;
    try {
        targetUrl = new URL(targetUrlString);
    } catch (e) {
        throw new Error('Invalid "url" parameter');
    }

    // Trim targetUrl to leave only domain
    targetUrl.pathname = "";
    targetUrl.search = "";
    targetUrl.hash = "";

    // Validate targetUrl's domain to prevent loop
    if (targetUrl.hostname === url.hostname) {
        throw new Error('Invalid "url" parameter');
    }

    return { targetSize, targetUrl };
}

async function fetchIconUseGoogleApi(targetSize: string, targetUrl: URL): Promise<Response> {
    try {
        // Fetch the favicon from Google's API.
        const googleApiBaseUrl = "https://t0.gstatic.com/faviconV2";
        const queryParams = new URLSearchParams({
            client: 'chrome_desktop',
            nfrp: '2',
            check_seen: 'true',
            size: targetSize,
            min_size: '16',
            max_size: '256',
            url: targetUrl.toString(),
        });
        const googleApiUrl = `${googleApiBaseUrl}?${queryParams}`;
        const googleResponse = await fetch(googleApiUrl);

        if (googleResponse.ok) {
            const contentType = googleResponse.headers.get("Content-Type") || "image/x-icon";
            if (contentType.startsWith("image/")) {
                // SUCCESS: Return the fetched icon.
                const iconData = await googleResponse.arrayBuffer();
                return new Response(iconData, { headers: { "Content-Type": contentType } });
            } else {
                // ERROR: Log the error for debugging purposes
                console.error(`Invalid Content-Type received for favicon: ${contentType}`);
                throw new Error(`Invalid Content-Type received for favicon: ${contentType}`);
            }
        } else {
            if (googleResponse.status === 404) {
                // ERROR: The favicon was not found. Return a redirect to the default icon.
                console.error(`google favicon api 404 for ${targetUrl}, redirecting user to default favicon.`);
                return Response.redirect("https://he.net/favicon.ico", 307);
            } else {
                // ERROR: Log the error for debugging purposes
                console.error(`Google api status: ${googleResponse.status}.`);
                throw new Error(`Google api status: ${googleResponse.status}.`);
            }

        }
    } catch (e) {
        console.error(`Failed to fetch favicon for ${targetUrl}: ${e}`);
        throw new Error(`Failed to fetch favicon for ${targetUrl}: ${e}`);
    }
}

async function redirectToGoogleApi(targetSize: string, targetUrl: URL): Promise<Response> {
    const googleApiBaseUrl = "https://t0.gstatic.com/faviconV2";
    const queryParams = new URLSearchParams({
        client: 'chrome_desktop',
        nfrp: '2',
        check_seen: 'true',
        size: targetSize,
        min_size: '16',
        max_size: '256',
        url: targetUrl.toString(),
    });
    const googleApiUrl = `${googleApiBaseUrl}?${queryParams}`;
    return Response.redirect(googleApiUrl, 307);
}