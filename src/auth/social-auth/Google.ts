import {App, Request} from "../../core";
import {HTTPException, HTTPException as HTTPException2} from "hono/http-exception";
import {Session} from "../../session";

export class Google {

    private getState()
    {
        let rand =  Math.random().toString(36).substr(2);

        return `${rand}-${rand}-${rand}`;
    }

   private toQueryParams(params: any) {
        const elements = Object.keys(params);
        elements.forEach((element) => {
            if (params[element] === void 0) {
                delete params[element];
            }
        });
        return new URLSearchParams(params).toString();
    }

    public redirect()
    {
        const config = App.config.socialAuth?.google ? App.config.socialAuth.google : null
        if(!config) {
            throw new HTTPException2(401);
        }

        const newState = this.getState();

        const parsedOptions = this.toQueryParams({
            response_type: "code",
            redirect_uri: Request.getBaseUrl(config.redirectPath),
            client_id: config.clientId,
            include_granted_scopes: true,
            scope: ['openid', 'email', 'profile'].join(" "),
            state: newState
        });

        Session.set('state', newState);

        return Request.getContext().redirect( `https://accounts.google.com/o/oauth2/v2/auth?${parsedOptions}` );
    }

    private async getTokenFromCode() {

        const config = App.config.socialAuth?.google ? App.config.socialAuth.google : null
        if(!config) {
            throw new HTTPException2(401);
        }

        if(!Request.input('code')) {
            throw new Error("Code not found");
        }

        if(Request.input('code') !== Session.get('state')) {
            throw new HTTPException2(401);
        }

        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                accept: "application/json"
            },
            body: JSON.stringify({
                clientId: config.clientId,
                clientSecret: config.clientSecret,
                redirect_uri: Request.getBaseUrl(config.redirectPath),
                code: Request.input('code'),
                grant_type: "authorization_code"
            })
        }).then((res) => res.json());

        if ("error" in response) {
            throw new HTTPException(400, { message: response.error_description });
        }

        if ("access_token" in response) {
           return  response.access_token
        }
    }

    async getUser() {
       const token = await this.getTokenFromCode();

        const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: {
                authorization: `Bearer ${token}`
            }
        }).then((res) => res.json());
        if ("error" in response) {
            throw new HTTPException(400, { message: response.error?.message });
        }
        if ("id" in response) {
           return  response;
        }

        return null
    }

}
