export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-background overflow-auto lg:overflow-hidden">
      <div className="border bg-sidebar fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg">
        {children}
      </div>
    </main>
  );
}
