# getfavicon-worker
simple favicon getter on cf worker

## Usage

```
/url/<target>              e.g. /url/github.com
/url/<target>/sz/<size>    e.g. /url/github.com/sz/64
/sz/<size>/url/<target>    e.g. /sz/64/url/github.com
?url=<target>[&sz=<size>]  e.g. ?url=https://github.com/&sz=64
```

- `<target>` may be a bare domain (`github.com`) or a full URL (`https://github.com/`); in the path form a full URL must be percent-encoded.
- `<size>` defaults to 32 and is clamped to 1024.
- Response is a WebP image sized to `<size>`, or a 307 redirect to `/default` when no icon can be found.
- `staticFaviconBindings` in `wrangler.toml` maps specific hostnames to fixed icon URLs, tried before any remote fetcher.
