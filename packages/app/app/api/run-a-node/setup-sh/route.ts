const setupScriptUrl = "https://raw.githubusercontent.com/krishshaw418/Agent_Layer/main/setup.sh";

export async function GET() {
  const response = await fetch(setupScriptUrl, {
    headers: {
      "cache-control": "no-cache"
    }
  });

  if (!response.ok) {
    return new Response("Unable to fetch setup.sh", { status: 502 });
  }

  const script = await response.text();

  return new Response(script, {
    headers: {
      "Content-Type": "text/x-sh; charset=utf-8",
      "Content-Disposition": 'attachment; filename="setup.sh"',
      "Cache-Control": "no-store"
    }
  });
}
