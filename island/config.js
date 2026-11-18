// Island pages: settings that change at launch. Edit here, not in the pages.
window.ISLAND_CONFIG = {
  // Supabase Edge Functions (World Order project).
  api: "https://zueyffhnkzlknhzqowxz.supabase.co/functions/v1",
  // Paddle Billing. "sandbox" while testing, "production" at launch.
  // The client-side token is public by design (Paddle → Developer tools → Authentication → Client-side tokens).
  paddle: { environment: "sandbox", token: "test_a9a92a0c739451c6a560bec01da" },
  // The free download. Leave empty until the release is uploaded; the buttons then say "Coming soon".
  downloadURL: "/island/Island-1.2.dmg",
  version: "1.2",
  price: { regular: "$9.99", launch: "$4.99", launchSlots: 100 },
};
