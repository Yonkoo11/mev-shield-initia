# x402 + AgentKit Real Code Reference

Complete working code patterns from production implementations. Updated 2026-03-27.

---

## 1. X402 Hono Facilitator Server (`snc2work/x402-facilitator-hono`)

Full x402 payment facilitator built with Hono. Handles EVM and SVM networks.

### Main Server (`src/index.tsx`)
```typescript
import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import type { FC, PropsWithChildren } from "hono/jsx";
import type { Bindings } from "./types/bindings.js";
import { security, corsMiddleware } from "./middlewares/security.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.js";
import routes from "./routes/index.js";
import { serveStatic } from "@hono/node-server/serve-static";
import { serve } from "@hono/node-server";

const app = new Hono<{ Bindings: Bindings }>();

if (process.env.NODE_ENV !== "production") {
  app.use("/*", serveStatic({ root: "./public" }));
}

app.use("*", security());
app.use("*", corsMiddleware());
app.use("*", logger());
app.use("*", prettyJSON());

app.get("/", (c) => {
  return c.html(<TopPage />);
});

app.route("/", routes);

app.notFound(notFoundHandler);
app.onError(errorHandler);

export default app;

if (process.env.NODE_ENV !== "production") {
  const port = parseInt(process.env.PORT || "3002");
  console.log(`Server is running on http://localhost:${port}`);
  serve({
    fetch: app.fetch,
    port,
  });
}
```

### Facilitator Core (`src/lib/facilitator.ts`)
```typescript
import type { Chain } from "viem";
import { fromViemNameToX402Network } from "./utils.js";
import { verify as x402Verify, settle as x402Settle } from "x402/facilitator";
import { ZodError } from "zod";
import {
  PaymentRequirementsSchema,
  PaymentPayloadSchema,
  createConnectedClient,
  createSigner,
  isSvmSignerWallet,
  type VerifyResponse as X402VerifyResponse,
  type SettleResponse as X402SettleResponse,
} from "x402/types";

export class Facilitator {
  private readonly evmPrivateKey: string;
  private readonly svmPrivateKey: string;
  private readonly svmRpcUrls: Record<string, string>;
  private readonly evmNetworkMap: Map<string, Chain>;
  private readonly svmNetworkSet: Set<string>;

  constructor(options: CreateFacilitatorOptions) {
    if (!options.evmPrivateKey && !options.svmPrivateKey) {
      throw new Error(
        "Facilitator: at least one private key (EVM or SVM) is required"
      );
    }
    const hasEvmNetworks =
      options.evmNetworks && options.evmNetworks.length > 0;
    const hasSvmNetworks =
      options.svmNetworks && options.svmNetworks.length > 0;
    if (!hasEvmNetworks && !hasSvmNetworks) {
      throw new Error(
        "Facilitator: at least one network (EVM or SVM) is required"
      );
    }

    this.evmPrivateKey = options.evmPrivateKey || "";
    this.svmPrivateKey = options.svmPrivateKey || "";
    this.svmRpcUrls = options.svmRpcUrls || {};

    this.evmNetworkMap = new Map(
      (options.evmNetworks || []).map((chain: Chain) => [
        fromViemNameToX402Network(chain),
        chain,
      ])
    );
    this.svmNetworkSet = new Set(options.svmNetworks || []);
  }

  private isEvmSupported(network: string): boolean {
    return this.evmNetworkMap.has(network);
  }

  private isSvmSupported(network: string): boolean {
    return this.svmNetworkSet.has(network) && !!this.svmPrivateKey;
  }

  public async listSupportedKinds(): Promise<SupportedResponse> {
    const kinds: SupportedKind[] = [];

    // EVM
    for (const networkName of this.evmNetworkMap.keys()) {
      kinds.push({
        x402Version: 1,
        scheme: "exact",
        network: networkName,
      });
    }

    // SVM
    for (const network of this.svmNetworkSet) {
      if (this.svmPrivateKey) {
        try {
          const signer = await createSigner(network, this.svmPrivateKey);
          const feePayer = isSvmSignerWallet(signer)
            ? signer.address
            : undefined;

          if (!feePayer) {
            console.warn(`No feePayer available for ${network}, skipping`);
            continue;
          }

          kinds.push({
            x402Version: 1,
            scheme: "exact",
            network,
            extra: {
              feePayer,
            },
          });
        } catch (error) {
          console.error(`Failed to create signer for ${network}:`, error);
        }
      }
    }

    return { kinds };
  }

  public async verifyPayment(
    paymentPayload: unknown,
    paymentRequirements: unknown
  ): Promise<VerifyResult> {
    const validatedRequirements =
      PaymentRequirementsSchema.parse(paymentRequirements);
    const validatedPayload = PaymentPayloadSchema.parse(paymentPayload);
    const { network: requestedNetwork } = validatedRequirements;

    let resp: X402VerifyResponse;

    if (this.isEvmSupported(requestedNetwork)) {
      const client = createConnectedClient(requestedNetwork);
      resp = await x402Verify(
        client,
        validatedPayload,
        validatedRequirements,
        undefined
      );
    } else if (this.isSvmSupported(requestedNetwork)) {
      const rpcUrl = this.svmRpcUrls[requestedNetwork];
      const x402Config = rpcUrl ? { svmConfig: { rpcUrl } } : undefined;
      const signer = await createSigner(requestedNetwork, this.svmPrivateKey);
      resp = await x402Verify(
        signer,
        validatedPayload,
        validatedRequirements,
        x402Config
      );
    } else {
      return { isValid: false };
    }

    return {
      isValid: resp.isValid,
      payer: resp.payer,
    };
  }

  public async settlePayment(
    paymentPayload: unknown,
    paymentRequirements: unknown
  ): Promise<SettleResult> {
    const validatedRequirements =
      PaymentRequirementsSchema.parse(paymentRequirements);
    const validatedPayload = PaymentPayloadSchema.parse(paymentPayload);
    const { network: requestedNetwork } = validatedRequirements;

    let resp: X402SettleResponse;

    if (this.isEvmSupported(requestedNetwork)) {
      const signer = await createSigner(requestedNetwork, this.evmPrivateKey);
      resp = await x402Settle(
        signer,
        validatedPayload,
        validatedRequirements,
        undefined
      );
    } else if (this.isSvmSupported(requestedNetwork)) {
      const rpcUrl = this.svmRpcUrls[requestedNetwork];
      const x402Config = rpcUrl ? { svmConfig: { rpcUrl } } : undefined;
      const signer = await createSigner(requestedNetwork, this.svmPrivateKey);
      resp = await x402Settle(
        signer,
        validatedPayload,
        validatedRequirements,
        x402Config
      );
    } else {
      return {
        success: false,
        transaction: "",
        network: requestedNetwork,
        errorReason: "Network not supported by this facilitator",
      };
    }

    return {
      success: resp.success,
      errorReason: resp.errorReason,
      transaction: resp.transaction,
      network: resp.network,
      payer: resp.payer,
    };
  }

  public async handleRequest(request: HttpRequest): Promise<HttpResponse> {
    const { method, path, body } = request;

    if (method === "GET" && path === "/supported") {
      const supportedKinds = await this.listSupportedKinds();
      return {
        status: 200,
        body: supportedKinds,
      };
    }

    if (method === "POST" && path === "/verify") {
      try {
        const result = await this.verifyPayment(
          body?.paymentPayload,
          body?.paymentRequirements
        );

        return {
          status: 200,
          body: result,
        };
      } catch (error) {
        if (error instanceof ZodError) {
          return {
            status: 400,
            body: {
              error: "Validation error",
              message: "Invalid payment payload or requirements",
              details: error.issues,
            },
          };
        }
        return {
          status: 400,
          body: {
            error: "Failed to verify payment",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        };
      }
    }

    if (method === "POST" && path === "/settle") {
      try {
        const result = await this.settlePayment(
          body?.paymentPayload,
          body?.paymentRequirements
        );

        return {
          status: 200,
          body: result,
        };
      } catch (error) {
        if (error instanceof ZodError) {
          return {
            status: 400,
            body: {
              error: "Validation error",
              message: "Invalid payment payload or requirements",
              details: error.issues,
            },
          };
        }
        return {
          status: 400,
          body: {
            error: "Failed to settle payment",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        };
      }
    }

    return {
      status: 404,
      body: { error: "Not found" },
    };
  }
}
```

### Facilitator Factory (`src/lib/facilitator-factory.ts`)
```typescript
import { Facilitator } from "./facilitator.js";
import { baseSepolia, base } from "viem/chains";
import type { Chain } from "viem";
import type { Bindings } from "../types/bindings.js";

const NETWORK_MAP: Record<string, Chain> = {
  base: base,
  "base-sepolia": baseSepolia,
};

const SVM_NETWORKS = ["solana-devnet", "solana"] as const;
type SvmNetwork = (typeof SVM_NETWORKS)[number];

export function createFacilitator(env: Bindings): Facilitator {
  const networkNames = (env.SUPPORTED_NETWORKS || "")
    .split(",")
    .map((n: string) => n.trim());

  const evmNetworks: Chain[] = networkNames
    .map((name: string) => NETWORK_MAP[name])
    .filter((chain: Chain | undefined): chain is Chain => chain !== undefined);

  const svmNetworks: SvmNetwork[] = networkNames.filter(
    (name: string): name is SvmNetwork =>
      SVM_NETWORKS.includes(name as SvmNetwork)
  );

  const svmRpcUrls: Record<string, string> = {};
  if (env.SOLANA_RPC_URL) {
    svmRpcUrls["solana"] = env.SOLANA_RPC_URL;
  }
  if (env.SOLANA_DEVNET_RPC_URL) {
    svmRpcUrls["solana-devnet"] = env.SOLANA_DEVNET_RPC_URL;
  }

  if (evmNetworks.length === 0 && svmNetworks.length === 0) {
    throw new Error(
      "At least one valid network (EVM or SVM) must be configured"
    );
  }

  return new Facilitator({
    evmPrivateKey: env.EVM_PRIVATE_KEY,
    svmPrivateKey: env.SVM_PRIVATE_KEY,
    evmNetworks,
    svmNetworks,
    svmRpcUrls,
  });
}
```

### Routes (`src/routes/facilitator.ts`)
```typescript
import { Hono } from "hono";
import { ZodError } from "zod";
import type { Bindings } from "../types/bindings.js";
import { createFacilitator } from "../lib/facilitator-factory.js";
import dotenv from "dotenv";

dotenv.config();
const facilitatorInstance = createFacilitator(process.env as any);

const facilitatorRouter = new Hono<{ Bindings: Bindings }>();

// GET /supported
facilitatorRouter.get("/supported", async (c) => {
  const kinds = await facilitatorInstance.listSupportedKinds();
  return c.json(kinds);
});

// GET /verify
facilitatorRouter.get("/verify", (c) => {
  return c.json({
    endpoint: "/verify",
    description: "POST to verify x402 payments",
    body: {
      paymentPayload: "PaymentPayload",
      paymentRequirements: "PaymentRequirements",
    },
  });
});

// POST /verify
facilitatorRouter.post("/verify", async (c) => {
  try {
    const body = await c.req.json();
    const result = await facilitatorInstance.verifyPayment(
      body.paymentPayload,
      body.paymentRequirements
    );

    return c.json(result);
  } catch (error) {
    console.error("Verify error:", error);

    if (error instanceof ZodError) {
      return c.json(
        {
          error: "Validation error",
          message: "Invalid payment payload or requirements",
          details: error.issues,
        },
        400
      );
    }

    return c.json(
      {
        error: "Verification failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      400
    );
  }
});

// GET /settle
facilitatorRouter.get("/settle", (c) => {
  return c.json({
    endpoint: "/settle",
    description: "POST to settle x402 payments",
    body: {
      paymentPayload: "PaymentPayload",
      paymentRequirements: "PaymentRequirements",
    },
  });
});

// POST /settle
facilitatorRouter.post("/settle", async (c) => {
  try {
    const body = await c.req.json();
    const result = await facilitatorInstance.settlePayment(
      body.paymentPayload,
      body.paymentRequirements
    );

    return c.json(result);
  } catch (error) {
    console.error("Settle error:", error);

    if (error instanceof ZodError) {
      return c.json(
        {
          error: "Validation error",
          message: "Invalid payment payload or requirements",
          details: error.issues,
        },
        400
      );
    }

    return c.json(
      {
        error: "Settlement failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      400
    );
  }
});

export default facilitatorRouter;
```

### Security Middleware (`src/middlewares/security.ts`)
```typescript
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";
import type { Bindings } from "../types/bindings.js";

export const security = (): MiddlewareHandler => {
  return secureHeaders();
};

export const corsMiddleware = (): MiddlewareHandler<{ Bindings: Bindings }> => {
  return async (c, next) => {
    const allowedOrigins =
      c.env.NODE_ENV === "production"
        ? c.env.ALLOWED_ORIGINS?.split(",") || []
        : ["*"];

    return cors({
      origin: allowedOrigins,
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      maxAge: 86400,
    })(c, next);
  };
};
```

### Environment Variables (`.env.example`)
```bash
NODE_ENV=development
PORT=3002
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

SUPPORTED_NETWORKS=base,base-sepolia

SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_DEVNET_RPC_URL=https://api.devnet.solana.com
EVM_PRIVATE_KEY=0x...
SVM_PRIVATE_KEY=0x...
```

### Package.json
```json
{
  "name": "x402-facilitator-hono",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.tsx",
  "author": "develop",
  "license": "Apache-2.0",
  "files": [
    "dist"
  ],
  "scripts": {
    "dev": "concurrently \"yarn:dev:server\" \"yarn:css:watch\"",
    "dev:server": "tsx watch src/index.tsx",
    "css:watch": "yarn tailwindcss -i ./src/styles/input.css -o ./public/styles.css --watch",
    "build": "yarn tailwindcss -i ./src/styles/input.css -o ./public/styles.css --minify",
    "start": "tsx src/index.tsx",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  },
  "dependencies": {
    "@hono/node-server": "^1.19.6",
    "dotenv": "^17.2.3",
    "hono": "^4.10.3",
    "viem": "^2.38.4",
    "x402": "^0.7.0",
    "zod": "^4.1.12"
  },
  "devDependencies": {
    "@types/node": "^24.9.1",
    "@vitest/coverage-v8": "^1.6.0",
    "autoprefixer": "^10.4.21",
    "concurrently": "^9.2.1",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.0.0",
    "tsx": "^4.20.6",
    "typescript": "^5.9.3",
    "vitest": "^1.6.0"
  }
}
```

---

## 2. AgentKit + x402 Demo (`p2p-lanes/agentkit-x402-world`)

Complete example with World ID AgentBook discount logic on Base mainnet.

### Full Implementation (`src/index.ts`)
```typescript
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/http";
import {
  x402ResourceServer,
  x402HTTPResourceServer,
  paymentMiddlewareFromHTTPServer,
} from "@x402/hono";
import type { RouteConfig } from "@x402/core/server";
import { facilitator } from "@coinbase/x402";
import {
  declareAgentkitExtension,
  agentkitResourceServerExtension,
  createAgentkitHooks,
  createAgentBookVerifier,
  InMemoryAgentKitStorage,
  parseAgentkitHeader,
} from "@worldcoin/agentkit";

const NETWORK = "eip155:8453"; // Base mainnet
const PAY_TO = "0x4628c99Bbd18620B68B0927Af714AEDa7FAb967F";
const PORT = parseInt(process.env.PORT || "3000");

// AgentBook verifier on Base mainnet
const agentBook = createAgentBookVerifier({ network: "base" });
const storage = new InMemoryAgentKitStorage();

// Discount mode: 90% off for human-backed agents, unlimited uses
const hooks = createAgentkitHooks({
  storage,
  agentBook,
  mode: { type: "discount", percent: 90 },
});

// CDP facilitator for Base mainnet (reads CDP_API_KEY_ID / CDP_API_KEY_SECRET from env)
const facilitatorClient = new HTTPFacilitatorClient(facilitator);

// Resource server with x402 + agentkit extension
const resourceServer = new x402ResourceServer(facilitatorClient)
  .register(NETWORK, new ExactEvmScheme())
  .registerExtension(agentkitResourceServerExtension);

// Register verify failure hook for discount mode recovery
// Cast needed: agentkit expects resource to be non-optional, x402 types it as optional
if (hooks.verifyFailureHook) {
  resourceServer.onVerifyFailure(
    hooks.verifyFailureHook as Parameters<
      typeof resourceServer.onVerifyFailure
    >[0],
  );
}

// Route configuration
const routes: Record<string, RouteConfig> = {
  "POST /gm": {
    accepts: [
      {
        scheme: "exact",
        price: "$0.10",
        network: NETWORK,
        payTo: PAY_TO,
      },
    ],
    extensions: declareAgentkitExtension({
      statement:
        "Verify your agent is backed by a real human for a 90% discount",
      mode: { type: "discount", percent: 90 },
    }),
  },
};

const httpServer = new x402HTTPResourceServer(resourceServer, routes);
httpServer.onProtectedRequest(hooks.requestHook);

const app = new Hono();
app.use(paymentMiddlewareFromHTTPServer(httpServer));

// Protected endpoint
app.post("/gm", async (c) => {
  const agentkitHeader = c.req.header("agentkit");
  let isHuman = false;

  if (agentkitHeader) {
    try {
      const payload = parseAgentkitHeader(agentkitHeader);
      const humanId = await agentBook.lookupHuman(
        payload.address,
        payload.chainId,
      );
      isHuman = !!humanId;
    } catch {
      // Not a valid agentkit header or lookup failed — treat as bot
    }
  }

  if (isHuman) {
    return c.json({
      message: "gm human 🫡",
      discount: true,
      price: "$0.01",
    });
  }

  return c.json({
    message: "gm bot 🤖",
    discount: false,
    price: "$0.10",
  });
});

// Health check
app.get("/", (c) => {
  return c.json({
    service: "x402-agentkit-demo",
    status: "ok",
    endpoint: "POST /gm",
    pricing: {
      default: "$0.10 USDC",
      humanBacked: "$0.01 USDC (90% discount)",
    },
    network: "Base (eip155:8453)",
  });
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Server running on port ${info.port}`);
});
```

### Package.json
```json
{
  "name": "x402-agentkit-demo",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@coinbase/x402": "^2.1.0",
    "@hono/node-server": "^1",
    "@worldcoin/agentkit": "latest",
    "@x402/core": "latest",
    "@x402/evm": "latest",
    "@x402/hono": "latest",
    "hono": "^4"
  },
  "devDependencies": {
    "tsx": "^4",
    "typescript": "^5"
  }
}
```

---

## 3. Next.js x402 + AgentKit Example (`Must-be-Ash/world-x402-agentkit-example`)

Full Next.js frontend with x402 payment and AgentKit integration.

### Protected Endpoint (`app/api/random/route.ts`)
```typescript
import { NextResponse } from "next/server";

export async function GET() {
  const number = Math.floor(Math.random() * 9) + 1;
  return NextResponse.json({ number });
}
```

### Package.json
```json
{
  "name": "first-call-free",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "npx tsx test-endpoint.ts",
    "test:quick": "npx tsx test-first-call-free.ts",
    "test:paid": "npx tsx test-paid.ts"
  },
  "dependencies": {
    "@vercel/analytics": "^2.0.1",
    "@worldcoin/agentkit": "^0.1.5",
    "@x402/core": "^2.6.0",
    "@x402/evm": "^2.6.0",
    "@x402/extensions": "^2.6.0",
    "@x402/fetch": "^2.6.0",
    "@x402/next": "^2.6.0",
    "clsx": "^2.1.1",
    "framer-motion": "^12.36.0",
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "tailwind-merge": "^3.5.0",
    "uuid": "^13.0.0",
    "viem": "^2.47.2"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "dotenv": "^17.3.1",
    "eslint": "^9",
    "eslint-config-next": "16.1.6",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

---

## Key Import Patterns

### x402 Core Imports
```typescript
import { verify as x402Verify, settle as x402Settle } from "x402/facilitator";
import {
  PaymentRequirementsSchema,
  PaymentPayloadSchema,
  createConnectedClient,
  createSigner,
  isSvmSignerWallet,
} from "x402/types";
```

### Hono + x402 Integration
```typescript
import { Hono } from "hono";
import {
  x402ResourceServer,
  x402HTTPResourceServer,
  paymentMiddlewareFromHTTPServer,
} from "@x402/hono";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/http";
```

### AgentKit Integration
```typescript
import {
  declareAgentkitExtension,
  agentkitResourceServerExtension,
  createAgentkitHooks,
  createAgentBookVerifier,
  InMemoryAgentKitStorage,
  parseAgentkitHeader,
} from "@worldcoin/agentkit";
```

### Coinbase Facilitator
```typescript
import { facilitator } from "@coinbase/x402";
import { HTTPFacilitatorClient } from "@x402/core/http";

const facilitatorClient = new HTTPFacilitatorClient(facilitator);
```

---

## Facilitator URLs & Networks

### Supported Networks

**EVM:**
- `base` - Base mainnet
- `base-sepolia` - Base testnet
- Custom chains via Viem

**SVM (Solana):**
- `solana` - Mainnet
- `solana-devnet` - Devnet

### Network IDs
- Base Mainnet: `eip155:8453`
- Base Sepolia: `eip155:84532`

### Facilitator Configuration
```typescript
// CDP Facilitator (Coinbase-hosted)
const facilitatorClient = new HTTPFacilitatorClient(facilitator);
// Uses CDP_API_KEY_ID and CDP_API_KEY_SECRET from env

// Custom Hono Facilitator
const facilitatorClient = new HTTPFacilitatorClient(
  "https://your-facilitator.com"
);
```

---

## AgentKit Discount Modes

### Mode 1: Discount Mode (90% Off)
```typescript
const hooks = createAgentkitHooks({
  storage: new InMemoryAgentKitStorage(),
  agentBook: createAgentBookVerifier({ network: "base" }),
  mode: { type: "discount", percent: 90 },
});
```
- Human-backed agents: 90% discount automatically applied
- Non-human agents: Pay full price
- Unlimited uses for humans (within trial budget)

### Mode 2: Limited Free Uses
```typescript
const hooks = createAgentkitHooks({
  storage: new InMemoryAgentKitStorage(),
  agentBook: createAgentBookVerifier({ network: "base" }),
  mode: { type: "free_credits", credits: 5 },
});
```
- First N calls free for humans
- After free credits exhausted: pay per call
- Non-humans: always pay

---

## AgentKit Header Verification

```typescript
const agentkitHeader = c.req.header("agentkit");

if (agentkitHeader) {
  try {
    const payload = parseAgentkitHeader(agentkitHeader);
    const humanId = await agentBook.lookupHuman(
      payload.address,
      payload.chainId,
    );
    const isHuman = !!humanId;
  } catch (error) {
    // Invalid header or lookup failed
  }
}
```

---

## Request/Response Flow

### x402 Payment Flow
1. Client requests protected endpoint without payment
2. Server returns 402 with payment challenge
3. Client verifies challenge and settles payment
4. Client resends request with payment proof
5. Server verifies payment and returns resource

### AgentKit Integration Flow
1. Client includes `agentkit` header
2. Server parses header and verifies human identity
3. If human + credits available: grant access
4. If human + no credits: apply discount to payment
5. If non-human: full payment required

---

## Test Examples

### Testing x402 Endpoint
```bash
curl -X POST http://localhost:3000/gm \
  -H "Content-Type: application/json"
# Returns 402 with payment challenge
```

### Testing with AgentKit Header
```bash
curl -X POST http://localhost:3000/gm \
  -H "Content-Type: application/json" \
  -H "agentkit: <agentkit_header_value>"
# Returns 200 if human-backed
# Returns 402 with discount if human but credits exhausted
```

---

## Repository Links

- **Hono Facilitator:** https://github.com/snc2work/x402-facilitator-hono
- **AgentKit + x402 Demo:** https://github.com/p2p-lanes/agentkit-x402-world
- **Next.js Example:** https://github.com/Must-be-Ash/world-x402-agentkit-example
- **Awesome x402:** https://github.com/xpaysh/awesome-x402 (curated resource list)

---

## Key Takeaways

1. **x402 verification & settlement** happen server-side via facilitator
2. **AgentKit hooks** integrate directly with x402 resource server
3. **Discount logic** is configurable (90% off, free credits, etc.)
4. **Network support** includes Base, Solana, and custom EVM chains
5. **Hono** is the fastest framework for x402 servers (typed bindings, middleware-first)
6. **CDP facilitator** simplifies Coinbase wallet integration
7. **AgentBook lookups** verify human identity on-chain
