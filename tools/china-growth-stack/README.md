# China Growth Stack

面向中国大陆市场的 CLI 工具集。覆盖百度统计埋点生成、友盟+ App 追踪代码生成、百度搜索数据导出和每周增长报告。

## 前置检查

```bash
cd tools/china-growth-stack
npm run check-deps
```

检测 Node.js 版本，验证百度统计 API 连通性，并提示配置步骤。

## 配置

创建 `config.json`：

```json
{
  "baiduSiteId": "your-baidu-tongji-site-id",
  "baiduAccessToken": "your-baidu-tongji-access-token",
  "baiduSearchSiteUrl": "https://yourapp.com",
  "umengAppKey": "your-umeng-appkey"
}
```

获取凭证：
- 百度统计 API Token: https://tongji.baidu.com → 管理 → API
- 友盟+ AppKey: https://www.umeng.com → 应用管理

## 命令

### check-deps

检查系统依赖和 API 配置。

```bash
npm run check-deps
```

### generate-baidu-tracking

生成百度统计埋点代码（HTML snippet + JS helper），包含 AARRR 全链路事件。

```bash
npm run generate-baidu-tracking -- --site-id YOUR_SITE_ID
```

输出：
- `output/baidu-snippet.html` — 粘贴到 `<head>`
- `output/baidu-tracking.mjs` — 导入并调用追踪函数

### generate-umeng-tracking

生成友盟+ App 追踪代码（Swift + Kotlin + 事件文档）。

```bash
npm run generate-umeng-tracking -- --app-key YOUR_APPKEY
```

输出：
- `output/UmengAnalytics.swift` — iOS 追踪代码
- `output/UmengAnalytics.kt` — Android 追踪代码
- `output/umeng-events.md` — 事件定义文档

### pull-baidu-search

导出百度统计搜索关键词和流量来源数据。

```bash
npm run pull-baidu-search -- --config config.json --days 7 --output output/baidu-search.md
```

### weekly-report

生成每周增长报告，包含概览、搜索关键词、流量来源、热门页面和决策模板。

```bash
npm run weekly-report -- --config config.json
```
