import { StartLogin } from "@/components/auth/start-login";

export default async function Page({
	searchParams,
}: { searchParams: Promise<{ step?: number }> }) {
	let step = (await searchParams)?.step;
	if (step && typeof step !== "number") {
		step = Number.parseInt(step);
	}
	return (
		<main className="flex flex-col min-h-svh items-center justify-center">
			<StartLogin />
		</main>
	);
}
