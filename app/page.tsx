import ClientNavbar from "@/components/layout/ClientNavbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/homepage/Hero";
import ServicesPreview from "@/components/homepage/ServicesPreview";
import HowItWorks from "@/components/homepage/HowItWorks";

export default function HomePage() {
  return (
    <main>
      <ClientNavbar />
      <Hero />
      <ServicesPreview />
      <HowItWorks />
      <Footer />
    </main>
  );
}
