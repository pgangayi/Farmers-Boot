/**
 * KV Namespace Configuration Helper
 *
 * ⚠️ DEPRECATED: This script is for legacy Cloudflare Workers deployment.
 * The project has migrated to Supabase Edge Functions.
 * KV namespaces are no longer used.
 *
 * This script is kept for reference only.
 *
 * Usage:
 *   node scripts/setup-kv-namespaces.js [--env production]
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configuration
const KV_NAMESPACES = [
  {
    binding: "RATE_LIMIT_KV",
    title: "farmers-boot-rate-limit",
    description: "Rate limiting data distributed across Workers",
  },
  {
    binding: "CACHE_KV",
    title: "farmers-boot-cache",
    description: "General application cache",
  },
  {
    binding: "SESSION_KV",
    title: "farmers-boot-sessions",
    description: "Session data fallback storage",
  },
];

const WRANGLER_FILE = path.join(__dirname, "..", "backend", "wrangler.toml");

/**
 * Execute shell command and return output
 */
function execCommand(command, options = {}) {
  try {
    const output = execSync(command, {
      encoding: "utf8",
      stdio: options.silent ? ["pipe", "pipe", "pipe"] : "inherit",
      cwd: options.cwd || path.join(__dirname, "..", "backend"),
      ...options,
    });
    return { success: true, output };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout,
      stderr: error.stderr,
    };
  }
}

/**
 * Check if wrangler is authenticated
 */
function checkAuthentication() {
  console.log("🔍 Checking Wrangler authentication... (deprecated)"););

  const result = execCommand("npx wrangler whoami", { silent: true });

  if (!result.success) {
    console.error("❌ Not authenticated with Wrangler.");
    console.log("\nPlease run: npx wrangler login (deprecated command)");
    process.exit(1);
  }

  console.log("✅ Authenticated with Wrangler (deprecated)");
  return true;
}

/**
 * Create KV namespace
 */
function createKVNamespace(namespace, env = null) {
  const envFlag = env ? `--env ${env}` : "";
  const title = env ? `${namespace.title}-${env}` : namespace.title;

  console.log(`\n📦 Creating KV namespace: ${namespace.binding}`);
  console.log(`   Title: ${title}`);

  // Check if namespace already exists
  const listResult = execCommand(`npx wrangler kv:namespace list ${envFlag}`, {
    silent: true,
  });

  if (listResult.success) {
    try {
      const namespaces = JSON.parse(listResult.output);
      const existing = namespaces.find((ns) => ns.title === title);

      if (existing) {
        console.log(`   ℹ️  Namespace already exists with ID: ${existing.id}`);
        return { success: true, id: existing.id, existing: true };
      }
    } catch (e) {
      // Continue to create
    }
  }

  // Create new namespace
  const result = execCommand(
    `npx wrangler kv:namespace create "${title}" ${envFlag}`,
    { silent: true },
  );

  if (!result.success) {
    console.error(`   ❌ Failed to create namespace: ${result.error}`);
    return { success: false, error: result.error };
  }

  // Extract ID from output
  const idMatch = result.output.match(/id = "([a-f0-9-]+)"/);
  if (idMatch) {
    const id = idMatch[1];
    console.log(`   ✅ Created with ID: ${id}`);
    return { success: true, id };
  }

  console.error("   ❌ Could not extract namespace ID from output");
  return { success: false, error: "ID extraction failed" };
}

/**
 * Create preview KV namespace
 */
function createPreviewKVNamespace(namespace) {
  const previewTitle = `${namespace.title}-preview`;

  console.log(`\n📦 Creating preview KV namespace: ${namespace.binding}`);
  console.log(`   Title: ${previewTitle}`);

  // Check if namespace already exists
  const listResult = execCommand("npx wrangler kv:namespace list", {
    silent: true,
  });

  if (listResult.success) {
    try {
      const namespaces = JSON.parse(listResult.output);
      const existing = namespaces.find((ns) => ns.title === previewTitle);

      if (existing) {
        console.log(
          `   ℹ️  Preview namespace already exists with ID: ${existing.id}`,
        );
        return { success: true, id: existing.id, existing: true };
      }
    } catch (e) {
      // Continue to create
    }
  }

  // Create new preview namespace
  const result = execCommand(
    `npx wrangler kv:namespace create "${previewTitle}"`,
    { silent: true },
  );

  if (!result.success) {
    console.error(`   ❌ Failed to create preview namespace: ${result.error}`);
    return { success: false, error: result.error };
  }

  // Extract ID from output
  const idMatch = result.output.match(/id = "([a-f0-9-]+)"/);
  if (idMatch) {
    const id = idMatch[1];
    console.log(`   ✅ Created preview with ID: ${id}`);
    return { success: true, id };
  }

  console.error("   ❌ Could not extract preview namespace ID from output");
  return { success: false, error: "ID extraction failed" };
}

/**
 * Update wrangler.toml with namespace IDs
 */
function updateWranglerConfig(results) {
  console.log("\n📝 Updating wrangler.toml...");

  if (!fs.existsSync(WRANGLER_FILE)) {
    console.error(`❌ wrangler.toml not found at ${WRANGLER_FILE}`);
    return false;
  }

  let content = fs.readFileSync(WRANGLER_FILE, "utf8");

  results.forEach((result) => {
    if (result.success && result.id) {
      // Update or add the namespace configuration
      const namespaceRegex = new RegExp(
        `(\\[\\[kv_namespaces\\]\\]\\s*\\n)?(binding = "${result.binding}"\\s*\\n)(id = "[^"]*")?`,
        "g",
      );

      const replacement = `[[kv_namespaces]]\nbinding = "${result.binding}"\nid = "${result.id}"`;

      if (content.includes(`binding = "${result.binding}"`)) {
        // Update existing
        content = content.replace(
          new RegExp(
            `(binding = "${result.binding}"\\s*\\n)(id = "[^"]*")?`,
            "g",
          ),
          `binding = "${result.binding}"\nid = "${result.id}"`,
        );
      } else {
        // Add new
        content += `\n[[kv_namespaces]]\nbinding = "${result.binding}"\nid = "${result.id}"\n`;
      }

      // Add preview_id if available
      if (result.previewId) {
        content = content.replace(
          new RegExp(
            `(binding = "${result.binding}"\\s*\\nid = "[^"]*")(\\s*\\n)?(preview_id = "[^"]*")?`,
            "g",
          ),
          `binding = "${result.binding}"\nid = "${result.id}"\npreview_id = "${result.previewId}"`,
        );
      }
    }
  });

  fs.writeFileSync(WRANGLER_FILE, content);
  console.log("✅ Updated wrangler.toml");
  return true;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const envIndex = args.indexOf("--env");
  const env = envIndex !== -1 ? args[envIndex + 1] : null;

  console.log("🚀 KV Namespace Setup Helper");
  console.log("============================\n");

  if (env) {
    console.log(`Environment: ${env}\n`);
  }

  // Check authentication
  checkAuthentication();

  // Create namespaces
  const results = [];

  for (const namespace of KV_NAMESPACES) {
    const result = createKVNamespace(namespace, env);

    if (result.success) {
      // Also create preview namespace for development
      if (!env) {
        const previewResult = createPreviewKVNamespace(namespace);
        if (previewResult.success) {
          result.previewId = previewResult.id;
        }
      }
    }

    results.push({
      ...result,
      binding: namespace.binding,
    });
  }

  // Update wrangler.toml
  const updated = updateWranglerConfig(results);

  // Summary
  console.log("\n📊 Summary");
  console.log("==========");

  let allSuccess = true;
  results.forEach((result) => {
    const status = result.success ? "✅" : "❌";
    const existing = result.existing ? " (existing)" : "";
    console.log(
      `${status} ${result.binding}: ${result.id || result.error}${existing}`,
    );

    if (result.previewId) {
      console.log(`   Preview: ${result.previewId}`);
    }

    if (!result.success) {
      allSuccess = false;
    }
  });

  if (updated) {
    console.log("\n✅ wrangler.toml updated with namespace IDs");
  }

  console.log("\n🎉 Setup complete!");

  if (!allSuccess) {
    console.log(
      "\n⚠️  Some namespaces could not be created. Please check the errors above.",
    );
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });
}

module.exports = {
  createKVNamespace,
  createPreviewKVNamespace,
  updateWranglerConfig,
  KV_NAMESPACES,
};
