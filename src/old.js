async function handleRequest(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");
    let targetSize = url.searchParams.get("sz");
    if (targetSize === null) { targetSize = "32" }
    if (!targetUrl) {
        return new Response('Missing "url" parameter', {
            status: 400,
            headers: { "Content-Type": "text/plain" },
        });
    }
    try {//try fetch the favicon, ignore size
        const res = await fetch(targetUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
                "Referrer-Policy": "no-referrer-when-downgrade",
            },
        });
        const html = await res.text();
        const faviconTagRegex =
            /<link\s+(?:[^>]*?\s+)?rel="(?:icon|shortcut icon|apple-touch-icon|mask-icon|fluid-icon)"(?:\s+[^>]*?)?href="([^"]+)"/gi;
        const matches = html.match(faviconTagRegex);
        //return new Response(matches[0].toString(), {status:400, headers: {'content-type': 'text/plain'}})
        let link = null;
        if (matches && matches.length > 0) {
            // Choose the last matching <link> tag
            //link = matches[matches.length - 1];
            // Choose the first matching tag
            link = matches[0].toString().match(/href="(.+?)"/)?.[1];
        }
        if (link) {
            const hrefRegex = /href="([^"]+)"/i;
            const hrefMatches = hrefRegex.exec(link);
            const href = (hrefMatches && hrefMatches[1]) || null;

            let iconUrl;
            if (href && href.startsWith('http')) {
                // href is already an absolute URL, use it as-is
                iconUrl = new URL(href);
            } else if (href) {
                // href is a relative URL, combine with targetUrl to create absolute URL
                iconUrl = new URL(href, targetUrl);
            } else {
                // href is null or undefined, set iconUrl to null
                iconUrl = null;
            }
            const iconRes = await fetch(iconUrl);

            if (iconRes.ok) {
                const iconData = await iconRes.arrayBuffer();
                return new Response(iconData, {
                    headers: { "Content-Type": iconRes.headers.get("Content-Type") },
                });
            } else {
                return Response.redirect(href, 307);
            }
        } else {
            const iconUrl = new URL("/favicon.ico", targetUrl);
            const iconRes = await fetch(iconUrl, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
                    "Referrer-Policy": "no-referrer-when-downgrade",
                },
            });
            if (iconRes.ok) {
                const iconData = await iconRes.arrayBuffer();
                return new Response(iconData, {
                    headers: { "Content-Type": iconRes.headers.get("Content-Type") },
                });
            } else {
            }
        }
    }
    catch (e) {
        console.log(e);
        try {//fallback to use google api
            const googleApiBaseUrl = "https://t0.gstatic.com/faviconV2";
            const queryParams = new URLSearchParams({
                client: 'chrome_desktop',
                nfrp: '2',
                check_seen: 'true',
                size: targetSize,
                min_size: '16',
                max_size: '256',
                url: targetUrl,
            });
            const googleApiUrl = `${googleApiBaseUrl}?${queryParams}`;
            const googleResponse = await fetch(googleApiUrl);
            if (googleResponse.ok) {
                //return Response.redirect(googleApiUrl, 307);
                const iconData = await googleResponse.arrayBuffer();
                return new Response(iconData, {
                    headers: { "Content-Type": googleResponse.headers.get("Content-Type") },
                });
            } else if (googleResponse.status === 404) {
                return Response.redirect("https://he.net/favicon.ico", 307);
            } else {
                //return Response.redirect(googleApiUrl, 307);
            }
        } catch (e) {
            return new Response(e);
        }
    }

}

addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event.request));
});
