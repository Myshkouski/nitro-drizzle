export default defineEventHandler((event) => {
  const readyState = event.context.drizzle?.readyState;
  sendNoContent(event, "done" == readyState ? 200 : 500);
});
