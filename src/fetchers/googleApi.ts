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

        if (googleResponse.ok) {
            const contentType = googleResponse.headers.get("Content-Type") || "image/x-icon";
            if (contentType.startsWith("image/")) {
                // SUCCESS: Return the fetched icon.
                // const iconData = await googleResponse.arrayBuffer();
                // const headers = await modifyHeaders(await googleResponse.headers)
                return resWithNewHeaders(googleResponse);
            } else {
                throw new Error(`invalid Content-Type received: ${contentType}, url: ${googleApiUrl}`);
            }
        } else {
            if (googleResponse.status === 404) {
                throw 404;
            } else {
                throw new Error(`status: ${googleResponse.status}, url ${googleApiUrl}`);
            }

        }
    } catch (e) {
        if (e === 404) {
            throw new Error(`ststus 404. Continue to fetch from page.`);
        } else {
            console.log(`${e}, misc issue, 307 redirect to google api should allow client see the icon.`);
            return new Response(constructGoogleApiUrl(targetSize, targetUrl), { status: 307 })
        }
    }
}

export { fetchIconUseGoogleApi };