import { resWithNewHeaders } from "../utils";

async function fetchIconUseGoogleApi(targetSize: string, targetUrl: URL): Promise<Response> {
    function constructGoogleApiUrl(targetSize: string, targetUrl: URL): string {
        const googleApiBaseUrl = "https://t3.gstatic.com/faviconV2";
        const queryParams = new URLSearchParams({
            // client: 'chrome_desktop',
            // nfrp: '2',
            // check_seen: 'true',
            client: 'SOCIAL',
            type: 'FAVICON',
            min_size: '16',
            max_size: '256',
            'fallback_opts': 'TYPE,SIZE,URL',
            size: '256',
            url: targetUrl.toString(),
        });
        const googleApiUrl = `${googleApiBaseUrl}?${queryParams}`;
        return googleApiUrl
    }

    try {
        // Fetch the favicon from Google's API.
        const googleApiUrl = constructGoogleApiUrl(targetSize, targetUrl);
        const targetSizeNum = parseInt(targetSize, 10);
        console.log(`fetching icon from google api: ${googleApiUrl}, converting to ${targetSizeNum}x${targetSizeNum}...`);
        const googleResponse = await fetch(new Request(googleApiUrl), { cf: { image: { format: "webp", height: targetSizeNum, width: targetSizeNum, fit: "contain" } } });

        if (!googleResponse.ok) {
            throw new Error(`status: ${googleResponse.status}, url ${googleApiUrl}`);
        }
        const contentType = googleResponse.headers.get("Content-Type") || "image/x-icon";
        if (!contentType.startsWith("image/")) {
            throw new Error(`invalid Content-Type received: ${contentType}, url: ${googleApiUrl}`);
        }
        // SUCCESS: Return the fetched icon.
        return resWithNewHeaders(googleResponse);
    } catch (e) {
        // rethrow so the page / icon horse fetchers still get a chance to run
        throw new Error(`google api failed: ${e}`);
    }
}

export { fetchIconUseGoogleApi };