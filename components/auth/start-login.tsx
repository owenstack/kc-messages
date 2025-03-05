"use client";

import { signInWithCode, startLogin, tfaSignIn } from "@/actions/telegram";
import { Label } from "@/components/ui/label";
import Form from "next/form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Submit } from "../submit";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { PhoneInput } from "../ui/phone-input";

export function StartLogin() {
	const [step, setStep] = useState<"phone" | "code" | "2fa">("phone");
	const [phone, setPhone] = useState("");
	const [tempToken, setTempToken] = useState("");
	const router = useRouter();

	const handleSubmit = async (form: FormData) => {
		try {
			if (step === "phone") {
				const phoneNumber = form.get("phone") as string;
				const response = await startLogin(phoneNumber);

				if (!response.success) {
					toast.error(response.error);
					return;
				}

				setPhone(phoneNumber);
				setTempToken(response.tempToken || "");
				setStep("code");
				toast.success(response.message);
			} else if (step === "code") {
				const code = form.get("code") as string;
				const response = await signInWithCode(tempToken, phone, code);

				if (!response.success) {
					if (response.needs2FA) {
						setTempToken(response.tempToken || "");
						setStep("2fa");
						toast.info(response.message);
						return;
					}
					toast.error(response.error);
					return;
				}

				toast.success(response.message);
			} else if (step === "2fa") {
				const password = form.get("password") as string;
				const response = await tfaSignIn(tempToken, password);
				if (!response.success) {
					toast.error(response.error);
					return;
				}
				toast.success(response.message);
				router.push("/dashboard");
			}
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Something went wrong",
			);
		}
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>Login</CardTitle>
				<CardDescription>
					{step === "phone" && "Enter your phone number to login"}
					{step === "code" && "Enter the code sent to your Telegram app"}
					{step === "2fa" && "Enter your 2FA password"}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form action={handleSubmit} className="grid gap-4">
					{step === "phone" && (
						<div className="grid gap-2">
							<Label htmlFor="phone">Phone number</Label>
							<PhoneInput
								name="phone"
								id="phone"
								defaultCountry="NG"
								international
							/>
						</div>
					)}
					{step === "code" && (
						<div className="grid gap-2">
							<Label htmlFor="code">Verification Code</Label>
							<Input
								type="text"
								name="code"
								id="code"
								placeholder="Enter code from Telegram"
							/>
						</div>
					)}
					{step === "2fa" && (
						<div className="grid gap-2">
							<Label htmlFor="password">2FA Password</Label>
							<Input
								type="password"
								name="password"
								id="password"
								placeholder="Enter your 2FA password"
							/>
						</div>
					)}
					<Submit>Continue</Submit>
				</Form>
			</CardContent>
		</Card>
	);
}
