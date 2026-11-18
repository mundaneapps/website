// Island pages: settings that change at launch. Edit here, not in the pages.
window.ISLAND_CONFIG = {
  // Supabase Edge Functions (World Order project).
  api: "https://zueyffhnkzlknhzqowxz.supabase.co/functions/v1",
  // Paddle Billing. "sandbox" while testing, "production" at launch.
  // The client-side token is public by design (Paddle → Developer tools → Authentication → Client-side tokens).
  paddle: { environment: "production", token: "live_4e52ad5e2eb0c56e689ec563917" },
  // The free download. Leave empty until the release is uploaded; the buttons then say "Coming soon".
  downloadURL: "/island/Island-2.0.2.dmg",
  version: "2.0.2",
  price: { regular: "$9.99", launch: "$4.99", launchSlots: 100 },
};
