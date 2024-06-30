import { resWithNewHeaders } from "../utils";
import { Env } from "../index";

async function fetchIconBasedOnEnvVar(targetSize: string, targetUrl: URL, env: Env): Promise<Response> {
    const bindings = env.staticFaviconBindings;
    // bindinds = { "matchtargeturl.com" : "https://fetch.from.here/favicon.ico", "anothermatch.com": "https://fetch.from.here/favicon.ico}
    // if domain matches, fetch the icon from the binding's value, otherwise no match, reject the promise with "no static favicon binding matched"
    let newTargetUrl;
    try {
        newTargetUrl = new URL(bindings[targetUrl.hostname]);
    } catch (e) {
        return Promise.reject("no static favicon binding matched");
    }
    try {
        console.log(`fetching icon from static binding: {'${targetUrl.hostname}':'${newTargetUrl}'}, converting to ${targetSize}x${targetSize}...`);
        const targetSizeNum = parseInt(targetSize, 10);
        const bindingResponse = await fetch(new Request(newTargetUrl.toString()), { cf: { image: { format: "webp", height: targetSizeNum, width: targetSizeNum, fit: "contain" } } });
        if (bindingResponse.ok) {
            const contentType = bindingResponse.headers.get("Content-Type") || "image/x-icon";
            if (contentType.startsWith("image/")) {
                // SUCCESS: Return the fetched icon.
                return resWithNewHeaders(bindingResponse);
            } else {
                throw new Error(`invalid Content-Type received: ${contentType}, url: ${newTargetUrl}`);
            }
        } else {
            throw new Error(`status: ${bindingResponse.status}, url ${newTargetUrl}`);
        }
    } catch (e) {
        throw e;
    }
}

export { fetchIconBasedOnEnvVar };