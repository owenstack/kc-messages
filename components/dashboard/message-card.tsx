"use client";

import { messageUsers } from "@/actions/telegram";
import { X } from "lucide-react";
import Form from "next/form";
import { useState } from "react";
import { toast } from "sonner";
import { Submit } from "../submit";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

export function MessageCard() {
	const [users, setUsers] = useState<string[]>([]);
	const [usernameInput, setUsernameInput] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [sentUsers, setSentUsers] = useState<string[]>([]);

	const addUsernames = (input: string) => {
		if (!input.trim()) return;

		// Use regex to split by commas, newlines, or any whitespace
		const parts = input
			.split(/[,\s\n]+/)
			.map((part) => part.trim())
			.filter((part) => part !== ""); // Filter out empty strings

		const newUsernames = parts.slice(0, 100);

		setUsers((prev) => {
			const uniqueUsers = [...prev];
			for (const name of newUsernames) {
				// Ensure we don't exceed 100 users
				if (uniqueUsers.length >= 100) break;
				if (!uniqueUsers.includes(name)) {
					uniqueUsers.push(name);
				}
			}
			// No need to slice again here as we controlled the input length
			return uniqueUsers;
		});

		setUsernameInput("");
	};

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();

			if (text.length > 100000) {
				toast.error("File too large. Please use a smaller file.");
				e.target.value = "";
				return;
			}

			if (file.name.endsWith(".json")) {
				try {
					const data = JSON.parse(text);
					let extractedUsernames: string[] = [];

					// Improved JSON handling to extract strings robustly
					const extractStrings = (value: unknown): string[] => {
						if (typeof value === "string" && value.trim() !== "") {
							return [value.trim()];
						}
						if (Array.isArray(value)) {
							return value.flatMap(extractStrings);
						}
						if (typeof value === "object" && value !== null) {
							return Object.values(value).flatMap(extractStrings);
						}
						return [];
					};
					extractedUsernames = extractStrings(data)
						// Split potential multi-username strings within JSON values
						.flatMap((username) =>
							username
								.split(/[,\s\n]+/)
								.map((part) => part.trim())
								.filter((part) => part !== ""),
						)
						.slice(0, 100);

					setUsers((prev) => {
						const uniqueUsers = [...prev];
						for (const name of extractedUsernames) {
							if (uniqueUsers.length >= 100) break;
							if (!uniqueUsers.includes(name)) {
								uniqueUsers.push(name);
							}
						}
						return uniqueUsers;
					});

					toast.success(
						`Added ${extractedUsernames.length} usernames from JSON file`,
					);
				} catch (error) {
					toast.error("Invalid JSON format");
				}
			} else {
				// Use regex to split by commas, newlines, or any whitespace for text files
				const extractedUsernames = text
					.split(/[,\s\n]+/)
					.map((part) => part.trim())
					.filter((part) => part !== "") // Filter out empty strings
					.slice(0, 100);

				setUsers((prev) => {
					const uniqueUsers = [...prev];
					for (const name of extractedUsernames) {
						if (uniqueUsers.length >= 100) break;
						if (!uniqueUsers.includes(name)) {
							uniqueUsers.push(name);
						}
					}
					return uniqueUsers;
				});
				toast.success(
					`Added ${extractedUsernames.length} usernames from text file`,
				);
			}

			e.target.value = "";
		} catch (error) {
			toast.error("Error reading file");
			e.target.value = "";
		}
	};

	const removeUser = (username: string) => {
		setUsers(users.filter((u) => u !== username));
	};

	const removeAllUsers = () => {
		setUsers([]);
		toast.success("All usernames removed");
	};

	const submit = async (form: FormData) => {
		if (isSubmitting) return;

		setIsSubmitting(true);

		try {
			const message = String(form.get("message") || "");

			if (!message.trim()) {
				toast.error("Please enter a message");
				setIsSubmitting(false);
				return;
			}

			if (users.length === 0) {
				toast.error("Please add at least one username");
				setIsSubmitting(false);
				return;
			}

			const newUsers = users.filter((user) => !sentUsers.includes(user));

			if (newUsers.length === 0) {
				toast.error("All selected users have already received this message");
				setIsSubmitting(false);
				return;
			}

			const { data, error } = await messageUsers(message, newUsers);

			if (error) {
				toast.error(error);
				setIsSubmitting(false);
				return;
			}

			setSentUsers((prev) => [...prev, ...newUsers]);
			toast.success(`Successfully sent message to ${data?.length} users`);
			setUsers([]);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to send message",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>Message user(s)</CardTitle>
				<CardDescription>
					Here you can type in a message, add the user or users you want to
					message. Sit back, relax and watch Telegram do it's thing. Limited to
					100 usernames at once to avoid abuse.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form action={submit} className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="message">Message to send</Label>
						<Textarea
							name="message"
							id="message"
							required
							placeholder="Hello from the abyss"
							maxLength={4000}
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="usernames">Add usernames</Label>
						<div className="flex gap-2">
							<Textarea
								id="usernames"
								value={usernameInput}
								onChange={(e) =>
									setUsernameInput(e.target.value.substring(0, 2000))
								}
								placeholder="Enter usernames (comma or new line separated)"
								className="flex-1"
							/>
							<Button
								type="button"
								onClick={() => addUsernames(usernameInput)}
								disabled={isSubmitting}
							>
								Add
							</Button>
						</div>

						<div className="mt-2">
							<Label className="text-sm text-muted-foreground">
								Or upload a file
							</Label>
							<Input
								type="file"
								accept=".json,.txt"
								onChange={handleFileUpload}
								className="mt-1"
								disabled={isSubmitting}
							/>
							<p className="text-xs text-muted-foreground mt-1">
								Accepts .txt (one username per line) or .json files
							</p>
						</div>
					</div>

					{users.length > 0 && (
						<div className="grid gap-2">
							<div className="flex items-center justify-between">
								<Label>Recipients ({users.length})</Label>
								<Button
									type="button"
									variant="destructive"
									size="sm"
									onClick={removeAllUsers}
									disabled={isSubmitting}
								>
									Remove All
								</Button>
							</div>
							<div className="flex flex-wrap gap-1">
								{users.map((user) => (
									<Badge
										key={user}
										variant="secondary"
										className="flex items-center gap-1"
									>
										{user}
										<Button
											type="button"
											variant="ghost"
											className="h-4 w-4 p-0"
											onClick={() => removeUser(user)}
											disabled={isSubmitting}
										>
											<X className="h-3 w-3" />
										</Button>
									</Badge>
								))}
							</div>
						</div>
					)}

					<Submit>Send message</Submit>
				</Form>
			</CardContent>
		</Card>
	);
}
