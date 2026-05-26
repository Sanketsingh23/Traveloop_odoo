import Navbar from './landing/Navbar';
import PageLoader from './landing/PageLoader';
import HeroSection from './landing/HeroSection';
import IntroSection from './landing/IntroSection';
import HowItWorksSection from './landing/HowItWorksSection';
import FeaturesSection from './landing/FeaturesSection';
import CTASection from './landing/CTASection';
import Footer from './landing/Footer';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <div className="grain-overlay" />
      <PageLoader />
      <Navbar />
      <HeroSection />
      <IntroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </div>
  );
}
