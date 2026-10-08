import { PresentationShell } from "@/components/shell/PresentationShell";

export default function HomePage() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `if (typeof window !== 'undefined' && window.innerWidth < 768) { window.location.replace('/welcome'); }`,
        }}
      />
      <PresentationShell />
    </>
  );
}
