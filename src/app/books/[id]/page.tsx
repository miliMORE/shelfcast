import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BookDetailClient } from "@/components/BookDetailClient";

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;
  return <BookDetailClient bookId={id} />;
}
