async function fetchIconUseIconHorse(targetUrl: URL) {
    const iconHorseApiBaseUrl = "https://icon.horse/icon/";
    const queryParams = new URLSearchParams({
        // size: targetSize,
        uri: targetUrl.toString(),
    });
    const iconHorseApiUrl = `${iconHorseApiBaseUrl}?${queryParams}`;
    try {
        const iconHorseResponse = await fetch(iconHorseApiUrl);
        if (iconHorseResponse.ok) {
            const contentType = iconHorseResponse.headers.get("Content-Type") || "image/x-icon";
            if (contentType.startsWith("image/")) {
                // SUCCESS: Return the fetched icon.
                const iconData = await iconHorseResponse.arrayBuffer();
                return new Response(iconData, { headers: { "Content-Type": contentType } });
            } else {
                // ERROR: Log the error for debugging purposes
                // console.error(`Invalid Content-Type received for favicon: ${contentType}`);
                throw new Error(`Invalid Content-Type received for favicon: ${contentType}`);
            }
        } else {
            if (iconHorseResponse.status === 404) {
                // ERROR: The favicon was not found. 
                // console.error(`google favicon api 404.`);
                throw 404;
                // return Response.redirect("https://he.net/favicon.ico", 307);
            } else {
                // ERROR: Log the error for debugging purposes
                // console.error(`Google api error, status: ${googleResponse.status}.`);
                throw new Error(`Google api error, status: ${iconHorseResponse.status}.`);
            }
        }
    } catch (e) {
        if (e === 404) {
            throw new Error(`Failed for ${targetUrl}: 404 not found.`);
        } else {
            return new Response(iconHorseApiUrl, { status: 307 })
        }
    }

}

export { fetchIconUseIconHorse };