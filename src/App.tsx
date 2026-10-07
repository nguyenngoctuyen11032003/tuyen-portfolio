import { useState } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { LangProvider } from './context/LangContext';
import { IntroDoneContext, shouldPlayIntro } from './context/IntroContext';
import { CinematicIntro } from './components/intro/CinematicIntro';
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
  // Decided once on first render; the page itself renders underneath the intro.
  const [introDone, setIntroDone] = useState(() => !shouldPlayIntro());

  return (
    <LangProvider>
      <MotionConfig reducedMotion="user">
        <IntroDoneContext.Provider value={introDone}>
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
          <AnimatePresence>
            {!introDone && <CinematicIntro key="intro" onComplete={() => setIntroDone(true)} />}
          </AnimatePresence>
          <CursorDot />
        </IntroDoneContext.Provider>
      </MotionConfig>
    </LangProvider>
  );
}

export default App;
