import { redirect } from "next/navigation";

/** Convenience alias — profile lives in dashboard settings. */
export default function ProfilePage() {
  redirect("/dashboard/settings");
}
