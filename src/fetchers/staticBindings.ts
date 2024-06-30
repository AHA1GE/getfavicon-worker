import { resWithNewHeaders } from "../utils";
import { Env } from "../index";

async function fetchIconBasedOnEnvVar(targetSize: string, targetUrl: URL, env: Env): Promise<Response> {
    const bindings = env.staticFaviconBindings;
    // bindinds = { "matchtargeturl.com" : "https://fetch.from.here/favicon.ico", "anothermatch.com": "https://fetch.from.here/favicon.ico}
    // for each binding in bindings, construct two new URLs from binding, compare the hostname of the targetUrl with the hostname of the binding.
    // if domain matches, fetch the icon from the binding's value, otherwise continue to the next binding.
    // if no match, reject the promise and throw "no static favicon binding matched"
    for (const binding in bindings) {
        const bindingUrl = new URL(bindings[binding]);
        if (bindingUrl.hostname === targetUrl.hostname) {
            try {
                console.log(`fetching icon from static binding: ${bindingUrl}, converting to ${targetSize}x${targetSize}...`);
                const targetSizeNum = parseInt(targetSize, 10);
                const bindingResponse = await fetch(new Request(bindingUrl.toString()), { cf: { image: { format: "webp", height: targetSizeNum, width: targetSizeNum, fit: "contain" } } });
                if (bindingResponse.ok) {
                    const contentType = bindingResponse.headers.get("Content-Type") || "image/x-icon";
                    if (contentType.startsWith("image/")) {
                        // SUCCESS: Return the fetched icon.
                        return resWithNewHeaders(bindingResponse);
                    } else {
                        throw new Error(`invalid Content-Type received: ${contentType}, url: ${bindingUrl}`);
                    }
                } else {
                    throw new Error(`status: ${bindingResponse.status}, url ${bindingUrl}`);
                }
            } catch (e) {
                throw e;
            }
        }
    }
    return Promise.reject("no static favicon binding matched");

}

export { fetchIconBasedOnEnvVar };