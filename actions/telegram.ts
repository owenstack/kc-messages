"use server";

import { env } from "@/lib/env";
import { TelegramClient } from "telegram";
import { StoreSession } from "telegram/sessions";

let clientInstance: TelegramClient | null = null;

export async function getClient() {
	if (!clientInstance) {
		const session = new StoreSession("sessions");
		clientInstance = new TelegramClient(
			session,
			env.TELEGRAM_APP_ID,
			env.TELEGRAM_APP_HASH,
			{ connectionRetries: 5 },
		);

		if (!clientInstance.connected) {
			await clientInstance.connect();
		}
	}

	return clientInstance;
}

type AuthResponse = {
	success: boolean;
	message?: string;
	error?: string;
	needs2FA?: boolean;
};

export async function authorize() {
	const client = await getClient();
	return client.checkAuthorization();
}

export async function startLogin(phone: string): Promise<AuthResponse> {
	try {
		const client = await getClient();
		await client.sendCode(
			{ apiHash: env.TELEGRAM_APP_HASH, apiId: env.TELEGRAM_APP_ID },
			phone,
		);
		return {
			success: true,
			message: "Login code sent to your Telegram app",
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to send code",
		};
	}
}

export async function signInWithCode(
	phone: string,
	code: string,
): Promise<AuthResponse> {
	try {
		const client = await getClient();
		await client.signInUser(
			{ apiHash: env.TELEGRAM_APP_HASH, apiId: env.TELEGRAM_APP_ID },
			{
				phoneNumber: phone,
				phoneCode: async () => Promise.resolve(code),
				onError: async (err) => {
					if (err) {
						return true;
					}
					return Promise.resolve(false);
				},
			},
		);

		return {
			success: true,
			message: "Successfully signed in",
		};
	} catch (error) {
		if (error instanceof Error && error.message.includes("2FA")) {
			return {
				success: false,
				needs2FA: true,
				message: "Please enter your 2FA password",
			};
		}
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to sign in",
		};
	}
}

export async function tfaSignIn(password: string): Promise<AuthResponse> {
	try {
		const client = await getClient();
		await client.signInWithPassword(
			{ apiHash: env.TELEGRAM_APP_HASH, apiId: env.TELEGRAM_APP_ID },
			{
				password: async () => Promise.resolve(password),
				onError: async (err) => {
					if (err) {
						return true;
					}
					return Promise.resolve(false);
				},
			},
		);
		return {
			success: true,
			message: "Successfully signed in",
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to sign in",
		};
	}
}

export async function userProfile() {
	try {
		const client = await getClient();
		return { data: await client.getMe() };
	} catch (error) {
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
		// Ensure message is not causing recursion issues
		// Limit message length if necessary
		const safeMessage =
			typeof message === "string"
				? message.substring(0, 4000) // Limiting message length to prevent possible stack issues
				: String(message);

		const client = await getClient();
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

		const sentMessages = await Promise.all(
			safeUsers.map(async (username) => {
				try {
					const user = await client.getInputEntity(username);
					return client.sendMessage(user, { message: safeMessage });
				} catch (userError) {
					// Handle individual user errors without failing the entire batch
					console.error(`Failed to send message to ${username}:`, userError);
					return { error: `Failed to send to ${username}`, username };
				}
			}),
		);

		return { data: sentMessages };
	} catch (error) {
		console.error("Message users error:", error);
		return {
			error: error instanceof Error ? error.message : "Failed to send messages",
		};
	}
}
