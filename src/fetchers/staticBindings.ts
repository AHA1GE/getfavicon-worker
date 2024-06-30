import { resWithNewHeaders } from "../utils";
import { Env } from "../index";

async function fetchIconBasedOnEnvVar(targetSize: string, targetUrl: URL, env: Env): Promise<Response> {
    const bindings = env.staticFaviconBindings;
    // bindinds = { "matchtargeturl.com" : "https://fetch.from.here/favicon.ico", "anothermatch.com": "https://fetch.from.here/favicon.ico}
    // if domain matches, fetch the icon from the binding's value, otherwise no match, reject the promise with "no static favicon binding matched"

    console.log('matching bindings');
    console.log(bindings);
    const matchedUrl = bindings[targetUrl.hostname] || false;

    if (!matchedUrl) { return Promise.reject("no static favicon binding matched"); }

    const newTargetUrl = new URL(matchedUrl);
    console.log(`fetching icon from static binding: {'${targetUrl.hostname}':'${newTargetUrl}'}, converting to ${targetSize}x${targetSize}...`);

    try {
        const targetSizeNum = parseInt(targetSize, 10);
        const bindingResponse = await fetch(new Request(newTargetUrl.toString()), { cf: { image: { format: "webp", height: targetSizeNum, width: targetSizeNum, fit: "contain" } } });

        if (!bindingResponse.ok) {
            throw new Error(`status: ${bindingResponse.status}, url ${newTargetUrl}`);
        }

        const contentType = bindingResponse.headers.get("Content-Type") || "image/x-icon";
        if (!contentType.startsWith("image/")) {
            throw new Error(`invalid Content-Type received: ${contentType}, url: ${newTargetUrl}`);
        }

        // SUCCESS: Return the fetched icon with new headers.
        return resWithNewHeaders(bindingResponse);
    } catch (e) {
        throw e;
    }
}

export { fetchIconBasedOnEnvVar };