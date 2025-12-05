export default function handler() {
  return new Response(
    JSON.stringify({ ok: true, message: "debug hit" }),
    { status: 200 }
  );
}
