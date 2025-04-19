"use server";

import { env } from "@/lib/env";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { nanoid } from "nanoid";
import { getSessionString, setSessionString } from "./session";
import { cookies } from "next/headers";

type AuthResponse = {
	success: boolean;
	message?: string;
	error?: string;
	needs2FA?: boolean;
	tempToken?: string;
};

async function createClient(sessionString = ""): Promise<TelegramClient> {
	const session = new StringSession(sessionString);
	const client = new TelegramClient(
		session,
		env.TELEGRAM_APP_ID,
		env.TELEGRAM_APP_HASH,
		{
			connectionRetries: 5,
		},
	);
	await client.connect();
	return client;
}

export async function authorize(): Promise<boolean> {
	const sessionToken = (await cookies()).get("session_token")?.value;
	if (!sessionToken) return false;

	const sessionString = await getSessionString(sessionToken);
	if (!sessionString) return false;

	const client = await createClient(sessionString);
	const isAuthorized = await client.checkAuthorization();
	await client.disconnect();
	return isAuthorized;
}

export async function startLogin(phone: string): Promise<AuthResponse> {
	try {
		const client = await createClient();
		await client.sendCode(
			{ apiHash: env.TELEGRAM_APP_HASH, apiId: env.TELEGRAM_APP_ID },
			phone,
		);

		const tempToken = nanoid();
		const sessionString = client.session.save();
		if (typeof sessionString !== "string") {
			throw new Error("Session string is not a string");
		}
		await setSessionString(tempToken, sessionString, 300); // 5-minute TTL

		return {
			success: true,
			message: "Login code sent to your Telegram app",
			tempToken,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to send code",
		};
	}
}
export async function signInWithCode(
	tempToken: string,
	phone: string,
	code: string,
): Promise<AuthResponse> {
	try {
		const sessionString = await getSessionString(tempToken);
		if (!sessionString) {
			return { success: false, error: "Invalid or expired token" };
		}

		const client = await createClient(sessionString);
		await client.signInUser(
			{ apiHash: env.TELEGRAM_APP_HASH, apiId: env.TELEGRAM_APP_ID },
			{
				phoneNumber: phone,
				phoneCode: async () => Promise.resolve(code),
				onError: async (err) => err !== null,
			},
		);
		const sessionToken = nanoid();
		const newSessionString = client.session.save();
		if (typeof newSessionString !== "string") {
			throw new Error("Session string is not a string");
		}
		await setSessionString(sessionToken, newSessionString);
		(await cookies()).set("session_token", sessionToken, {
			httpOnly: true,
			secure: true,
		});

		await client.disconnect();
		return { success: true, message: "Successfully signed in" };
	} catch (error) {
		if (error instanceof Error && error.message.includes("2FA")) {
			return {
				success: false,
				needs2FA: true,
				message: "Please enter your 2FA password",
				tempToken,
			};
		}
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to sign in",
		};
	}
}

export async function tfaSignIn(
	tempToken: string,
	password: string,
): Promise<AuthResponse> {
	try {
		const sessionString = await getSessionString(tempToken);
		if (!sessionString) {
			return { success: false, error: "Invalid or expired token" };
		}

		const client = await createClient(sessionString);
		await client.signInWithPassword(
			{ apiHash: env.TELEGRAM_APP_HASH, apiId: env.TELEGRAM_APP_ID },
			{
				password: async () => Promise.resolve(password),
				onError: async (err) => err !== null,
			},
		);

		const sessionToken = nanoid();
		const newSessionString = client.session.save();
		if (typeof newSessionString !== "string") {
			throw new Error("Session string is not a string");
		}
		await setSessionString(sessionToken, newSessionString);
		(await cookies()).set("session_token", sessionToken, {
			httpOnly: true,
			secure: true,
		});

		await client.disconnect();
		return { success: true, message: "Successfully signed in" };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to sign in",
		};
	}
}

export async function userProfile() {
	const sessionToken = (await cookies()).get("session_token")?.value;
	if (!sessionToken) return { error: "Not authenticated" };

	const sessionString = await getSessionString(sessionToken);
	if (!sessionString) return { error: "Session not found" };

	const client = await createClient(sessionString);
	try {
		const me = await client.getMe();
		await client.disconnect();
		return { data: me };
	} catch (error) {
		await client.disconnect();
		return {
			error:
				error instanceof Error ? error.message : "Failed to get user profile",
		};
	}
}

export async function messageUsers(
	message: string,
	usernames: string | string[],
) {
	try {
		const sessionToken = (await cookies()).get("session_token")?.value;
		if (!sessionToken) return { error: "Not authenticated" };

		const sessionString = await getSessionString(sessionToken);
		if (!sessionString) return { error: "Session not found" };

		const client = await createClient(sessionString);
		// Ensure message is not causing recursion issues
		// Limit message length if necessary
		const safeMessage =
			typeof message === "string"
				? message.substring(0, 4000) // Limiting message length to prevent possible stack issues
				: String(message);
		const users = Array.isArray(usernames) ? usernames : [usernames];

		// Process usernames to ensure they're valid
		const safeUsers = users
			.filter(
				(username) => typeof username === "string" && username.trim() !== "",
			)
			.map((username) => username.trim())
			.slice(0, 100); // Limit the number of users to prevent possible issues

		if (safeUsers.length === 0) {
			return { error: "No valid usernames provided" };
		}

		const delay = (ms: number) =>
			new Promise((resolve) => setTimeout(resolve, ms));

		const sentMessages = [];
		for (const username of safeUsers) {
			try {
				const user = await client.getInputEntity(username);
				const result = await client.sendMessage(user, { message: safeMessage });
				sentMessages.push(result);
				// Delay to prevent hitting Telegram's rate limits
				await delay(200);
			} catch (userError) {
				// Handle individual user errors without failing the entire batch
				console.error(`Failed to send message to ${username}:`, userError);
				sentMessages.push({ error: `Failed to send to ${username}`, username });
			}
		}

		return { data: sentMessages };
	} catch (error) {
		console.error("Message users error:", error);
		return {
			error: error instanceof Error ? error.message : "Failed to send messages",
		};
	}
}
