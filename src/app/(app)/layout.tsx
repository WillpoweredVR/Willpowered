// App layout - for authenticated app pages (dashboard, onboarding, etc.)
// No header/footer - these pages have their own navigation
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}





