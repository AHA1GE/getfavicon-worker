/**
 * Fetches the favicon from the page specified by the URL.
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
        throw new Error(`Target page is not an HTML document, type: ${responsePage.headers.get("Content-Type") || "unknown"}`);
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
        console.warn(`No favicon link found, the page text 0-200: ${html.slice(0, 200)}`);
        throw new Error(`No favicon link found on page ${targetUrl}`);
    }

    // Add the default favicon URL to the list
    const targetDomain = targetUrl.origin;
    const faviconIcoUrl = `${targetDomain}/favicon.ico`;
    faviconUrlList.push(faviconIcoUrl);

    return fetchFaviconUrlList(faviconUrlList);
}

/**
 * Fetches the first valid favicon from the list of URLs.
 * @param faviconUrlList The list of favicon URLs to fetch.
 * @returns The first valid favicon as Response.
 * @throws If no valid favicon is found.
 */
async function fetchFaviconUrlList(faviconUrlList: string[]): Promise<Response> {
    const fetchPromises = faviconUrlList.map(url =>
        fetch(url).then(response => {
            if (response.ok && response.headers.get("Content-Type")?.startsWith("image/")) {
                return response;
            }
            console.warn(`Fetch failed: '${url}', status: ${response.status}, content-type: ${response.headers.get("Content-Type") || "unknown"}`);
            throw new Error(`Invalid image or fetch failed for URL: ${url}`);
        }).catch(error => {
            console.error(`Error fetching favicon from ${url}: ${error.message}`);
            throw error;
        })
    );

    try {
        const firstValidImage = await Promise.any(fetchPromises);
        return firstValidImage;
    } catch (error) {
        throw new Error("No valid favicon found, all fetches failed");
    }
}

export { fetchFaviconFromPage };
