import { resWithNewHeaders } from "../utils";

const fetchFromPageTimeout = 1.5; // seconds

/**
 * Fetches the first valid favicon from the list of URLs.
 * @param faviconUrlList The list of favicon URLs to fetch.
 * @returns The first valid favicon as Response.
 * @throws If no valid favicon is found.
 */
async function fetchFaviconUrlList(targetSize: string, faviconUrlList: string[]): Promise<Response> {
    const targetSizeNum = parseInt(targetSize, 10);
    const fetchPromises = faviconUrlList.map(async (url) => {
        const response = await fetch(new Request(url), { cf: { image: { format: "webp", height: targetSizeNum, width: targetSizeNum, fit: "contain" } } });
        if (response.ok && response.headers.get("Content-Type")?.startsWith("image/")) {
            // const headers = await modifyHeaders(response.headers);
            return resWithNewHeaders(response);
        } else {
            const error = new Error(`for: '${url}', status: ${response.status}, content-type: ${response.headers.get("Content-Type") || "unknown"}`)
            console.warn(error);
            throw error;
        }
    });

    try {
        const firstValidImage = await Promise.any(fetchPromises);
        return firstValidImage;
    } catch {
        throw new Error("No valid favicon found, all fetches failed");
    }
}

/**
 * Fetches the favicon from the page specified by the URL.
 * @param targetSize The desired size of the favicon.
 * @param targetUrl The URL of the page to fetch the favicon from.
 * @returns The fetched favicon as Response.
 * @throws If the target page cannot be fetched, is not an HTML document, or does not contain a valid favicon.
 */
async function fetchFaviconFromPageExec(targetSize: string, targetUrl: URL): Promise<Response> {
    // Fetch the target page and extract the favicon URL.
    const responsePage = await fetch(targetUrl.toString(), { redirect: "follow" });
    if (!responsePage.ok) {
        throw new Error(`target page status: ${responsePage.status}`);
    } else if (!responsePage.headers.get("Content-Type")?.startsWith("text/html")) {
        throw new Error(`target page is not an HTML document, type: ${responsePage.headers.get("Content-Type") || "unknown"}`);
    }

    // Parse the response as HTML.
    const html = await responsePage.text();

    // Look for favicon links in the HTML.
    const linkRegex = /<link\s+(?:[^>]*?\s+)?rel=["'](icon|shortcut icon|apple-touch-icon|apple-touch-icon-precomposed|apple-touch-startup-image)["'][^>]*?>/gi;
    let match;
    const faviconUrlList: string[] = [];
    while ((match = linkRegex.exec(html)) !== null) {
        const hrefRegex = /href=["']([^"']+)["']/i;
        const hrefMatch = hrefRegex.exec(match[0]);
        if (hrefMatch && hrefMatch[1]) {
            const faviconUrl = new URL(hrefMatch[1], targetUrl).toString();
            faviconUrlList.push(faviconUrl);
        }
    }

    if (faviconUrlList.length === 0) {
        throw new Error(`no favicon link foundon page ${targetUrl}, the page text 0-200: ${html.slice(0, 200)}`);
    }

    // Add the default favicon URL to the list
    const targetDomain = targetUrl.origin;
    const faviconIcoUrl = `${targetDomain}/favicon.ico`;
    faviconUrlList.push(faviconIcoUrl);

    return fetchFaviconUrlList(targetSize, faviconUrlList);
}

/**
 * Fetches the favicon from the page specified by the URL.
 * @param targetSize The desired size of the favicon.
 * @param targetUrl The URL of the page to fetch the favicon from.
 * @returns The fetched favicon as Response.
 **/
async function fetchFaviconFromPage(targetSize: string, targetUrl: URL): Promise<Response> {
    // race the fetch and the timeout
    const timeout = new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('timed out in ' + fetchFromPageTimeout + 's, aborted')), fetchFromPageTimeout * 1000)
    );

    return Promise.race([
        fetchFaviconFromPageExec(targetSize, targetUrl),
        timeout
    ]);
}

export { fetchFaviconFromPage };
