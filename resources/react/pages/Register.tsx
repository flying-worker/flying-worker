import type {MetaFunction } from "react-router";
import RegisterPage from '@react/themes/default/pages/auth/Register';
import GuestLayout from '@react/layouts/GuestLayout';

export const meta: MetaFunction = () => {
  return [{ title: "Remix and Hono on Vite on Cloudflare pages" }];
};


export default function Login() {

    return (
        <GuestLayout>
            <RegisterPage/>
        </GuestLayout>
    );
}

