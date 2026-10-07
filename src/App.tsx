import { MotionConfig } from 'framer-motion';
import { LangProvider } from './context/LangContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { ExperienceSection } from './components/ExperienceSection';
import { SkillsSection } from './components/SkillsSection';
import { ArchiveSphere } from './components/archive/ArchiveSphere';
import { ProjectsSection } from './components/ProjectsSection';
import { CertificationsSection } from './components/CertificationsSection';
import { ContactSection } from './components/ContactSection';
import { CursorDot } from './components/ui/CursorDot';

function App() {
  return (
    <LangProvider>
      <MotionConfig reducedMotion="user">
        <Navbar />
        <main className="bg-black">
          <HeroSection />
          <AboutSection />
          <ExperienceSection />
          <SkillsSection />
          <ArchiveSphere />
          <ProjectsSection />
          <CertificationsSection />
          <ContactSection />
        </main>
        <CursorDot />
      </MotionConfig>
    </LangProvider>
  );
}

export default App;
