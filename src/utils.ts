async function convertParam(url: URL): Promise<{ targetSize: string; targetUrl: URL }> {
    let targetSize: string;
    let targetUrl: URL;

    if (url.search === "") {
        // Extract parameters from path
        const { extractedSize, extractedUrl } = extractParamsFromPath(url);
        targetSize = extractedSize;
        targetUrl = extractedUrl;
    } else {
        // Extract parameters from query parameters
        const { extractedSize, extractedUrl } = extractParamsFromQuery(url);
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
        // url first, set url index to 1
        urlFromPath = path[1];
        sizeFromPath = path[3] || "32";
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

    const { targetSize, targetUrl } = processParams(sizeFromPath, urlFromPath);

    return { extractedSize: targetSize, extractedUrl: targetUrl };
}

function extractParamsFromQuery(url: URL): { extractedSize: string; extractedUrl: URL } {
    const sizeFromQuery = url.searchParams.get("sz")?.trim() || url.searchParams.get("size")?.trim() || "32";
    const urlFromQuery = url.searchParams.get("url")?.trim() || "";

    const { targetSize, targetUrl } = processParams(sizeFromQuery, urlFromQuery);

    return { extractedSize: targetSize, extractedUrl: targetUrl };
}

function processParams(sizeString: string, urlString: string): { targetSize: string; targetUrl: URL } {
    let size = sizeString;
    const numericSize = parseInt(size, 10);
    if (isNaN(numericSize) || numericSize <= 0) {
        size = "32";
    } else {
        size = numericSize.toString();
    }

    if (!urlString) {
        throw new Error('Missing or empty "url" parameter');
    }

    let urlObj;
    try {
        // console.log(`Decoding URL: ${urlString}`);
        urlObj = new URL(decodeURIComponent(urlString));
    } catch (e) {
        throw new Error('Invalid "url" parameter');
    }

    return { targetSize: size, targetUrl: urlObj };
}








async function defaultSvgicon() {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-question-square-fill" viewBox="0 0 16 16">
    <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm3.496 6.033a.237.237 0 0 1-.24-.247C5.35 4.091 6.737 3.5 8.005 3.5c1.396 0 2.672.73 2.672 2.24 0 1.08-.635 1.594-1.244 2.057-.737.559-1.01.768-1.01 1.486v.105a.25.25 0 0 1-.25.25h-.81a.25.25 0 0 1-.25-.246l-.004-.217c-.038-.927.495-1.498 1.168-1.987.59-.444.965-.736.965-1.371 0-.825-.628-1.168-1.314-1.168-.803 0-1.253.478-1.342 1.134-.018.137-.128.25-.266.25h-.825zm2.325 6.443c-.584 0-1.009-.394-1.009-.927 0-.552.425-.94 1.01-.94.609 0 1.028.388 1.028.94 0 .533-.42.927-1.029.927"/>
  </svg>`;

    const headers = {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=604800, immutable',
    };

    return new Response(svgContent, {
        headers: headers,
        status: 200 // OK status
    });
}

async function modifyHeaders(headers: Headers): Promise<Headers> {
    try {
        const newHeaders = new Headers(headers);
        // set cache polocies
        newHeaders.set("Cache-Control", "public, max-age=604800, immutable");
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
        throw new Error(e as string);
    }
}

export { convertParam, defaultSvgicon, modifyHeaders };