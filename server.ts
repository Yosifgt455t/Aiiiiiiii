import express from "express";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock");

const PREMIUM_USERS_FILE = path.join(__dirname, "premium_users.json");

// Helper to read/write premium users
const getPremiumUsers = (): string[] => {
  if (!fs.existsSync(PREMIUM_USERS_FILE)) {
    console.log("Premium users file does not exist, creating empty list.");
    return [];
  }
  try {
    const data = fs.readFileSync(PREMIUM_USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    console.error("Error reading premium users file:", e);
    return [];
  }
};

const addPremiumUser = (email: string) => {
  try {
    const users = getPremiumUsers();
    if (!users.includes(email)) {
      users.push(email);
      fs.writeFileSync(PREMIUM_USERS_FILE, JSON.stringify(users));
      console.log(`Added ${email} to premium users.`);
    }
  } catch (e) {
    console.error("Error adding premium user:", e);
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Stripe Webhook needs raw body
  app.post(
    "/api/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      console.log("Received Stripe Webhook");
      const sig = req.headers["stripe-signature"];
      let event;

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig as string,
          process.env.STRIPE_WEBHOOK_SECRET || ""
        );
      } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_details?.email;
        if (customerEmail) {
          addPremiumUser(customerEmail);
          console.log(`User ${customerEmail} is now Premium!`);
        }
      }

      res.json({ received: true });
    }
  );

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/user-status", (req, res) => {
    const email = req.query.email as string;
    console.log(`Checking status for: ${email}`);
    if (!email) return res.status(400).json({ error: "Email required" });
    const isPremium = getPremiumUsers().includes(email);
    res.json({ isPremium });
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { email } = req.body;
      console.log(`[Checkout] Request received for: ${email}`);
      
      if (!email) {
        console.error("[Checkout] Error: Email is missing in request body");
        return res.status(400).json({ error: "Email required" });
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        console.warn("[Checkout] Warning: STRIPE_SECRET_KEY is not set, using mock mode.");
        // In mock mode, we can't actually create a session, but we can return an error that's clearer
        return res.status(500).json({ error: "Stripe is not configured on the server." });
      }

      console.log(`[Checkout] Creating session for: ${email}`);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "نبراس بريميوم (Nebras Premium)",
                description: "اشتراك مدى الحياة في المدرس الخصوصي الذكي",
              },
              unit_amount: 1000, // 10.00 USD
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer_email: email,
        success_url: `${process.env.APP_URL || req.headers.origin || "http://localhost:3000"}?success=true`,
        cancel_url: `${process.env.APP_URL || req.headers.origin || "http://localhost:3000"}?canceled=true`,
      });

      console.log(`[Checkout] Session created: ${session.id}`);
      res.json({ url: session.url });
    } catch (e: any) {
      console.error("[Checkout] Stripe Session Error:", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/cancel-subscription", (req, res) => {
    const { email } = req.body;
    console.log(`Canceling subscription for: ${email}`);
    if (!email) return res.status(400).json({ error: "Email required" });

    try {
      const users = getPremiumUsers();
      const filtered = users.filter((u) => u !== email);
      if (users.length !== filtered.length) {
        fs.writeFileSync(PREMIUM_USERS_FILE, JSON.stringify(filtered));
        console.log(`Removed ${email} from premium users.`);
        res.json({ success: true, message: "Subscription canceled successfully" });
      } else {
        res.status(404).json({ error: "User not found in premium list" });
      }
    } catch (e: any) {
      console.error("Error canceling subscription:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite in middleware mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files from dist...");
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
