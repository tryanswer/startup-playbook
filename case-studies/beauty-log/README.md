# Beauty Log Case Study

Beauty Log is the first field case study in this repository. It validates search trends and website SEO/ASO copy across countries and languages for color diagnosis, outfit advice, makeup advice, hairstyle advice, and personal image reports.

## Current Assets

- `tools/google-trends-seo/data/color-diagnosis-keywords.csv`: Multi-country, multilingual keyword seeds.
- `tools/google-trends-seo/scripts/google-trends.mjs`: Google Trends data fetcher.
- `tools/google-trends-seo/scripts/trends-report.mjs`: Trends-only report generator.
- `tools/google-trends-seo/scripts/keywords-everywhere.mjs`: Keywords Everywhere paid-metrics fetcher.

## Notes

- Google Trends provides relative interest from 0 to 100; it is not search volume.
- Keywords Everywhere can add search volume, CPC, competition, and 12-month trend data, but it requires paid credits.
- If only Google Trends is used, label SEO/ASO conclusions as trend signals rather than complete demand proof.
