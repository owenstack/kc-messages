"use server";

import { env } from "@/lib/env";
import { TelegramClient } from "telegram";
import { StoreSession } from "telegram/sessions";

const session = new StoreSession("sessions");
const client = new TelegramClient(
    session,
    env.TELEGRAM_APP_ID,
    env.TELEGRAM_APP_HASH,
    { connectionRetries: 5 },
);

export async function authorize() {
	await client.connect();
	return await client.checkAuthorization();
}

export async function login({phone, code, password}: {phone: string, code: string, password?: string}) {
    if (!authorize()) {
        
    }
}