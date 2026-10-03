async function convertParam(url: URL): Promise<{ targetSize: string; targetUrl: URL }> {
    // Tool func 1
    function extractParamsFromPath(url: URL): { extractedSize: string; extractedUrl: URL } {
        const path = url.pathname.split("/").filter((x) => x !== "");
        if (path.length === 0) {
            throw new Error('Missing "url" parameter from path');
        } else if (path.length === 1) {
            throw new Error('Missing "url" parameter from path');
        }
        let urlFromPath;
        let sizeFromPath;

        if (path[0] === "url") {
            // url first, size (if present) must follow a sz/size keyword
            urlFromPath = path[1];
            sizeFromPath = (path[2] === "sz" || path[2] === "size") ? (path[3] || "32") : "32";
        } else if ((path[0] === "sz") || (path[0] === "size")) {
            // size first, set size index to 1
            sizeFromPath = path[1];
            if (path[2] !== "url") {
                throw new Error('Missing "url" parameter from path');
            }
            urlFromPath = path[3]
        } else {
            throw new Error('Missing "url" parameter from path');
        }

        // pathname is not auto-decoded, so the target url must be decoded here
        let decodedUrlFromPath;
        try {
            decodedUrlFromPath = decodeURIComponent(urlFromPath);
        } catch (e) {
            throw new Error('Invalid "url" parameter');
        }

        const { targetSize, targetUrl } = processParams(sizeFromPath, decodedUrlFromPath);

        return { extractedSize: targetSize, extractedUrl: targetUrl };
    }
    // Tool func 2
    function extractParamsFromQuery(url: URL): { extractedSize: string; extractedUrl: URL } {
        const sizeFromQuery = url.searchParams.get("sz")?.trim() || url.searchParams.get("size")?.trim() || "32";
        const urlFromQuery = url.searchParams.get("url")?.trim() || "";

        // searchParams.get() already decodes once; decoding again would break urls containing literal '%'
        const { targetSize, targetUrl } = processParams(sizeFromQuery, urlFromQuery);

        return { extractedSize: targetSize, extractedUrl: targetUrl };
    }
    // Tool func 3
    function processParams(sizeString: string, urlString: string): { targetSize: string; targetUrl: URL } {
        // clamp size so Cloudflare Image Resizing never rejects oversized requests
        const numericSize = parseInt(sizeString, 10);
        const size = (isNaN(numericSize) || numericSize <= 0) ? "32" : Math.min(numericSize, 1024).toString();

        if (!urlString) {
            throw new Error('Missing or empty "url" parameter');
        }

        let urlObj;
        try {
            urlObj = new URL(urlString);
        } catch (e) {
            try {
                // accept bare hosts like "example.com"
                urlObj = new URL("https://" + urlString);
            } catch (e2) {
                throw new Error('Invalid "url" parameter');
            }
        }

        return { targetSize: size, targetUrl: urlObj };
    }

    let targetSize: string;
    let targetUrl: URL;

    if (url.searchParams.has("url")) {
        // Extract parameters from query parameters
        const { extractedSize, extractedUrl } = extractParamsFromQuery(url);
        targetSize = extractedSize;
        targetUrl = extractedUrl;
    } else {
        // Extract parameters from path
        const { extractedSize, extractedUrl } = extractParamsFromPath(url);
        targetSize = extractedSize;
        targetUrl = extractedUrl;
    }

    // if target url's domain equals to current domain, return 404
    if (targetUrl.hostname === url.hostname) {
        throw new Error("Invalid target URL");
    }

    console.log(`parameters: size=${targetSize}, url=${targetUrl.toString()}`);
    return { targetSize, targetUrl };
}


async function defaultSvgicon() {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="27" fill="none" viewBox="0 0 60 27" style="width:100%;height:28px"><g clip-path="url(#a)"><path fill="#FBAD41" d="M47.927 11.725c-.2 0-.397.007-.594.014a.271.271 0 0 0-.094.022.33.33 0 0 0-.214.229l-.846 2.924c-.365 1.257-.23 2.418.383 3.27.563.789 1.498 1.251 2.634 1.305l4.589.276a.41.41 0 0 1 .326.179.44.44 0 0 1 .046.39.58.58 0 0 1-.498.384l-4.768.276c-2.59.118-5.377 2.21-6.355 4.761l-.344.9a.253.253 0 0 0 .225.343H58.84a.435.435 0 0 0 .422-.315 11.69 11.69 0 0 0 .437-3.185c0-6.5-5.266-11.766-11.764-11.766"></path><path fill="#F6821F" d="m40.76 26.62.304-1.057c.365-1.258.229-2.418-.384-3.271-.562-.788-1.497-1.25-2.633-1.304l-21.527-.276a.426.426 0 0 1-.34-.18.44.44 0 0 1-.047-.39.581.581 0 0 1 .502-.383l21.727-.276c2.58-.118 5.367-2.21 6.345-4.761l1.24-3.24a.814.814 0 0 0 .035-.43C44.572 4.733 38.925 0 32.172 0c-6.223 0-11.503 4.016-13.399 9.598a6.344 6.344 0 0 0-4.467-1.236 6.367 6.367 0 0 0-5.517 7.91C3.913 16.417 0 20.412 0 25.32c0 .445.032.882.097 1.308a.418.418 0 0 0 .415.362H40.268a.517.517 0 0 0 .491-.376"></path></g><defs><clipPath id="a"><path fill="#FFF" d="M0 0h60v27H0z"></path></clipPath></defs></svg>`;

    const headers = new Headers();
    headers.set("Content-Type", "image/svg+xml");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(svgContent, {
        headers: headers,
        status: 200 // OK status
    });
}

async function modifyHeaders(headers: Headers): Promise<Headers> {
    try {
        const newHeaders = new Headers(headers);
        // set cache polocies
        newHeaders.set("Cache-Control", "public, max-age=31536000, immutable");
        // remove unneeded http(html) headers: Content-Security-Policy, X-Content-Security-Policy, X-UA-Compatible, X-WebKit-CSP, X-XSS-Protection
        newHeaders.delete("Content-Security-Policy");
        newHeaders.delete("X-Content-Security-Policy");
        newHeaders.delete("X-UA-Compatible");
        newHeaders.delete("X-WebKit-CSP");
        newHeaders.delete("X-XSS-Protection");
        // remove expires header since cache-control is set
        newHeaders.delete("Expires");
        return newHeaders;
    } catch (e) {
        throw e;
    }
}


async function resWithNewHeaders(res: Response, contentType: string): Promise<Response> {
    // set new headers
    const headers = await modifyHeaders(res.headers);
    headers.set("Content-Type", contentType);
    const newRes = new Response(res.body, { headers: headers, })
    // return new response with new headers and cf options
    return newRes;
}

/**
 * Fetches an icon url and converts it to webp of the requested size.
 * Image Resizing passes SVG through unconverted and cannot process .ico sources at all,
 * so those are served as the original bytes with their true content type.
 * @param url The icon url to fetch.
 * @param sizeNum The desired width/height.
 * @returns The icon response.
 * @throws If no valid image can be fetched.
 */
async function fetchIcon(url: string, sizeNum: number): Promise<Response> {
    try {
        const res = await fetch(new Request(url), { cf: { image: { format: "webp", height: sizeNum, width: sizeNum, fit: "contain" } } });
        if (!res.ok) {
            throw new Error(`status: ${res.status}, url ${url}`);
        }
        const contentType = res.headers.get("Content-Type") || "";
        if (!contentType.startsWith("image/")) {
            throw new Error(`invalid content-type: ${contentType}, url ${url}`);
        }
        if (contentType.startsWith("image/svg")) {
            return resWithNewHeaders(res, "image/svg+xml");
        }
        return resWithNewHeaders(res, "image/webp");
    } catch (e) {
        // retry without resizing so sources Image Resizing rejects (e.g. .ico) still work
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`status: ${res.status}, url ${url}`);
        }
        const contentType = res.headers.get("Content-Type") || "";
        if (!contentType.startsWith("image/")) {
            throw new Error(`invalid content-type: ${contentType}, url ${url}`);
        }
        return resWithNewHeaders(res, contentType);
    }
}

export { convertParam, defaultSvgicon, modifyHeaders, resWithNewHeaders, fetchIcon };