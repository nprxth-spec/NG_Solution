import { redirect } from "next/navigation";

export default function CentxoUpgradeRedirect() {
  // Redirect to the central portal dashboard billing page
  redirect("/dashboard?menu=billing");
}
