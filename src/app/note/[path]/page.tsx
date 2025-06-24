import { NoteEditor } from "@/components/note-editor";

interface NotePageProps {
  params: Promise<{ path: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NotePage({ params }: NotePageProps) {
  const { path } = await params;

  return (
    <div className="">
      <NoteEditor path={path} />
    </div>
  );
}
