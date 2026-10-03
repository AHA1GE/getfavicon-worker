import { fetchIcon } from "../utils";

async function fetchIconUseGoogleApi(targetSize: string, targetUrl: URL): Promise<Response> {
    function constructGoogleApiUrl(targetSize: string, targetUrl: URL): string {
        const googleApiBaseUrl = "https://t3.gstatic.com/faviconV2";
        const queryParams = new URLSearchParams({
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
        return await fetchIcon(googleApiUrl, targetSizeNum);
    } catch (e) {
        // rethrow so the page / icon horse fetchers still get a chance to run
        throw new Error(`google api failed: ${e}`);
    }
}

export { fetchIconUseGoogleApi };