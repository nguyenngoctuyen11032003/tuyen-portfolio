export type Lang = 'vi' | 'en';

export const links = {
  github: 'https://github.com/nguyenngoctuyen11032003',
  linkedin: 'https://www.linkedin.com/in/tuy%E1%BB%81n-nguy%E1%BB%85n-ng%E1%BB%8Dc-40432243b/',
  caseStudies: 'https://github.com/nguyenngoctuyen11032003/project-case-studies',
  cv: '/cv.pdf',
} as const;

export interface ExperienceItem {
  period: string;
  role: string;
  org: string;
  focus: string;
  achievements?: string[];
  tags?: string[];
}

export interface SkillCategory {
  label: string;
  items: string[];
}

export interface ProjectItem {
  title: string;
  years: string;
  role: string;
  scope: string;
  description?: string;
  tags?: string[];
  caseStudyUrl?: string;
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
    ctaCv: string;
    ctaGithub: string;
    badge: string;
    stats: { value: string; label: string }[];
  };
  about: {
    label: string;
    heading: string;
    paragraphPlain: string;
    paragraphItalic: string;
    paragraphPlainEnd: string;
    languagesLabel: string;
    languages: string;
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
    coreLabel: string;
    core: string[];
    categories: SkillCategory[];
    note: string;
  };
  projects: {
    heading: string;
    also: string;
    caseStudyLabel: string;
    detailsLabel: string;
    items: ProjectItem[];
  };
  certifications: {
    heading: string;
    items: { name: string; issuer?: string }[];
  };
  contact: {
    heading: string;
    email: string;
    location: string;
    ctaLabel: string;
    githubLabel: string;
    linkedinLabel: string;
  };
  a11y: {
    toggleMenu: string;
    toggleLanguage: string;
    email: string;
    scrollDown: string;
    backToTop: string;
    openInNewTab: string;
  };
}

const caseStudy = (file: string) => `${links.caseStudies}/blob/main/${file}`;

const CORE = [
  'TypeScript',
  'JavaScript',
  'NestJS',
  'Node.js',
  'Next.js',
  'React',
  'Flutter',
  'PostgreSQL',
  'Redis',
  'Docker',
  'Git',
  'GitHub',
];

const CATEGORY_ITEMS = {
  languages: ['TypeScript', 'JavaScript', 'Dart', 'Java', 'Python', 'SQL', 'HTML5', 'CSS3'],
  frontend: ['React', 'Next.js'],
  backend: ['Node.js', 'NestJS'],
  mobile: ['Flutter', 'Dart', 'Android'],
  database: ['PostgreSQL', 'MySQL', 'Redis'],
  devops: ['Docker', 'Linux', 'Nginx', 'CI/CD'],
  cloud: ['AWS', 'Oracle Cloud (OCI)', 'Firebase'],
  api: ['REST API', 'JWT', 'Authentication', 'Authorization'],
  vcs: ['Git', 'GitHub'],
};

const ICS_TAGS = ['Next.js', 'React', 'NestJS', 'PostgreSQL', 'Redis', 'Docker', 'Git'];

export const content: Record<Lang, Content> = {
  vi: {
    nav: {
      links: [
        { label: 'Về tôi', href: '#about' },
        { label: 'Kinh nghiệm', href: '#experience' },
        { label: 'Kỹ năng', href: '#skills' },
        { label: 'Dự án', href: '#projects' },
      ],
      contactCta: 'Liên hệ',
    },
    hero: {
      headline:
        'Tôi là Nguyễn Ngọc Tuyền — lập trình viên full-stack xây dựng hệ thống doanh nghiệp đáng tin cậy.',
      accent: 'đáng tin cậy',
      subheading:
        'Kỹ sư CNTT · Lập trình viên Full-Stack tại Công ty CP An ninh mạng Quốc tế ICS · Hà Nội',
      ctaProjects: 'Xem dự án',
      ctaContact: 'Liên hệ',
      ctaCv: 'Tải CV',
      ctaGithub: 'GitHub',
      badge: 'Đang làm tại ICS',
      stats: [
        { value: '2+', label: 'năm kinh nghiệm CNTT' },
        { value: '6', label: 'dự án tiêu biểu' },
        { value: '3', label: 'công ty đã làm việc' },
      ],
    },
    about: {
      label: 'Về tôi',
      heading: 'Từ yêu cầu nghiệp vụ đến phần mềm chạy thực tế.',
      paragraphPlain:
        'Tôi tốt nghiệp Kỹ sư Công nghệ thông tin tại Trường Đại học Công Nghệ Đông Á (2021–2025) và có hơn 2 năm kinh nghiệm làm việc trong lĩnh vực CNTT — qua doanh nghiệp xuất nhập khẩu, công ty giáo dục trực tuyến và',
      paragraphItalic: 'một công ty an ninh mạng quốc tế',
      paragraphPlainEnd:
        ', nơi tôi làm lập trình viên full-stack cho các hệ thống doanh nghiệp với NestJS, Next.js/React và PostgreSQL, theo kiến trúc do đội ngũ định hướng.',
      languagesLabel: 'Ngoại ngữ',
      languages: 'Tiếng Anh: cơ bản — đọc được tài liệu kỹ thuật',
      educationLabel: 'Học vấn',
      educationSchool: 'Trường Đại học Công Nghệ Đông Á',
      educationDegree: 'Kỹ sư Công nghệ thông tin (hệ chính quy)',
      educationDates: '09/2021 – 06/2025',
    },
    experience: {
      heading: 'Hành trình làm việc',
      items: [
        {
          period: '07/2025 – nay',
          role: 'Kỹ sư CNTT / Lập trình viên Full-Stack',
          org: 'Công ty CP An ninh mạng Quốc tế ICS',
          focus: 'Phát triển phần mềm full-stack',
          achievements: [
            'Phát triển tính năng frontend và backend với Next.js, React và NestJS.',
            'Xây dựng REST API, logic nghiệp vụ và xác thực JWT trên PostgreSQL và Redis.',
            'Triển khai và bảo trì tính năng trong đội ngũ lớn, sử dụng Git và Docker.',
          ],
          tags: ICS_TAGS,
        },
        {
          period: '09/2024 – 02/2025',
          role: 'Nhân viên kỹ thuật',
          org: 'Học Mãi JSC',
          focus: 'Phát triển phần mềm',
        },
        {
          period: '03/2023 – 06/2024',
          role: 'Nhân viên',
          org: 'Công ty TNHH SX&XNK Khang Minh',
          focus: 'Công nghệ thông tin & xúc tiến thương mại',
        },
      ],
    },
    skills: {
      heading: 'Công nghệ',
      coreLabel: 'Công nghệ chính',
      core: CORE,
      categories: [
        { label: 'Ngôn ngữ', items: CATEGORY_ITEMS.languages },
        { label: 'Frontend', items: CATEGORY_ITEMS.frontend },
        { label: 'Backend', items: CATEGORY_ITEMS.backend },
        { label: 'Di động', items: CATEGORY_ITEMS.mobile },
        { label: 'CSDL & Cache', items: CATEGORY_ITEMS.database },
        { label: 'DevOps & Hạ tầng', items: CATEGORY_ITEMS.devops },
        { label: 'Cloud', items: CATEGORY_ITEMS.cloud },
        { label: 'API & Bảo mật', items: CATEGORY_ITEMS.api },
        { label: 'Quản lý mã nguồn', items: CATEGORY_ITEMS.vcs },
      ],
      note: 'Phát triển có ý thức bảo mật: xác thực, phân quyền và JWT, hình thành từ môi trường làm việc tại công ty an ninh mạng.',
    },
    projects: {
      heading: 'Dự án tiêu biểu',
      also: 'Ngoài ra: website doanh nghiệp & sản phẩm, công cụ nghiệp vụ nội bộ.',
      caseStudyLabel: 'Xem case study',
      detailsLabel: 'Xem chi tiết',
      items: [
        {
          title: 'Hệ thống quản trị khách sạn ERP',
          years: '2024–2025',
          role: 'Full-Stack Developer',
          scope: 'Doanh nghiệp',
          description: 'Hệ thống quản lý vận hành khách sạn và các quy trình nghiệp vụ liên quan.',
          tags: ['NestJS', 'Next.js', 'PostgreSQL', 'Docker'],
          caseStudyUrl: caseStudy('erp-hotel-management.md'),
        },
        {
          title: 'Hệ thống quản lý Lớp học và giáo viên',
          years: '2025',
          role: 'Full-Stack Developer',
          scope: 'Doanh nghiệp',
          description: 'Hệ thống nội bộ quản lý lớp học và giáo viên.',
          tags: ['Next.js', 'NestJS', 'PostgreSQL'],
        },
        {
          title: 'Hệ thống HRM quản lý nhân sự cho doanh nghiệp',
          years: '2025–2026',
          role: 'Full-Stack Developer',
          scope: 'Doanh nghiệp',
          description: 'Nền tảng nội bộ cho quy trình quản lý tổ chức và nhân sự.',
          tags: ['Java', 'JSP'],
          caseStudyUrl: caseStudy('hrm-system.md'),
        },
        {
          title: 'Nền tảng đào tạo và giáo dục e‑learning',
          years: '2025–2026',
          role: 'Full-Stack Developer',
          scope: 'Doanh nghiệp',
          description: 'Nền tảng học trực tuyến cho giáo dục số và nội dung học tập.',
          tags: ['Next.js', 'NestJS', 'PostgreSQL', 'Redis'],
          caseStudyUrl: caseStudy('e-learning-platform.md'),
        },
        {
          title: 'Hệ thống CRM cho doanh nghiệp',
          years: '2025–2026',
          role: 'Full-Stack Developer',
          scope: 'Doanh nghiệp',
          description: 'Nền tảng cho quy trình liên quan đến khách hàng và vận hành nội bộ.',
          tags: ['NestJS', 'Next.js', 'PostgreSQL', 'Redis', 'Docker'],
          caseStudyUrl: caseStudy('crm-system.md'),
        },
        {
          title: 'Số hoá di tích cho xã phường',
          years: '2025–2026',
          role: 'Full-Stack Developer',
          scope: 'Nhà nước',
          description: 'Số hoá di tích lịch sử – văn hoá địa phương bằng VR360 trên nền web.',
          tags: ['Next.js', 'NestJS', 'PostgreSQL'],
          caseStudyUrl: caseStudy('vr360-digital-heritage.md'),
        },
      ],
    },
    certifications: {
      heading: 'Chứng chỉ',
      items: [
        { name: 'Oracle Cloud Infrastructure (OCI)', issuer: 'Oracle' },
        { name: 'Tin học văn phòng' },
      ],
    },
    contact: {
      heading: 'Cùng nhau xây dựng điều gì đó.',
      email: 'nguyenngoctuyen11032003@gmail.com',
      location: 'Hà Nội, Việt Nam',
      ctaLabel: 'Gửi email cho tôi',
      githubLabel: 'GitHub',
      linkedinLabel: 'LinkedIn',
    },
    a11y: {
      toggleMenu: 'Mở/đóng menu',
      toggleLanguage: 'Chuyển ngôn ngữ',
      email: 'Email',
      scrollDown: 'Cuộn xuống',
      backToTop: 'Lên đầu trang',
      openInNewTab: 'mở trong tab mới',
    },
  },
  en: {
    nav: {
      links: [
        { label: 'About', href: '#about' },
        { label: 'Experience', href: '#experience' },
        { label: 'Skills', href: '#skills' },
        { label: 'Projects', href: '#projects' },
      ],
      contactCta: 'Contact',
    },
    hero: {
      headline:
        "I'm Nguyễn Ngọc Tuyền — a full-stack developer building enterprise systems teams rely on.",
      accent: 'rely on',
      subheading:
        'IT Engineer · Full-Stack Developer at ICS International Cybersecurity JSC · Hanoi',
      ctaProjects: 'View projects',
      ctaContact: 'Contact',
      ctaCv: 'Download CV',
      ctaGithub: 'GitHub',
      badge: 'Currently at ICS',
      stats: [
        { value: '2+', label: 'years of IT experience' },
        { value: '6', label: 'featured projects' },
        { value: '3', label: 'companies' },
      ],
    },
    about: {
      label: 'About',
      heading: 'From business requirements to working software.',
      paragraphPlain:
        'I graduated as an IT Engineer from Đông Á University of Technology (2021–2025) and have 2+ years of professional IT experience across an import-export business, an e-learning company, and',
      paragraphItalic: 'an international cybersecurity company',
      paragraphPlainEnd:
        ', where I work as a full-stack developer on enterprise systems with NestJS, Next.js/React, and PostgreSQL, within an architecture defined by the team.',
      languagesLabel: 'Languages',
      languages: 'English: basic — able to read technical documentation',
      educationLabel: 'Education',
      educationSchool: 'Đông Á University of Technology',
      educationDegree: 'B.Eng. in Information Technology (full-time)',
      educationDates: '09/2021 – 06/2025',
    },
    experience: {
      heading: 'Work experience',
      items: [
        {
          period: '07/2025 – present',
          role: 'IT Engineer / Full-Stack Developer',
          org: 'ICS International Cybersecurity JSC',
          focus: 'Full-stack software development',
          achievements: [
            'Build frontend and backend features with Next.js, React, and NestJS.',
            'Develop REST APIs, business logic, and JWT authentication on PostgreSQL and Redis.',
            'Deliver and maintain features in a large team using Git and Docker.',
          ],
          tags: ICS_TAGS,
        },
        {
          period: '09/2024 – 02/2025',
          role: 'Technical Staff',
          org: 'Học Mãi Education JSC',
          focus: 'Software development',
        },
        {
          period: '03/2023 – 06/2024',
          role: 'Staff',
          org: 'Khang Minh Import-Export Manufacturing Co., Ltd',
          focus: 'IT & trade promotion',
        },
      ],
    },
    skills: {
      heading: 'Tech Stack',
      coreLabel: 'Core stack',
      core: CORE,
      categories: [
        { label: 'Languages', items: CATEGORY_ITEMS.languages },
        { label: 'Frontend', items: CATEGORY_ITEMS.frontend },
        { label: 'Backend', items: CATEGORY_ITEMS.backend },
        { label: 'Mobile', items: CATEGORY_ITEMS.mobile },
        { label: 'Database & Cache', items: CATEGORY_ITEMS.database },
        { label: 'DevOps & Infrastructure', items: CATEGORY_ITEMS.devops },
        { label: 'Cloud', items: CATEGORY_ITEMS.cloud },
        { label: 'API & Security', items: CATEGORY_ITEMS.api },
        { label: 'Version Control', items: CATEGORY_ITEMS.vcs },
      ],
      note: 'Security-aware development: authentication, authorization, and JWT, shaped by working at a cybersecurity company.',
    },
    projects: {
      heading: 'Featured projects',
      also: 'Also: corporate & product websites, internal business tools.',
      caseStudyLabel: 'Case study',
      detailsLabel: 'View details of',
      items: [
        {
          title: 'Hotel Management ERP System',
          years: '2024–2025',
          role: 'Full-Stack Developer',
          scope: 'Enterprise',
          description: 'Management system for hotel operations and related business processes.',
          tags: ['NestJS', 'Next.js', 'PostgreSQL', 'Docker'],
          caseStudyUrl: caseStudy('erp-hotel-management.md'),
        },
        {
          title: 'Classroom & Teacher Management System',
          years: '2025',
          role: 'Full-Stack Developer',
          scope: 'Enterprise',
          description: 'Internal system for managing classrooms and teachers.',
          tags: ['Next.js', 'NestJS', 'PostgreSQL'],
        },
        {
          title: 'HRM System for Enterprise',
          years: '2025–2026',
          role: 'Full-Stack Developer',
          scope: 'Enterprise',
          description: 'Internal platform for organizational and employee management processes.',
          tags: ['Java', 'JSP'],
          caseStudyUrl: caseStudy('hrm-system.md'),
        },
        {
          title: 'E‑learning Education Platform',
          years: '2025–2026',
          role: 'Full-Stack Developer',
          scope: 'Enterprise',
          description: 'Online learning platform for digital education and learning content.',
          tags: ['Next.js', 'NestJS', 'PostgreSQL', 'Redis'],
          caseStudyUrl: caseStudy('e-learning-platform.md'),
        },
        {
          title: 'Enterprise CRM System',
          years: '2025–2026',
          role: 'Full-Stack Developer',
          scope: 'Enterprise',
          description: 'Platform for customer-related workflows and internal operations.',
          tags: ['NestJS', 'Next.js', 'PostgreSQL', 'Redis', 'Docker'],
          caseStudyUrl: caseStudy('crm-system.md'),
        },
        {
          title: 'Heritage Site Digitization System',
          years: '2025–2026',
          role: 'Full-Stack Developer',
          scope: 'Government',
          description: 'Web-based VR360 digitalization of local historical and cultural sites.',
          tags: ['Next.js', 'NestJS', 'PostgreSQL'],
          caseStudyUrl: caseStudy('vr360-digital-heritage.md'),
        },
      ],
    },
    certifications: {
      heading: 'Certifications',
      items: [
        { name: 'Oracle Cloud Infrastructure (OCI)', issuer: 'Oracle' },
        { name: 'Office Informatics' },
      ],
    },
    contact: {
      heading: "Let's build something together.",
      email: 'nguyenngoctuyen11032003@gmail.com',
      location: 'Hanoi, Vietnam',
      ctaLabel: 'Email me',
      githubLabel: 'GitHub',
      linkedinLabel: 'LinkedIn',
    },
    a11y: {
      toggleMenu: 'Toggle menu',
      toggleLanguage: 'Toggle language',
      email: 'Email',
      scrollDown: 'Scroll down',
      backToTop: 'Back to top',
      openInNewTab: 'opens in a new tab',
    },
  },
};
