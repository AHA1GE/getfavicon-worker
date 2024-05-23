import { convertParam, defaultSvgicon } from "./utils";
import { fetchIconUseGoogleApi } from "./fetchers/googleApi";
import { fetchIconUseIconHorse } from "./fetchers/iconHorse";
import { fetchFaviconFromPage } from "./fetchers/pageLinks";

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
        // Parse the request.
        const url = new URL(request.url);
        // switch path
        if (url.pathname === "/default") {
            return defaultSvgicon();
        } else {
            return handleRequest(request);
        }
    },

};

/** Fetches the favicon for a given URL and size, using Google's favicon API first, if error try the page's HTML.
 * @param request 
 * @returns icon file if success, otherwise redirect, if error redirect to default icon
 */
async function handleRequest(request: Request): Promise<Response> {
    let params;
    const defaultIconUrl = new URL(request.url).origin + "/default";
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
        console.warn("fetch Icon Use Google Api failed: " + error);
    }
    try { // fetch favicon from page
        return await fetchFaviconFromPage(params.targetSize, params.targetUrl);
    } catch (error) {
        console.warn("fetch Favicon From Page failed: " + error);
    }
    try { // fetch icon use icon horse
        return await fetchIconUseIconHorse(params.targetUrl);
    } catch (error) {
        console.error("fetch Icon Use Icon Horse failed: " + error);
    }
    // If all attempts failed, redirect to google api.
    console.error("All attempts failed, redirect to default icon.");
    return Response.redirect(defaultIconUrl, 307);
}