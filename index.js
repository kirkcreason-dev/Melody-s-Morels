// functions/index.js — Firebase Cloud Functions
// Handles Stripe webhooks to grant/revoke premium access.
//
// DEPLOY: firebase deploy --only functions
// In Stripe dashboard → Webhooks → add endpoint:
//   https://us-central1-YOUR_PROJECT.cloudfunctions.net/stripeWebhook
//   Events: customer.subscription.created, customer.subscription.deleted, customer.subscription.updated

const functions = require("firebase-functions");
const admin     = require("firebase-admin");
const stripe    = require("stripe")(functions.config().stripe.secret);

admin.initializeApp();
const db = admin.firestore();

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig     = req.headers["stripe-signature"];
  const secret  = functions.config().stripe.webhook_secret;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, secret);
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).send("Webhook Error: " + err.message);
  }

  const sub = event.data.object;

  // Find the Firebase user whose email matches the Stripe customer
  async function findUser(email) {
    const snap = await db.collection("users").where("email", "==", email).limit(1).get();
    return snap.empty ? null : snap.docs[0].id;
  }

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const customer = await stripe.customers.retrieve(sub.customer);
    const uid = await findUser(customer.email);
    if (uid) {
      const isPremium = sub.status === "active" || sub.status === "trialing";
      await db.collection("users").doc(uid).update({
        premium:            isPremium,
        stripeCustomerId:   sub.customer,
        subscriptionId:     sub.id,
        subscriptionStatus: sub.status,
        planId:             sub.items.data[0]?.price.id || ""
      });
      console.log(`User ${uid} premium → ${isPremium}`);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const customer = await stripe.customers.retrieve(sub.customer);
    const uid = await findUser(customer.email);
    if (uid) {
      await db.collection("users").doc(uid).update({
        premium:            false,
        subscriptionStatus: "canceled"
      });
      console.log(`User ${uid} premium revoked`);
    }
  }

  // Send push notification when someone's report gets a like
  if (event.type === "find.liked") { /* handled client-side via Firestore */ }

  res.json({ received: true });
});

// Callable function: send push notification to hunters in an area
exports.sendAreaAlert = functions.firestore
  .document("finds/{findId}")
  .onCreate(async (snap) => {
    const find = snap.data();
    if (!find.lat || !find.lng) return;

    // Get users who want notifications for this region
    const usersSnap = await db.collection("users")
      .where("notifyRegions", "array-contains", find.region || "")
      .get();

    const tokens = usersSnap.docs
      .map(d => d.data().fcmToken)
      .filter(Boolean);

    if (!tokens.length) return;

    const msg = {
      notification: {
        title: "🍄 Morels reported near " + (find.locName || "you"),
        body:  (find.qty || "A find") + " reported by " + (find.name || "a hunter")
      },
      data: { url: "/?lat=" + find.lat + "&lng=" + find.lng },
      tokens
    };

    await admin.messaging().sendMulticast(msg);
    console.log("Notified", tokens.length, "hunters");
  });

// ── Land Access: Stripe Connect onboarding ────────────────────
exports.stripeConnectOnboard = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required");
  const { uid, email } = data;
  const userRef = db.collection("users").doc(uid);
  const userDoc = await userRef.get();
  let accountId = userDoc.data()?.stripeConnectId;
  if (!accountId) {
    const account = await stripe.accounts.create({ type:"express", email, capabilities:{card_payments:{requested:true},transfers:{requested:true}}, metadata:{firebaseUid:uid} });
    accountId = account.id;
    await userRef.update({ stripeConnectId: accountId });
  }
  const origin = "https://kirkcreason-dev.github.io/Melody-s-Morels";
  const link = await stripe.accountLinks.create({ account:accountId, refresh_url:origin+"/?tab=land&connect=refresh", return_url:origin+"/?tab=land&connect=success", type:"account_onboarding" });
  return { url: link.url };
});

// ── Land Access: Create booking checkout session ──────────────
exports.createLandCheckout = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required");
  const { listingId, guests, date, hunterId, hunterEmail } = data;
  const listingDoc = await db.collection("listings").doc(listingId).get();
  if (!listingDoc.exists) throw new functions.https.HttpsError("not-found", "Listing not found");
  const listing = listingDoc.data();
  const ownerDoc = await db.collection("users").doc(listing.ownerId).get();
  const stripeConnectId = ownerDoc.data()?.stripeConnectId;
  if (!stripeConnectId) throw new functions.https.HttpsError("failed-precondition", "Landowner has not connected Stripe");
  const subtotal    = Math.round(listing.price * guests * 100);
  const platformFee = Math.round(subtotal * 0.15);
  const origin      = "https://kirkcreason-dev.github.io/Melody-s-Morels";
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{ price_data: { currency:"usd", product_data:{name:listing.title, description:"Land access — "+date+", "+guests+" hunter(s)"}, unit_amount:subtotal }, quantity:1 }],
    payment_intent_data: { application_fee_amount:platformFee, transfer_data:{destination:stripeConnectId} },
    customer_email: hunterEmail,
    metadata: { listingId, hunterId, guests:String(guests), date, ownerId:listing.ownerId },
    success_url: origin+"/?tab=land&booking=success",
    cancel_url:  origin+"/?tab=land"
  });
  await db.collection("bookings").add({ listingId, listingTitle:listing.title, ownerId:listing.ownerId, ownerName:listing.ownerName, hunterId, hunterEmail, guests, date, subtotal:subtotal/100, platformFee:platformFee/100, landOwnerPayout:(subtotal-platformFee)/100, stripeSessionId:session.id, status:"pending", createdAt:admin.firestore.FieldValue.serverTimestamp() });
  return { sessionId: session.id };
});

// ── Booking confirmed webhook ──────────────────────────────────
// Add "checkout.session.completed" to your Stripe webhook events
exports.handleBookingPaid = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try { event = stripe.webhooks.constructEvent(req.rawBody, sig, functions.config().stripe.webhook_secret); }
  catch (err) { return res.status(400).send("Webhook Error: "+err.message); }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const snap = await db.collection("bookings").where("stripeSessionId","==",session.id).limit(1).get();
    if (!snap.empty) await snap.docs[0].ref.update({ status:"confirmed", paidAt:admin.firestore.FieldValue.serverTimestamp() });
    const { listingId, hunterId, date } = session.metadata||{};
    if (listingId) {
      const listing = (await db.collection("listings").doc(listingId).get()).data();
      console.log("Booking confirmed:", hunterId, "for", listing?.title, "on", date);
      // TODO: send address email via SendGrid / Postmark
    }
  }
  res.json({ received: true });
});
