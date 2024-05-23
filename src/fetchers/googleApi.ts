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
                // console.error(`google favicon api 404.`);
                throw 404;
                // return Response.redirect("https://he.net/favicon.ico", 307);
            } else {
                // ERROR: Log the error for debugging purposes
                // console.error(`Google api error, status: ${googleResponse.status}.`);
                throw new Error(`Google api error, status: ${googleResponse.status}.`);
            }

        }
    } catch (e) {
        // console.error(`Failed to fetch favicon for ${targetUrl}: ${e}`);
        if (e === 404) {
            throw new Error(`Failed for ${targetUrl}: 404 not found.`);
        } else {
            return new Response(constructGoogleApiUrl(targetSize, targetUrl), { status: 307 })
        }
    }
}

export { fetchIconUseGoogleApi };