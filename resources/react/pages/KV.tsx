
import { useLoaderData, LoaderFunctionArgs } from "react-router";

export const loader = async ({ context, request }: LoaderFunctionArgs) => {

    const honoContext: any = context.hono

    const { kv } = honoContext.env;

    await kv.put("remix", "Direct KV");

    const data = await kv.get("remix");

    return  { data }
};

export default function Index() {
  const { data } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Remix + Hono direct access to Cloudflare KV</h1>
      <p> {data}</p>
    </div>
  );
}
