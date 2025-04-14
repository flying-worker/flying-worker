import {Google} from "./social-auth/Google";
import {Linkedin} from "./social-auth/Linkedin";
import {Twitter} from "./social-auth/Twitter";

class SocialAuth {

	static google()
	{
		return new Google()
	}

	static linkedin()
	{
		return new Linkedin()
	}

	static x()
	{
		return new Twitter()
	}
}