const commands = new Set(["snapshot", "draft", "fill", "post", "help"]);

const flagMap = {
  "comment-id": "commentId",
  confirmed: "confirmed",
  "out-dir": "outDir",
  "profile-dir": "profileDir",
  "reply-file": "replyFile",
  headless: "headless",
  input: "input",
  url: "url",
};

export function usage() {
  return `
Usage:
  node scripts/ih-reply.mjs snapshot --url <indie-hackers-post-url> [--profile-dir <path>] [--out-dir output]
  node scripts/ih-reply.mjs draft --input <snapshot.json> [--out-dir output]
  node scripts/ih-reply.mjs fill --url <post-url> --comment-id <id> --reply-file <reply.txt> [--profile-dir <path>]
  node scripts/ih-reply.mjs post --url <post-url> --comment-id <id> --reply-file <reply.txt> --confirmed [--profile-dir <path>]

Commands:
  snapshot   Capture visible public Indie Hackers comments into JSON.
  draft      Generate conservative founder reply drafts from a snapshot.
  fill       Fill a reply box but do not submit.
  post       Submit a public comment. Requires --confirmed and user confirmation outside this CLI.

Safety:
  Public comment posting is representational communication. The --confirmed flag is required for post,
  but it does not replace asking the user immediately before publishing.
`.trim();
}

export function parseArgs(argv) {
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    return {
      command: "help",
      confirmed: false,
      headless: false,
      outDir: "output",
    };
  }

  const [command = "help", ...tokens] = argv;
  if (!commands.has(command)) {
    throw new Error(`Unknown command: ${command}\n\n${usage()}`);
  }

  const args = {
    command,
    confirmed: false,
    headless: false,
    outDir: "output",
  };

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected argument: ${token}`);
    }

    const rawName = token.slice(2);
    const name = flagMap[rawName];
    if (!name) {
      throw new Error(`Unknown option: ${token}`);
    }

    if (["confirmed", "headless"].includes(name)) {
      args[name] = true;
      continue;
    }

    const value = tokens[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${token}`);
    }
    args[name] = value;
    index += 1;
  }

  return args;
}

export function assertCommandSafety(args) {
  if (args.command === "post" && !args.confirmed) {
    throw new Error("Refusing to post a public comment without --confirmed. Ask the user immediately before publishing.");
  }
}

export function assertRequiredArgs(args) {
  const requiredByCommand = {
    snapshot: ["url"],
    draft: ["input"],
    fill: ["url", "commentId", "replyFile"],
    post: ["url", "commentId", "replyFile"],
    help: [],
  };

  for (const name of requiredByCommand[args.command] ?? []) {
    if (!args[name]) {
      throw new Error(`Missing required option --${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`);
    }
  }
}
