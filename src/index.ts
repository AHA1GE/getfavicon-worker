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
 * Fetches the favicon for a given URL and size, using Google's favicon API first, if error try the page's HTML.
 * @param request 
 * @returns icon file if success, otherwise redirect, if error redirect to default favicon.ico
 */
const defaultIconUrl = "https://he.net/favicon.ico";
async function handleRequest(request: Request): Promise<Response> {
    let params;
    try { // convert param
        params = await convertParam(new URL(request.url));
    } catch (error) {
        console.error("param error: " + error);
        // If the parameters are invalid, redirect to the default icon.
        return Response.redirect(defaultIconUrl, 307);
    }
    try { // fetch icon use google api
        return await fetchIconUseGoogleApi(params.targetSize, params.targetUrl);
    } catch (error) {
        console.warn("fetch Icon Use Google Api error: " + error);
    }
    try { // fetch favicon from page
        return await fetchFaviconFromPage(params.targetSize, params.targetUrl);
    } catch (error) {
        console.warn("fetch Favicon From Page error: " + error);
    }
    // If all attempts failed, redirect to the default icon.
    console.error("All attempts failed, redirect to default icon.");
    return Response.redirect(defaultIconUrl, 307);
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
        const googleResponse = await fetch(constructGoogleApiUrl(targetSize, targetUrl));

        if (googleResponse.ok) {
            const contentType = googleResponse.headers.get("Content-Type") || "image/x-icon";
            if (contentType.startsWith("image/")) {
                // SUCCESS: Return the fetched icon.
                const iconData = await googleResponse.arrayBuffer();
                return new Response(iconData, { headers: { "Content-Type": contentType } });
            } else {
                // ERROR: Log the error for debugging purposes
                // console.error(`Invalid Content-Type received for favicon: ${contentType}`);
                throw new Error(`Invalid Content-Type received for favicon: ${contentType}`);
            }
        } else {
            if (googleResponse.status === 404) {
                // ERROR: The favicon was not found. 
                console.error(`google favicon api 404.`);
                throw new Error(`google favicon api 404.`);
                // return Response.redirect("https://he.net/favicon.ico", 307);
            } else {
                // ERROR: Log the error for debugging purposes
                // console.error(`Google api error, status: ${googleResponse.status}.`);
                throw new Error(`Google api error, status: ${googleResponse.status}.`);
            }

        }
    } catch (e) {
        // console.error(`Failed to fetch favicon for ${targetUrl}: ${e}`);
        throw new Error(`Failed to fetch favicon for ${targetUrl}: ${e}`);
    }
}

function constructGoogleApiUrl(targetSize: string, targetUrl: URL): string {
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
    return googleApiUrl
}

/** Fetches the favicon from page specified url.
    * @param targetSize The desired size of the favicon.
    * @param targetUrl The URL of the page to fetch the favicon from.
    * @returns The fetched favicon as Response.
    * @throws If the target page cannot be fetched, is not an HTML document, or does not contain a valid favicon.
    */
async function fetchFaviconFromPage(targetSize: string, targetUrl: URL): Promise<Response> {
    // Fetch the target page and extract the favicon URL.
    const responsePage = await fetch(targetUrl.toString(), { redirect: "follow" });
    if (!responsePage.ok) {
        throw new Error(`Failed to fetch target page, status: ${responsePage.status}`);
    } else if (!responsePage.headers.get("Content-Type")?.startsWith("text/html")) {
        throw new Error("Target page is not an HTML document, type:" + responsePage.headers.get("Content-Type") || "unknown");
    } else {
        //proceed
    }

    // Parse the response as HTML.
    const html = await responsePage.text();

    // Look for favicon links in the HTML.
    //      1. look for all elemnts that provide favicon or apple-touch-icon, like <link rel="icon" href="favicon.ico">. If not found, throw an error.
    //      2. process each link: if the link is relative we need to convert them to absolute URL use the targetUrl. If the link is already absolute, keep it as is.
    //      3. save the processed URL in faviconUrlList: string[]. If no valid URL found, throw an error.
    const linkRegex = /<link\s+(?:[^>]*?\s+)?rel=["'](icon|shortcut icon|apple-touch-icon|apple-touch-icon-precomposed|apple-touch-startup-image)["'][^>]*?>/gi;
    let match;
    const faviconUrlList = [];
    while ((match = linkRegex.exec(html)) !== null) {
        const hrefRegex = /href=["']([^"']+)["']/i;
        const hrefMatch = hrefRegex.exec(match[0]);
        if (hrefMatch && hrefMatch[1]) {
            const faviconUrl = new URL(hrefMatch[1], targetUrl).toString();
            faviconUrlList.push(faviconUrl);
        }
    }
    if (faviconUrlList.length === 0) {
        console.warn("No favicon link found, the page text 0-200: " + html.slice(0, 200) + "...");
        throw new Error("No favicon link found");
    } else {
        return fetchFaviconUrlList(faviconUrlList)
    }
}

/**
 * fetch the first valid favicon from the list of URLs
 * @param faviconUrlList 
 * @returns the first valid favicon as Response
 * @throws if no valid favicon found
 */
async function fetchFaviconUrlList(faviconUrlList: string[]) {
    // Use promise.any to fetch all favicon URLs concurrently. The first successful response will be returned.
    //      1. Use Promise.any to fetch all favicon URLs concurrently.
    //      2. If any response is a valid image, return the image as a Response. And stop fetching the rest.
    //      3. If all responses are invalid or failed, throw an error.

    // Wrap each fetch call in a promise that resolves for both success and failure cases
    const fetchPromises = faviconUrlList.map(url =>
        fetch(url).then(response => {
            // Check if the response is OK and the content type is an image
            if (response.ok && response.headers.get("Content-Type")?.startsWith("image/")) {
                // Return the valid image response
                return response;
            }
            // If response is not OK or not an image, throw to indicate this fetch should not be considered
            console.warn(`Fetch failed: '${url}', status: ${response.status}, content-type: ${response.headers.get("Content-Type") || "unknown"}`);
            throw new Error("Invalid image or fetch failed");
        }).catch(error => {
            // Catch any network errors and re-throw to handle them as invalid fetch attempts
            throw error;
        })
    );

    try {
        // Use Promise.any to return the first fulfilled promise, ignoring rejected ones until one resolves
        const firstValidImage = await Promise.any(fetchPromises);
        return firstValidImage;
    } catch (error) {
        // If all promises are rejected, Promise.any will throw an AggregateError
        throw new Error("No valid favicon found, either paage has no link or all fetches failed");
    }
}