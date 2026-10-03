import { fetchIcon } from "../utils";

async function fetchIconUseIconHorse(targetSize: string, targetUrl: URL) {
    // icon.horse only accepts the path form /icon/<domain>; the ?uri= query form returns 400
    const iconHorseApiBaseUrl = "https://icon.horse/icon/";
    const iconHorseApiUrl = `${iconHorseApiBaseUrl}${targetUrl.hostname}`;
    try {
        const targetSizeNum = parseInt(targetSize, 10);
        console.log(`fetching icon from icon horse: ${iconHorseApiUrl}, converting to ${targetSizeNum}x${targetSizeNum}...`);
        return await fetchIcon(iconHorseApiUrl, targetSizeNum);
    } catch (e) {
        throw e;
    }
}

export { fetchIconUseIconHorse };