# AI Distribution Operating Playbook

Use this playbook when a founder wants to use AI for content distribution, community replies, social posts, journalist responses, cold outreach, or multi-channel growth operations.

The goal is not to replace the founder voice. The goal is to let AI handle the mechanical work while keeping the relationship-sensitive work under human control.

## Core Lesson

Most AI distribution stacks fail when they automate the part that actually converts.

For indie and early-stage products, AI is useful for:

- scanning channels;
- scoring opportunities;
- summarizing threads;
- drafting options;
- scheduling owned-channel content;
- preparing reporting digests;
- turning user evidence into reusable content variants.

AI is dangerous for:

- deciding which relationship matters;
- choosing the final stance;
- replying to customers;
- sending cold outreach;
- posting under another person's handle;
- naming a competitor;
- closing a sensitive reply;
- sending anything that can damage trust if one detail is wrong.

The operating model is:

> AI does the mechanical 70%. The founder owns the converting 30%.

## The 40-Action Sort

Before buying or building another AI distribution tool, list every distribution action done in a normal week. Label each row:

- `AI can`: safe to automate or draft.
- `Human owns`: requires founder judgment, voice, trust, or relationship memory.
- `Hybrid`: AI can prepare input, but a human must approve the final action.

Typical `AI can` rows:

- Scan Hacker News, Reddit, Indie Hackers, X, LinkedIn, newsletters, or search results.
- Cluster posts by topic, pain, and relevance.
- Summarize a thread.
- Suggest reply angles.
- Draft 3 reply variants.
- Draft post outlines.
- Create translation drafts.
- Generate UTM links.
- Produce a daily shipped/landed/converted digest.
- Compare channel metrics.
- Flag abnormal spikes or drops.

Typical `Human owns` rows:

- Pick the 1 or 2 drafts worth posting.
- Edit the final 30% of every public reply.
- Reply to customer DMs or support emails.
- Decide whether to mention the product.
- Decide whether a thread is worth joining.
- Cold outreach to named creators, journalists, podcasters, or partners.
- Any pitch that requires reading the recipient's prior work.
- Any reply that names another person by handle.
- Comments under the founder's own posts.
- Competitor positioning.
- Channel retirement decisions.
- The closing line of every important reply.

Typical `Hybrid` rows:

- AI prepares a founder-community comment, founder approves and posts manually.
- AI drafts a journalist response, founder edits and sends manually.
- AI summarizes support objections, founder chooses product or copy changes.
- AI drafts an SEO article outline, founder selects the angle and proof.

## Never-Write List

Every AI distribution system needs a "never-write" list. It is more valuable than a clever prompt because it prevents the model from breaking the channel voice.

Start with these defaults:

- Never start a reply with generic praise such as "Great question."
- Never use vague growth words such as "leverage", "unlock", "synergy", or "game-changer".
- Never name the product in the first 80% of a community reply unless the thread asks for product examples.
- Never paste a link unless the user asked for one or the context clearly allows it.
- Never end a short community reply with a forced question.
- Never cite a statistic without a named source.
- Never use fake certainty about market size, search volume, conversion, or customer sentiment.
- Never claim personal experience the founder does not actually have.
- Never use a tone that sounds like a brand account when the channel expects a human founder.
- Never auto-send a message that could end a relationship if one detail is wrong.

The list should grow from real failures. When an AI draft feels wrong, save the exact phrase and the reason it broke voice, trust, or channel norms.

## Human Approval Rule

Outbound distribution must block on human approval when any of these are true:

- It goes to a named person.
- It is a reply to a customer, journalist, creator, investor, partner, or moderator.
- It mentions a competitor.
- It mentions pricing, revenue, user data, privacy, security, health, legal, or a sensitive claim.
- It includes a product link.
- It uses facts from the recipient's prior work.
- It could be interpreted as spam if repeated.

No "low-risk auto-send" bucket is allowed for relationship-building channels.

Owned-channel scheduling can be automated only when the content has already been approved and the channel supports scheduled publishing.

## Minimal Stack

Start with scripts and review queues before buying a full AI distribution suite.

Recommended components:

1. Inbox or query monitor.
   - Polls email, RSS, saved searches, or community feeds.
   - Scores relevance against founder stances and target users.
   - Sends a short candidate list for manual review.

2. Thread scanner.
   - Finds relevant conversations across chosen channels.
   - Summarizes why the thread matters.
   - Suggests a reply angle, not a final action.

3. Draft pack generator.
   - Produces a small set of editable drafts per day.
   - Uses founder voice doc, evidence library, and never-write list.
   - Expects 30% manual editing before publishing.

4. Daily digest.
   - Summarizes what shipped, what got replies, what created visits or conversions, and what should be stopped.

5. Approval queue.
   - Every external reply, pitch, or comment waits for founder approval.
   - The queue should show source context, draft, risk flags, and one-click approve/reject.

## Measurement

Track distribution by outcome, not activity volume.

Required fields:

| Field | Purpose |
| --- | --- |
| Channel | Where the action happened |
| Surface | Thread, post, email query, search result, community, or creator |
| Action type | Scan, draft, reply, post, pitch, digest, follow-up |
| Owner | AI, human, or hybrid |
| Human minutes | Founder time spent |
| AI cost | Approximate model/API/tool cost |
| Published | Whether anything shipped |
| Link used | Whether a product link was included |
| Reply received | Whether a real person responded |
| Visit / signup / paid intent | Downstream signal |
| Notes | What worked, failed, or felt off |

Use `cost-per-outcome`, not just model spend:

- cost per meaningful reply;
- cost per qualified visit;
- cost per signup;
- cost per first activation;
- cost per paid intent;
- founder minutes per conversion.

AI is working when it reduces founder time on low-converting mechanical work without lowering trust, reply quality, or conversion.

AI is failing when it increases output volume but decreases replies, trust, or conversion.

## Distribution Decision Rules

- If a draft needs more than 70% rewriting, improve the context, voice doc, or never-write list before generating more drafts.
- If a channel produces replies but no activation or paid intent, keep learning but stop scaling.
- If a channel produces impressions but no replies, rewrite the angle or leave the channel.
- If AI-generated comments feel interchangeable, reduce posting volume and increase founder editing.
- If a relationship matters, the founder writes or approves the final message.
- If attribution is unclear, keep the experiment small.
- If paid tools cost more than the conversions they influence, cut them and rebuild the stack from scripts and manual approval.

## Example Weekly Workflow

Monday:

- Review last week's shipped actions and outcomes.
- Retire one low-quality channel or content format.
- Add new rules to the never-write list.

Daily:

- AI scans channels and proposes 5 opportunities.
- Founder picks 0 to 2.
- AI drafts variants.
- Founder edits final 30% and posts manually.
- AI logs action, source, and outcome.

Friday:

- Compare founder minutes, AI cost, replies, visits, signups, and paid intent.
- Decide continue / adjust / stop for each channel.
- Save one reusable lesson into the playbook or case study.

## Red Flags

Stop and redesign the workflow if:

- AI sends messages without review.
- The product name appears in most comments.
- Replies sound like a brand, not a person.
- The founder cannot explain which actions created conversions.
- The stack reports output volume but not downstream outcomes.
- AI is used to avoid the uncomfortable work of choosing, editing, replying, and deciding.

## Output

Use `templates/ai-distribution-action-sort.md` to record the weekly action split, never-write rules, approval gates, and outcome tracking.

The expected result is not more content everywhere. The expected result is a smaller number of founder-approved actions that preserve trust and create measurable activation or paid intent.
