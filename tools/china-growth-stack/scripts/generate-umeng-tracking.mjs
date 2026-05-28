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
  { id: 'sign_up', params: { method: 'String' }, description: 'Registration completed' },
  { id: 'onboarding_complete', params: { steps_completed: 'Int', time_seconds: 'Int' }, description: 'Onboarding flow completed' },
  { id: 'first_value_delivered', params: { feature_name: 'String', time_to_value_seconds: 'Int' }, description: 'First core value delivered' },
  { id: 'feature_used', params: { feature_name: 'String', usage_count: 'Int' }, description: 'Core feature used' },
  { id: 'content_generated', params: { content_type: 'String' }, description: 'Content generated' },
  { id: 'share', params: { method: 'String', content_type: 'String' }, description: 'Shared' },
  { id: 'feedback_submitted', params: { rating: 'String', feedback_type: 'String' }, description: 'Feedback submitted' },
  { id: 'pricing_view', params: { source_page: 'String' }, description: 'Pricing page viewed' },
  { id: 'checkout_start', params: { plan_name: 'String', price: 'Double' }, description: 'Checkout started' },
  { id: 'purchase', params: { plan_name: 'String', price: 'Double', currency: 'String' }, description: 'Purchase completed' },
  { id: 'subscription_renewed', params: { plan_name: 'String', period: 'String' }, description: 'Subscription renewed' },
  { id: 'refund', params: { transaction_id: 'String', reason: 'String' }, description: 'Refunded' },
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

// MARK: - Umeng+ (友盟+) Initialization (Call in AppDelegate)

/// Call after user agrees to privacy policy
func initUmeng() {
    UMConfigure.initWithAppkey("${appKey}", channel: "App Store")
    // Enable logs in Debug mode
    #if DEBUG
    UMCommonLogManager.setUp()
    #endif
}

// MARK: - AARRR Event Tracking

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
 * Umeng+ (友盟+) Initialization - Call in Application.onCreate after user agrees to privacy policy
 */
fun initUmeng(context: Context) {
    // Must be called after user agrees to privacy policy
    UMConfigure.preInit(context, "${appKey}", "default")
    UMConfigure.init(context, "${appKey}", "default", UMConfigure.DEVICE_TYPE_PHONE, null)
}

/**
 * AARRR Event Tracking
 */
class Analytics(private val context: Context) {

${functions}

}
`;
}

function generateEventDoc() {
  const lines = [
    '# Umeng+ (友盟+) Event Definitions\n',
    '| Event ID | Parameters | Description |',
    '|---|---|---|',
  ];
  for (const event of EVENTS) {
    const params = Object.entries(event.params).map(([k, v]) => `${k}:${v}`).join(', ');
    lines.push(`| \`${event.id}\` | ${params} | ${event.description} |`);
  }
  lines.push('');
  lines.push(`Total ${EVENTS.length} events. Umeng+ free version limits to 500 event IDs.`);
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

  console.log(`\n✅ Umeng+ (友盟+) tracking code generated:\n`);
  console.log(`   Swift:   ${swiftPath}`);
  console.log(`   Kotlin:  ${kotlinPath}`);
  console.log(`   Events:  ${docPath}`);
  console.log(`\n   AppKey: ${options.appKey}`);
  console.log(`   Events: ${EVENTS.length}`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Integrate Umeng+ SDK (iOS: pod 'UMCommon' / Android: implementation 'com.umeng.umsdk:common')`);
  console.log(`   2. Copy generated code files to your project`);
  console.log(`   3. Call initUmeng() after user agrees to privacy policy`);
  console.log(`   4. Confirm data reporting in Umeng+ backend → Custom Events\n`);
}

main();
