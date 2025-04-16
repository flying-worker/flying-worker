import { Github } from "./social-auth/Github";
import { Google } from "./social-auth/Google";
import { Linkedin } from "./social-auth/Linkedin";
import { Twitter } from "./social-auth/Twitter";

const SocialAuth = {
	google() {
		return new Google();
	},

	linkedin() {
		return new Linkedin();
	},

	x() {
		return new Twitter();
	},

	github() {
		return new Github();
	},
};

export default SocialAuth;
