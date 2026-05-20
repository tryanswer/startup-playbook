# Beauty Log Case Study

Beauty Log 用作本仓库的第一个实战案例：围绕色彩诊断、穿搭建议、妆容建议、发型建议、个人形象报告等方向，验证不同国家和语言市场的搜索趋势与官网 SEO/ASO 文案。

## Current Assets

- `tools/google-trends-seo/data/color-diagnosis-keywords.csv`: 多国家、多语言关键词种子。
- `tools/google-trends-seo/scripts/google-trends.mjs`: Google Trends 数据抓取。
- `tools/google-trends-seo/scripts/trends-report.mjs`: Trends-only 报告生成。
- `tools/google-trends-seo/scripts/keywords-everywhere.mjs`: Keywords Everywhere 付费指标抓取。

## Notes

- Google Trends 只能提供 0-100 的相对热度，不等于搜索量。
- Keywords Everywhere 可补充搜索量、CPC、竞争度和 12 个月趋势，但需要付费额度。
- 如果只使用 Google Trends，SEO/ASO 结论要标记为趋势信号，不要当作完整需求证明。

