import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ params }: LoaderFunctionArgs) {

    const name = params.name ?? '';

    return Response.json({ message: `Hello ${name}, json from Remix` });
}
