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

type AuthResponse = {
    success: boolean;
    message?: string;
    error?: string;
    needs2FA?: boolean;
}

export async function authorize() {
    await client.connect();
    return await client.checkAuthorization();
}

export async function startLogin(phone: string): Promise<AuthResponse> {
    try {
        await client.connect();
        await client.sendCode(
            {apiHash: env.TELEGRAM_APP_HASH, apiId: env.TELEGRAM_APP_ID}, 
            phone
        );
        return {
            success: true, 
            message: 'Login code sent to your Telegram app'
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send code'
        };
    }
}

export async function signInWithCode(phone: string, code: string): Promise<AuthResponse> {
    try {
        await client.connect();
        const result = await client.signInUser(
            {apiHash: env.TELEGRAM_APP_HASH, apiId: env.TELEGRAM_APP_ID},
            {
            phoneNumber: phone,
            phoneCode: async () => Promise.resolve(code),
            onError: async (err) => {
                if (err) {
                    return true
                }
                return Promise.resolve(false)
            }
        });
        
        return {
            success: true,
            message: 'Successfully signed in'
        };
    } catch (error) {
        if (error instanceof Error && error.message.includes('2FA')) {
            return {
                success: false,
                needs2FA: true,
                message: 'Please enter your 2FA password'
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to sign in'
        };
    }
}

export async function tfaSignIn(password: string): Promise<AuthResponse> {
    try {
        await client.signInWithPassword({apiHash: env.TELEGRAM_APP_HASH, apiId: env.TELEGRAM_APP_ID}, {
            password: async () => Promise.resolve(password),
            onError: async (err) => {
                if (err) {
                    return true
                }
                return Promise.resolve(false)
            }
        })
        return {
            success: true,
            message: 'Successfully signed in'
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to sign in'
        }
    }
}