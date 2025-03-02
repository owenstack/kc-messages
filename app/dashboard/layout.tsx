import { authorize } from "@/actions/telegram";
import { NavBar } from "@/components/dashboard/nav-bar";
import { Sidebar } from "@/components/dashboard/side-bar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	if (!(await authorize())) {
		redirect("/login");
	}
	return (
		<div className="flex gap-[2%] flex-wrap content-start h-screen">
			<NavBar />
			<Sidebar />
			<div className="grow h-[90%]">{children}</div>
		</div>
	);
}
