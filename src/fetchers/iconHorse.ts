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
                const headers = new Headers(await iconHorseResponse.headers);
                // set cache polocies
                headers.set("Cache-Control", "public, max-age=604800, immutable");
                return new Response(iconData, { headers });
            } else {
                // ERROR: Log the error for debugging purposes
                // console.error(`Invalid Content-Type received for favicon: ${contentType}`);
                throw new Error(`Invalid Content-Type received for favicon: ${contentType}`);
            }
        } else {
            throw new Error(`Failed to fetch icon from icon.horse, status: ${iconHorseResponse.status}`);
        }
    } catch (e) {
        throw new Error(e as string);
    }

}

export { fetchIconUseIconHorse };