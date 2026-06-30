import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ActivewearSection from "@/components/ActivewearSection";
import ToolsSection from "@/components/ToolsSection";
import SidebarColumn from "@/components/SidebarColumn";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="flonea-app">
      <Header />
      <main className="flonea-main">
        <div className="flonea-main__left">
          <HeroSection />
          <ActivewearSection />
          <ToolsSection />
        </div>
        <SidebarColumn />
      </main>
      <Footer />
    </div>
  );
}
