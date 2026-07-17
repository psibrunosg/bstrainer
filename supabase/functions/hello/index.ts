// Local: `supabase functions serve hello` — Invoke: `supabase.functions.invoke("hello")` from the client.
// Placeholder proving the functions dir/deploy path; real functions (e.g. generate-workout) follow this shape.
Deno.serve(() => Response.json({ ok: true, fn: "hello" }));
