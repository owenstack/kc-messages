import { createEnv } from "@t3-oss/env-nextjs";
import { number, z } from "zod";

export const env = createEnv({
	server: {
		TELEGRAM_APP_ID: z.coerce.number(),
		TELEGRAM_APP_HASH: z.string().nonempty(),
		TELEGRAM_BOT_KEY: z.string().nonempty(),
	},
	experimental__runtimeEnv: process.env,
});
