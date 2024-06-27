import { modifyHeaders } from "../utils";

async function fetchIconUseGoogleApi(targetSize: string, targetUrl: URL): Promise<Response> {
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

    try {
        // Fetch the favicon from Google's API.
        const googleApiUrl = constructGoogleApiUrl(targetSize, targetUrl);
        const googleResponse = await fetch(googleApiUrl);

        if (googleResponse.ok) {
            const contentType = googleResponse.headers.get("Content-Type") || "image/x-icon";
            if (contentType.startsWith("image/")) {
                // SUCCESS: Return the fetched icon.
                const iconData = await googleResponse.arrayBuffer();
                const headers = await modifyHeaders(await googleResponse.headers)
                return new Response(iconData, { headers });
            } else {
                // ERROR: Log the error for debugging purposes
                // console.error(`Invalid Content-Type received for favicon: ${contentType}`);
                throw new Error(`invalid Content-Type received: ${contentType}, url: ${googleApiUrl}`);
            }
        } else {
            if (googleResponse.status === 404) {
                // ERROR: The favicon was not found. 
                // console.error(`google favicon api 404.`);
                throw 404;
                // return Response.redirect("https://he.net/favicon.ico", 307);
            } else {
                // ERROR: Log the error for debugging purposes
                // console.error(`Google api error, status: ${googleResponse.status}.`);
                throw new Error(`status: ${googleResponse.status}, url ${googleApiUrl}`);
            }

        }
    } catch (e) {
        // console.error(`Failed to fetch favicon for ${targetUrl}: ${e}`);
        if (e === 404) {
            throw new Error(`ststus 404. Continue to fetch from page.`);
        } else {
            console.log(`${e}, misc issue, redirect to google api.`);
            return new Response(constructGoogleApiUrl(targetSize, targetUrl), { status: 307 })
        }
    }
}

export { fetchIconUseGoogleApi };