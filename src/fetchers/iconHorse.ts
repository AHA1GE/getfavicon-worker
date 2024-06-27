import { modifyHeaders, convert2webp } from "../utils";

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
                const headers = await modifyHeaders(await iconHorseResponse.headers)
                return convert2webp(new Response(iconData, { headers }));
            } else {
                throw new Error(`invalid Content-Type: ${contentType}, url: ${iconHorseApiUrl}`);
            }
        } else {
            throw new Error(`status: ${iconHorseResponse.status}, url: ${iconHorseApiUrl}`);
        }
    } catch (e) {
        throw e;
    }

}

export { fetchIconUseIconHorse };