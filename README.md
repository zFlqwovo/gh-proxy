# gh-proxy

GitHub 文件与 API 加速代理，运行在 Cloudflare Snippets 或 Workers 上。单文件、零依赖。

## 特性

- 加速 Release / Archive 下载
- 反代 Blob / Raw 与 `raw.githubusercontent.com` 文件
- 加速 Gist 与 `api.github.com` 接口
- 自动跟随重定向，响应附带 CORS 头
- 可选 jsDelivr CDN 跳转与访问白名单

## 使用

把原始链接直接拼在代理地址后面：

```text
https://gh.2719233.xyz/https://github.com/user/repo/releases/download/v1.0.0/file.zip
https://gh.2719233.xyz/github.com/user/repo/blob/main/README.md
```

`https://` 可以省略；也可以打开落地页，把链接粘进输入框。

| 类型 | 示例路径 |
| --- | --- |
| Release / Archive | `github.com/user/repo/releases/download/v1.0.0/file.zip` |
| Blob / Raw | `github.com/user/repo/blob/main/README.md` |
| Raw | `raw.githubusercontent.com/user/repo/main/README.md` |
| Gist | `gist.githubusercontent.com/user/id/raw/file.py` |
| API | `api.github.com/repos/user/repo` |
| Tags | `github.com/user/repo/tags` |

不在以上范围的路径会回落到 `ASSET_URL` 指向的落地页。

## 部署

`snippets.js` 是标准 ES Module（`export default { fetch }`），两种方式通用。

### Cloudflare Snippets

1. 控制台 → 域名 → Rules → Snippets，新建 Snippet，粘贴 `snippets.js`。
2. 匹配规则选「自定义筛选表达式」，例如 `(http.host eq "gh.2719233.xyz")`。
3. 把脚本开头的 `ASSET_URL` 改成你的落地页地址。

> Snippets 只能挂在托管在 Cloudflare 的域名下；域名不在 Cloudflare 时请用 Worker 部署。

### Cloudflare Workers

1. 控制台 → Workers & Pages → 创建 Worker（Module 格式），粘贴 `snippets.js`。
2. 修改 `ASSET_URL` 后部署，通过 `*.workers.dev` 或自定义域名访问。

### 落地页（可选）

1. 仓库 Settings → Pages → Source 选 `main`、目录选 `(root)`。
2. 把 `index.html` 中的 `PROXY_ORIGIN` 改成你的代理地址。

## 配置

```js
const ASSET_URL = 'https://<user>.github.io/gh-proxy/' // 落地页地址
const PREFIX = '/'                                     // 代理路径前缀，路由为 example.com/gh/* 时填 '/gh/'

const Config = {
  jsdelivr: 0, // 0: 直连反代；1: 302 跳转 jsDelivr CDN
}

// 为空表示不限制；填写后仅放行链接中包含这些字符串的请求
const whiteList = []
```

## License

MIT
