import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// Main layout - includes header and footer for public pages
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </>
  );
}





