const ASSET_URL = 'https://zFlqwovo.github.io/gh-proxy/'
const PREFIX = '/'

const Config = {
    jsdelivr: 0,   // 0: blob/raw 直连反代；1: 302 跳转到 jsDelivr CDN（含 raw.githubusercontent.com）
}

const whiteList = []

const PREFLIGHT_INIT = {
    status: 204,
    headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,POST,PUT,PATCH,TRACE,DELETE,HEAD,OPTIONS',
        'access-control-allow-headers': '*',
        'access-control-max-age': '1728000',
    },
}

const exp1 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:releases|archive)\/.*$/i
const exp2 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:blob|raw)\/.*$/i
const exp3 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:info|git-).*$/i
const exp4 = /^(?:https?:\/\/)?raw\.(?:githubusercontent|github)\.com\/.+?\/.+?\/.+?\/.+$/i
const exp5 = /^(?:https?:\/\/)?gist\.(?:githubusercontent|github)\.com\/.+?\/.+?\/.+$/i
const exp6 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/tags.*$/i
const exp7 = /^(?:https?:\/\/)?api\.github\.com\/.*$/i

const expBlobSeg = /^((?:https?:\/\/)?github\.com\/[^/]+\/[^/]+)\/(?:blob|raw)\//i

const PROXY_EXPS = [exp1, exp3, exp4, exp5, exp6, exp7]
const ALL_EXPS = [exp2, ...PROXY_EXPS]

function httpHandler(req, urlStr) {
    if (req.method === 'OPTIONS' && req.headers.has('access-control-request-headers')) {
        return new Response(null, PREFLIGHT_INIT)
    }

    if (whiteList.length && !whiteList.some(w => urlStr.includes(w))) {
        return new Response('blocked', { status: 403 })
    }

    if (!/^https?:\/\//i.test(urlStr)) {
        urlStr = 'https://' + urlStr
    }

    return proxy(new URL(urlStr), {
        method: req.method,
        headers: new Headers(req.headers),
        redirect: 'manual',
        body: req.body,
    })
}

async function proxy(urlObj, reqInit, depth = 0) {
    if (depth > 10) {
        return new Response('too many redirects', { status: 508 })
    }

    const res = await fetch(urlObj.href, reqInit)
    const resHdrNew = new Headers(res.headers)

    const loc = resHdrNew.get('location')
    if (loc) {
        if (ALL_EXPS.some(re => re.test(loc))) {
            resHdrNew.set('location', PREFIX + loc)
        } else if (!reqInit.body) {
            reqInit.redirect = 'follow'
            return proxy(new URL(loc, urlObj), reqInit, depth + 1)
        }
    }

    resHdrNew.set('access-control-expose-headers', '*')
    resHdrNew.set('access-control-allow-origin', '*')
    resHdrNew.delete('content-security-policy')
    resHdrNew.delete('content-security-policy-report-only')
    resHdrNew.delete('clear-site-data')

    return new Response(res.body, { status: res.status, headers: resHdrNew })
}

export default {
    async fetch(request) {
        try {
            const urlObj = new URL(request.url)

            const q = urlObj.searchParams.get('q')
            if (q && urlObj.pathname === PREFIX) {
                return Response.redirect('https://' + urlObj.host + PREFIX + q, 301)
            }

            const path = urlObj.href
                .slice(urlObj.origin.length + PREFIX.length)
                .replace(/^https?:\/+/, 'https://')

            if (exp2.test(path)) {
                if (Config.jsdelivr) {
                    const target = path
                        .replace(expBlobSeg, '$1@')
                        .replace(/^(?:https?:\/\/)?github\.com/i, 'https://cdn.jsdelivr.net/gh')
                    return Response.redirect(target, 302)
                }
                return await httpHandler(request, path.replace(expBlobSeg, '$1/raw/'))
            }

            if (Config.jsdelivr && exp4.test(path)) {
                const target = path
                    .replace(/(?<=com\/.+?\/.+?)\/(.+?\/)/, '@$1')
                    .replace(/^(?:https?:\/\/)?raw\.(?:githubusercontent|github)\.com/, 'https://cdn.jsdelivr.net/gh')
                return Response.redirect(target, 302)
            }

            if (PROXY_EXPS.some(re => re.test(path))) {
                return await httpHandler(request, path)
            }

            return await fetch(ASSET_URL + path)
        } catch (err) {
            return new Response('cfworker error:\n' + err.stack, {
                status: 502,
                headers: { 'access-control-allow-origin': '*' },
            })
        }
    },
}
