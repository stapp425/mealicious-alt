export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-background w-screen h-screen flex justify-center items-center">
      {children}
    </main>
  );
}
