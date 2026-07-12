import { Nav } from "./components/Nav.js";
import { Hero } from "./components/Hero.js";
import { CompatStrip } from "./components/CompatStrip.js";
import { Features } from "./components/Features.js";
import { HowItWorks } from "./components/HowItWorks.js";
import { Showcase } from "./components/Showcase.js";
import { Pricing } from "./components/Pricing.js";
import { Thanks } from "./components/Thanks.js";
import { FAQ } from "./components/FAQ.js";
import { Comments } from "./components/Comments.js";
import { Changelog } from "./components/Changelog.js";
import { Download } from "./components/Download.js";
import { Footer } from "./components/Footer.js";

export default function App(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-surface-0 text-text-primary">
      <Nav />
      <main>
        <Hero />
        <CompatStrip />
        <Features />
        <HowItWorks />
        <Showcase />
        <Pricing />
        <Thanks />
        <FAQ />
        <Comments />
        <Changelog />
        <Download />
      </main>
      <Footer />
    </div>
  );
}
