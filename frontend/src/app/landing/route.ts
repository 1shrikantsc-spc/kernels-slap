import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Serve the standalone HTML landing page without modifying your existing app routes.
export async function GET() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  // `route.ts` lives in: frontend/src/app/landing/route.ts
  // So the HTML is: ../../../.. / landing page (2).html
  const htmlPath = path.resolve(__dirname, "../../../../landing.html");

  if (!fs.existsSync(htmlPath)) {
    return new Response(
      `Landing HTML not found at: ${htmlPath}`,
      { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  const html = fs.readFileSync(htmlPath, "utf8");
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

