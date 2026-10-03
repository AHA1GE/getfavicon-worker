import { resWithNewHeaders } from "../utils";

async function fetchIconUseIconHorse(targetSize: string, targetUrl: URL) {
    // icon.horse only accepts the path form /icon/<domain>; the ?uri= query form returns 400
    const iconHorseApiBaseUrl = "https://icon.horse/icon/";
    const iconHorseApiUrl = `${iconHorseApiBaseUrl}${targetUrl.hostname}`;
    try {
        const targetSizeNum = parseInt(targetSize, 10);
        const iconHorseResponse = await fetch((iconHorseApiUrl), { cf: { image: { format: "webp", height: targetSizeNum, width: targetSizeNum, fit: "contain" } } });
        if (iconHorseResponse.ok) {
            const contentType = iconHorseResponse.headers.get("Content-Type") || "image/x-icon";
            if (contentType.startsWith("image/")) {
                // SUCCESS: Return the fetched icon.
                // const iconData = await iconHorseResponse.arrayBuffer();
                // const headers = await modifyHeaders(await iconHorseResponse.headers)
                return resWithNewHeaders(iconHorseResponse);
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