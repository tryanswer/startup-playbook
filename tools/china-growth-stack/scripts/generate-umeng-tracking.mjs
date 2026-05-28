#!/usr/bin/env node

/**
 * Generate Umeng (友盟+) tracking code scaffolding for iOS and Android.
 * Outputs Swift, Kotlin, and event documentation files.
 *
 * Usage: node scripts/generate-umeng-tracking.mjs --app-key YOUR_APP_KEY [--output output/]
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));

function parseArgs() {
  const args = process.argv.slice(2);
  const options = { appKey: null, output: resolve(currentDir, '../output') };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--app-key' && args[i + 1]) options.appKey = args[++i];
    else if (args[i] === '--output' && args[i + 1]) options.output = resolve(args[++i]);
  }
  return options;
}

const EVENTS = [
  { id: 'sign_up', params: { method: 'String' }, description: '注册完成' },
  { id: 'onboarding_complete', params: { steps_completed: 'Int', time_seconds: 'Int' }, description: '引导流程完成' },
  { id: 'first_value_delivered', params: { feature_name: 'String', time_to_value_seconds: 'Int' }, description: '首次获得核心价值' },
  { id: 'feature_used', params: { feature_name: 'String', usage_count: 'Int' }, description: '使用核心功能' },
  { id: 'content_generated', params: { content_type: 'String' }, description: '生成内容' },
  { id: 'share', params: { method: 'String', content_type: 'String' }, description: '分享' },
  { id: 'feedback_submitted', params: { rating: 'String', feedback_type: 'String' }, description: '提交反馈' },
  { id: 'pricing_view', params: { source_page: 'String' }, description: '查看定价页' },
  { id: 'checkout_start', params: { plan_name: 'String', price: 'Double' }, description: '开始支付' },
  { id: 'purchase', params: { plan_name: 'String', price: 'Double', currency: 'String' }, description: '支付成功' },
  { id: 'subscription_renewed', params: { plan_name: 'String', period: 'String' }, description: '续费' },
  { id: 'refund', params: { transaction_id: 'String', reason: 'String' }, description: '退款' },
];

function generateSwiftCode(appKey) {
  const functions = EVENTS.map((event) => {
    const params = Object.entries(event.params);
    const funcParams = params.map(([key, type]) => {
      const swiftType = type === 'Int' ? 'Int' : type === 'Double' ? 'Double' : 'String';
      return `${key}: ${swiftType}`;
    }).join(', ');
    const dictEntries = params.map(([key, type]) => {
      const valueExpr = type === 'String' ? key : `String(${key})`;
      return `"${key}": ${valueExpr}`;
    }).join(', ');

    return `    /// ${event.description}
    static func track${toPascalCase(event.id)}(${funcParams}) {
        MobClick.event("${event.id}", attributes: [${dictEntries}])
    }`;
  }).join('\n\n');

  return `import UMCommon
import UMCommonLog

// MARK: - 友盟+ 初始化 (在 AppDelegate 中调用)

/// 在用户同意隐私政策后调用
func initUmeng() {
    UMConfigure.initWithAppkey("${appKey}", channel: "App Store")
    // Debug 模式下开启日志
    #if DEBUG
    UMCommonLogManager.setUp()
    #endif
}

// MARK: - AARRR 事件追踪

enum Analytics {

${functions}

}
`;
}

function generateKotlinCode(appKey) {
  const functions = EVENTS.map((event) => {
    const params = Object.entries(event.params);
    const funcParams = params.map(([key, type]) => {
      const kotlinType = type === 'Int' ? 'Int' : type === 'Double' ? 'Double' : 'String';
      return `${key}: ${kotlinType}`;
    }).join(', ');
    const mapEntries = params.map(([key, type]) => {
      const valueExpr = type === 'String' ? key : `${key}.toString()`;
      return `"${key}" to ${valueExpr}`;
    }).join(', ');

    return `    /** ${event.description} */
    fun track${toPascalCase(event.id)}(${funcParams}) {
        MobclickAgent.onEvent(context, "${event.id}", mapOf(${mapEntries}))
    }`;
  }).join('\n\n');

  return `import com.umeng.analytics.MobclickAgent
import com.umeng.commonsdk.UMConfigure
import android.content.Context

/**
 * 友盟+ 初始化 - 在 Application.onCreate 中，用户同意隐私政策后调用
 */
fun initUmeng(context: Context) {
    // 必须在用户同意隐私政策后调用
    UMConfigure.preInit(context, "${appKey}", "default")
    UMConfigure.init(context, "${appKey}", "default", UMConfigure.DEVICE_TYPE_PHONE, null)
}

/**
 * AARRR 事件追踪
 */
class Analytics(private val context: Context) {

${functions}

}
`;
}

function generateEventDoc() {
  const lines = [
    '# 友盟+ 事件定义\n',
    '| Event ID | 参数 | 说明 |',
    '|---|---|---|',
  ];
  for (const event of EVENTS) {
    const params = Object.entries(event.params).map(([k, v]) => `${k}:${v}`).join(', ');
    lines.push(`| \`${event.id}\` | ${params} | ${event.description} |`);
  }
  lines.push('');
  lines.push(`共 ${EVENTS.length} 个事件。友盟+免费版限制 500 个事件 ID。`);
  return lines.join('\n');
}

function toPascalCase(snakeStr) {
  return snakeStr.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

function main() {
  const options = parseArgs();
  if (!options.appKey) {
    console.error('Usage: node scripts/generate-umeng-tracking.mjs --app-key YOUR_UMENG_APPKEY [--output output/]');
    process.exit(1);
  }

  mkdirSync(options.output, { recursive: true });

  const swiftPath = resolve(options.output, 'UmengAnalytics.swift');
  const kotlinPath = resolve(options.output, 'UmengAnalytics.kt');
  const docPath = resolve(options.output, 'umeng-events.md');

  writeFileSync(swiftPath, generateSwiftCode(options.appKey), 'utf-8');
  writeFileSync(kotlinPath, generateKotlinCode(options.appKey), 'utf-8');
  writeFileSync(docPath, generateEventDoc(), 'utf-8');

  console.log(`\n✅ 友盟+ 追踪代码已生成:\n`);
  console.log(`   Swift:   ${swiftPath}`);
  console.log(`   Kotlin:  ${kotlinPath}`);
  console.log(`   Events:  ${docPath}`);
  console.log(`\n   AppKey: ${options.appKey}`);
  console.log(`   Events: ${EVENTS.length}`);
  console.log(`\n📋 下一步:`);
  console.log(`   1. 集成友盟+ SDK (iOS: pod 'UMCommon' / Android: implementation 'com.umeng.umsdk:common')`);
  console.log(`   2. 将生成的代码文件复制到项目中`);
  console.log(`   3. 在用户同意隐私政策后调用 initUmeng()`);
  console.log(`   4. 在友盟+后台 → 自定义事件 中确认数据上报\n`);
}

main();
