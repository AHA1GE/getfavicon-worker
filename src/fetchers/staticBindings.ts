import { fetchIcon, resWithNewHeaders } from "../utils";
import { Env } from "../index";

async function fetchIconBasedOnEnvVar(targetSize: string, targetUrl: URL, env: Env): Promise<Response> {
    const bindings = env.staticFaviconBindings;
    // bindinds = { "matchtargeturl.com" : "https://fetch.from.here/favicon.ico", "anothermatch.com": "https://fetch.from.here/favicon.ico}
    // if domain matches, fetch the icon from the binding's value, otherwise no match, reject the promise with "no static favicon binding matched"

    const matchedUrl = bindings[targetUrl.hostname] || false;

    if (!matchedUrl) { return Promise.reject("no static favicon binding matched."); }

    const newTargetUrl = new URL(matchedUrl);
    const targetSizeNum = parseInt(targetSize, 10);
    console.log(`fetching icon from static binding: {'${targetUrl.hostname}':'${newTargetUrl}'}, converting to ${targetSize}x${targetSize}...`);

    return fetchIcon(newTargetUrl.toString(), targetSizeNum);
}

export { fetchIconBasedOnEnvVar };