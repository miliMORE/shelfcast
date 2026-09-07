import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UploadForm } from "@/components/UploadForm";

export default async function LibraryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const books = await prisma.book.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      jobs: { orderBy: { createdAt: "desc" }, take: 1 },
      assets: { take: 1 },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-900">Your library</h1>
          <p className="text-slate-600">Books and conversion jobs for your account.</p>
        </div>
      </div>

      <UploadForm />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        {books.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No books yet. Upload an EPUB or PDF to get started.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {books.map((book) => {
              const job = book.jobs[0];
              return (
                <li key={book.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <Link href={"/books/" + book.id} className="font-medium text-slate-900 no-underline hover:text-brand-700">
                      {book.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {book.format}
                      {book.author ? " · " + book.author : ""}
                      {job ? " · " + job.status + " (" + job.progress + "%)" : ""}
                      {book.assets.length ? " · audio ready" : ""}
                    </p>
                  </div>
                  <Link
                    href={"/books/" + book.id}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 no-underline hover:bg-slate-50"
                  >
                    Open
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}