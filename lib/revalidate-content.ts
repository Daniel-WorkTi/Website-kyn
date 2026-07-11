import { revalidatePath } from "next/cache";
import { SECTIONS } from "@/lib/admin/sections";

export function revalidateContentPaths(relativePath: string): void {
  if (relativePath === "content/site.json") {
    revalidatePath("/", "layout");
    revalidatePath("/");
    return;
  }

  const section = SECTIONS.find((s) => s.file === relativePath);
  if (!section?.page) return;

  const page = section.page.split("#")[0];
  if (page) {
    revalidatePath(page);
  }

  if (relativePath === "content/partners.json") {
    revalidatePath("/parceiros");
  }

  if (relativePath === "content/team.json" || relativePath === "content/partners.json") {
    revalidatePath("/team");
  }
}
