"use server";

import prisma from "@/lib/db";

export async function setSessionString(
	sessionToken: string,
	sessionString: string,
	ttl?: number,
): Promise<void> {
	const expiresAt = ttl ? new Date(Date.now() + ttl * 1000) : undefined;
	await prisma.telegramSession.upsert({
		where: { sessionToken },
		update: { sessionString, expiresAt },
		create: { sessionToken, sessionString, expiresAt },
	});
}

export async function getSessionString(
	sessionToken: string,
): Promise<string | null> {
	const session = await prisma.telegramSession.findUnique({
		where: { sessionToken },
	});
	if (session && (!session.expiresAt || session.expiresAt > new Date())) {
		return session.sessionString;
	}
	return null;
}

export async function deleteSession(sessionToken: string): Promise<void> {
	await prisma.telegramSession.delete({
		where: { sessionToken },
	});
}
