import { NoteEditor } from "@/components/note-editor";

interface NotePageProps {
  params: {
    path: string;
  };
}

export default function NotePage({ params }: NotePageProps) {
  return (
    <div className="">
      <NoteEditor path={params.path} />
    </div>
  );
}
