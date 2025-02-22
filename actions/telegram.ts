"use server";

import { env } from "@/lib/env";
import { TelegramClient } from "telegram";
import { StoreSession } from "telegram/sessions";

export async function authorize() {
	const session = new StoreSession("sessions");
	const client = new TelegramClient(
		session,
		env.TELEGRAM_APP_ID,
		env.TELEGRAM_APP_HASH,
		{ connectionRetries: 5 },
	);
	await client.connect();
	return await client.checkAuthorization();
}
