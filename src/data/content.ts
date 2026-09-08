export type Lang = 'vi' | 'en';

export interface ExperienceItem {
  period: string;
  role: string;
  org: string;
  focus: string;
}

export interface ProjectItem {
  title: string;
  years: string;
  role: string;
  scope: string;
}

export interface SkillGroup {
  icon: 'code' | 'clipboard-list' | 'shield' | 'languages';
  title: string;
  description: string;
}

export interface Content {
  nav: {
    links: { label: string; href: string }[];
    contactCta: string;
  };
  hero: {
    headline: string;
    accent: string;
    subheading: string;
    ctaProjects: string;
    ctaContact: string;
  };
  about: {
    label: string;
    heading: string;
    paragraphPlain: string;
    paragraphItalic: string;
    paragraphPlainEnd: string;
    educationLabel: string;
    educationSchool: string;
    educationDegree: string;
    educationDates: string;
  };
  experience: {
    heading: string;
    items: ExperienceItem[];
  };
  skills: {
    heading: string;
    groups: SkillGroup[];
  };
  projects: {
    heading: string;
    items: ProjectItem[];
  };
  contact: {
    heading: string;
    email: string;
    location: string;
    ctaLabel: string;
  };
  a11y: {
    toggleMenu: string;
    toggleLanguage: string;
    email: string;
  };
}

export const content: Record<Lang, Content> = {
  vi: {
    nav: {
      links: [
        { label: 'Về tôi', href: '#about' },
        { label: 'Kinh nghiệm', href: '#experience' },
        { label: 'Kỹ năng', href: '#skills' },
        { label: 'Dự án', href: '#projects' },
        { label: 'Liên hệ', href: '#contact' },
      ],
      contactCta: 'Liên hệ',
    },
    hero: {
      headline: 'Tôi là Nguyễn Ngọc Tuyền — kỹ sư viết code, giữ hệ thống an toàn.',
      accent: 'an toàn',
      subheading:
        'Nhân viên kỹ thuật tại Công ty Cổ phần An ninh mạng Quốc tế ICS · Hà Nội',
      ctaProjects: 'Xem dự án',
      ctaContact: 'Liên hệ',
    },
    about: {
      label: 'Về tôi',
      heading: 'Từ dòng code đầu tiên đến an ninh hệ thống.',
      paragraphPlain:
        'Tôi tốt nghiệp Kỹ sư Công nghệ thông tin tại Trường Đại học Công Nghệ Đông Á (2021–2025) và đã đi qua ba môi trường làm việc khác nhau — từ doanh nghiệp xuất nhập khẩu, nền tảng giáo dục, đến',
      paragraphItalic: 'một công ty an ninh mạng quốc tế',
      paragraphPlainEnd: ', nơi tôi vừa phát triển phần mềm vừa học cách bảo vệ nó.',
      educationLabel: 'Học vấn',
      educationSchool: 'Trường Đại học Công Nghệ Đông Á',
      educationDegree: 'Kỹ sư Công nghệ thông tin (hệ chính quy)',
      educationDates: '09/2021 – 06/2025',
    },
    experience: {
      heading: 'Hành trình làm việc',
      items: [
        {
          period: '03/2023 – 06/2024',
          role: 'Nhân viên',
          org: 'Công ty TNHH SX&XNK Khang Minh',
          focus: 'Công nghệ thông tin & xúc tiến thương mại',
        },
        {
          period: '09/2024 – 02/2025',
          role: 'Nhân viên kỹ thuật',
          org: 'Học Mãi JSC',
          focus: 'Phát triển phần mềm',
        },
        {
          period: '09/2025 – nay',
          role: 'Nhân viên kỹ thuật',
          org: 'Công ty CP An ninh mạng Quốc tế ICS',
          focus: 'Phát triển phần mềm',
        },
      ],
    },
    skills: {
      heading: 'Kỹ năng & Công nghệ',
      groups: [
        {
          icon: 'code',
          title: 'Phát triển Full-Stack',
          description: 'Xây dựng và triển khai các hệ thống web hoàn chỉnh, từ giao diện đến back-end.',
        },
        {
          icon: 'clipboard-list',
          title: 'Quản lý dự án',
          description: 'Điều phối tiến độ và đội nhóm cho các dự án doanh nghiệp quy mô vừa.',
        },
        {
          icon: 'shield',
          title: 'An ninh mạng',
          description: 'Tư duy bảo mật được rèn luyện trong môi trường an ninh mạng quốc tế.',
        },
        {
          icon: 'languages',
          title: 'Tiếng Anh',
          description: 'Trình độ khá, đủ để đọc tài liệu kỹ thuật và trao đổi công việc.',
        },
      ],
    },
    projects: {
      heading: 'Dự án tiêu biểu',
      items: [
        { title: 'Hệ thống quản trị khách sạn ERP', years: '2024–2025', role: 'Full-Stack Developer', scope: 'Trường học' },
        { title: 'Hệ thống quản lý Lớp học và giáo viên', years: '2025', role: 'Full-Stack Developer', scope: 'Doanh nghiệp' },
        { title: 'Hệ thống HRM quản lý nhân sự cho doanh nghiệp', years: '2025–2026', role: 'Quản lý dự án', scope: 'Doanh nghiệp' },
        { title: 'Nền tảng đào tạo và giáo dục e-learning', years: '2025–2026', role: 'Quản lý dự án', scope: 'Doanh nghiệp' },
        { title: 'Hệ thống CRM cho doanh nghiệp', years: '2025–2026', role: 'Phát triển phần mềm', scope: 'Doanh nghiệp' },
        { title: 'Số hoá di tích cho xã phường', years: '2025–2026', role: 'Full-Stack Developer', scope: 'Nhà nước' },
      ],
    },
    contact: {
      heading: 'Cùng nhau xây dựng điều gì đó.',
      email: 'tt98tuyen@gmail.com',
      location: 'Hà Nội, Việt Nam',
      ctaLabel: 'Gửi email cho tôi',
    },
    a11y: {
      toggleMenu: 'Mở/đóng menu',
      toggleLanguage: 'Chuyển ngôn ngữ',
      email: 'Email',
    },
  },
  en: {
    nav: {
      links: [
        { label: 'About', href: '#about' },
        { label: 'Experience', href: '#experience' },
        { label: 'Skills', href: '#skills' },
        { label: 'Projects', href: '#projects' },
        { label: 'Contact', href: '#contact' },
      ],
      contactCta: 'Contact',
    },
    hero: {
      headline: "I'm Nguyễn Ngọc Tuyền — an engineer who writes code and keeps systems safe.",
      accent: 'safe',
      subheading: 'Software Engineer at ICS International Cybersecurity JSC · Hanoi',
      ctaProjects: 'View projects',
      ctaContact: 'Contact',
    },
    about: {
      label: 'About',
      heading: 'From the first line of code to system security.',
      paragraphPlain:
        'I graduated as an IT Engineer from Đông Á University of Technology (2021–2025) and have worked across three very different environments — from an import-export business, to an e-learning platform, to',
      paragraphItalic: 'an international cybersecurity company',
      paragraphPlainEnd: ', where I build software and learn to defend it at the same time.',
      educationLabel: 'Education',
      educationSchool: 'Đông Á University of Technology',
      educationDegree: 'B.Eng. in Information Technology (full-time)',
      educationDates: '09/2021 – 06/2025',
    },
    experience: {
      heading: 'Work experience',
      items: [
        {
          period: '03/2023 – 06/2024',
          role: 'Staff',
          org: 'Khang Minh Import-Export Manufacturing Co., Ltd',
          focus: 'IT & trade promotion',
        },
        {
          period: '09/2024 – 02/2025',
          role: 'Technical Staff',
          org: 'Học Mãi Education JSC',
          focus: 'Software development',
        },
        {
          period: '09/2025 – present',
          role: 'Technical Staff',
          org: 'ICS International Cybersecurity JSC',
          focus: 'Software development',
        },
      ],
    },
    skills: {
      heading: 'Skills & Technology',
      groups: [
        {
          icon: 'code',
          title: 'Full-Stack Development',
          description: 'Building and shipping complete web systems, from UI to back-end.',
        },
        {
          icon: 'clipboard-list',
          title: 'Project Management',
          description: 'Coordinating timelines and teams for mid-sized enterprise projects.',
        },
        {
          icon: 'shield',
          title: 'Cybersecurity',
          description: 'A security mindset shaped by working at an international cybersecurity company.',
        },
        {
          icon: 'languages',
          title: 'English',
          description: 'Working proficiency — enough to read technical docs and communicate on the job.',
        },
      ],
    },
    projects: {
      heading: 'Featured projects',
      items: [
        { title: 'Hotel Management ERP System', years: '2024–2025', role: 'Full-Stack Developer', scope: 'School' },
        { title: 'Classroom & Teacher Management System', years: '2025', role: 'Full-Stack Developer', scope: 'Enterprise' },
        { title: 'HRM System for Enterprise', years: '2025–2026', role: 'Project Manager', scope: 'Enterprise' },
        { title: 'E-learning Education Platform', years: '2025–2026', role: 'Project Manager', scope: 'Enterprise' },
        { title: 'Enterprise CRM System', years: '2025–2026', role: 'Software Developer', scope: 'Enterprise' },
        { title: 'Heritage Site Digitization System', years: '2025–2026', role: 'Full-Stack Developer', scope: 'Government' },
      ],
    },
    contact: {
      heading: "Let's build something together.",
      email: 'tt98tuyen@gmail.com',
      location: 'Hanoi, Vietnam',
      ctaLabel: 'Email me',
    },
    a11y: {
      toggleMenu: 'Toggle menu',
      toggleLanguage: 'Toggle language',
      email: 'Email',
    },
  },
};
