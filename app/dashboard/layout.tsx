import { authorize } from "@/actions/telegram";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	if (!(await authorize())) {
		redirect("/login");
	}
	return <>{children}</>;
}
