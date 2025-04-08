import type {MetaFunction} from 'react-router'
import HomePage from '../themes/default/pages/Home';


export const meta: MetaFunction = () => {
    return [{title: 'Remix and Hono on Vite on Cloudflare pages'}]
}

export default function Home() {
    return (<HomePage></HomePage>)
}
