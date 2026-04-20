import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ROLE } from "@/lib/roles";

export default async function HomePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  redirect(user.role === ROLE.MEMBER ? "/account" : "/admin");
}
