# gh-proxy

GitHub 文件/API 加速代理，跑在 Cloudflare Snippets 上。单文件、零依赖，复制就能用。

> 代码是标准的 ES Module 格式（`export default { fetch }`），既可用于 Cloudflare Snippets，也能直接作为 Worker 部署。

## 能干什么

- `releases` / `archive` 下载加速
- `blob` / `raw` / `raw.githubusercontent.com` 文件反代
- `gist`、`api.github.com` 接口加速
- 自动处理重定向，带 CORS
- 可切换 jsDelivr CDN 跳转（`Config.jsdelivr`）
- 可开白名单（`whiteList`）

## 仓库结构

| 分支 | 内容 |
| --- | --- |
| `main` | `snippets.js`（Snippet 脚本）、`index.html`（落地页）、`README.md` |

落地页直接用 `main` 分支托管在 GitHub Pages。

## 部署

### Cloudflare Snippets

1. Cloudflare 控制台 → 你的域名 → Rules → Snippets。
2. 创建 Snippet，把 `snippets.js` 内容粘进去，保存。
3. 给 Snippet 配置「当传入请求匹配时」：选择「自定义筛选表达式」，字段选「主机名」、运算符选「等于」、值填 `gh.2719233.xyz`（换成你自己的域名）。
   表达式预览类似：`(http.host eq "gh.2719233.xyz")`。
4. 把开头的 `ASSET_URL` 改成你的落地页地址，比如 `https://<user>.github.io/gh-proxy/`。

注意：Snippets 挂在 Cloudflare 托管域名的路由上，没有独立的子域名；如果域名没托管在 Cloudflare，就用下面的 Worker 方式。

### 兼容：Cloudflare Workers

1. Cloudflare 控制台 → Workers & Pages → 创建 Worker（Module 格式）。
2. 把 `snippets.js` 内容粘进去，保存部署。
3. 同样把 `ASSET_URL` 改成你的落地页地址。
4. 用 `*.workers.dev` 域名或者绑自定义域名都行。

### 落地页（可选）

1. 仓库 Settings → Pages → Source 选 `main`，目录选 `/ (root)`。
2. 访问 `https://<user>.github.io/gh-proxy/`。

## 配置

```js
const ASSET_URL = 'https://<user>.github.io/gh-proxy/' // 落地页地址
const PREFIX = '/'                                     // 代理路径前缀

const Config = {
  jsdelivr: 0,  // 0: blob/raw 直连反代；1: 302 跳 jsDelivr
}
```

`whiteList` 为空就是不限制；填了字符串就只放行链接里带这些内容的请求：

```js
const whiteList = ['github.com/yourname', 'raw.githubusercontent.com/yourname']
```

## 支持的链接

| 类型 | 示例 |
| --- | --- |
| release 下载 | `github.com/user/repo/releases/download/v1.0.0/file.zip` |
| archive | `github.com/user/repo/archive/refs/heads/main.zip` |
| blob | `github.com/user/repo/blob/main/README.md` |
| raw | `raw.githubusercontent.com/user/repo/main/README.md` |
| gist | `gist.githubusercontent.com/user/xxx/raw/file.py` |
| api | `api.github.com/repos/user/repo` |
| tags | `github.com/user/repo/tags` |

链接可以不带 `https://`。不在上面的范围会回落到 `ASSET_URL` 静态资源。

## License

MIT
