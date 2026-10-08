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

export interface ProjectImage {
  src: string;
  alt: string;
}

export interface ProjectItem {
  title: string;
  years: string;
  role: string;
  scope: string;
  description?: string;
  highlights?: string[];
  tags?: string[];
  caseStudyUrl?: string;
  liveUrl?: string;
  repoUrl?: string;
  images?: ProjectImage[];
}

export interface CertificationItem {
  name: string;
  issuer?: string;
  /** Short label shown in the list, e.g. "OCI 2025 · Architect Associate". */
  short?: string;
  issued?: string;
  validUntil?: string;
  verifyUrl?: string;
  badge?: string;
  summary?: string;
  skills?: string[];
}

export type ArtifactIcon = 'material' | 'finish' | 'form' | 'mesh' | 'contrast' | 'wind';

export interface ArtifactItem {
  /** Full display name. */
  name: string;
  /** Short name for the tabs. */
  short: string;
  /** Material line, e.g. "Bạc đậu · mỏ mạ vàng". */
  material: string;
  tags: string[];
  description: string;
  traits: { icon: ArtifactIcon; label: string; value: string }[];
  highlight: { icon: ArtifactIcon; text: string };
  caption: string;
  closeUp: string;
  featuredTitle: string;
  featuredText: string;
}

export interface Content {
  nav: {
    links: { label: string; href: string }[];
    contactCta: string;
    /** Labels for the header's dropdown menus. */
    menu: {
      profile: string;
      work: string;
      connect: string;
      /** One row per profile section, in page order. */
      profileItems: { href: string; label: string; desc: string }[];
      workAll: string;
      workArchive: string;
      workArtifacts: string;
      /** Descriptions for GitHub, LinkedIn, CV and email, in that order. */
      connectDesc: [string, string, string, string];
      cvLabel: string;
    };
  };
  hero: {
    badge: string;
    /** Rendered as the h1, split into two display lines after the first word. */
    name: string;
    headline: string;
    accent: string;
    subheading: string;
    ctaProjects: string;
    ctaContact: string;
    ctaCv: string;
    ctaGithub: string;
    /** City shown with the live local time on the portrait chip. */
    city: string;
    /** Hint beside the 3D figure on mouse devices. */
    turnHint: string;
    /** Shown while the 3D model downloads. */
    loadingLabel: string;
    /** Accessible description of the 3D figure. */
    figureAlt: string;
    /** Alt text of the illustrated fallback shown without WebGL. */
    portraitAlt: string;
    statsLabel: string;
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
    /** Giant display title in the About layout. */
    title: string;
    degreeLabel: string;
    periodLabel: string;
    /** Caption above the portal, e.g. "Next:". */
    nextLabel: string;
    /** Label beside the pointer while hovering the portal. */
    enterLabel: string;
  };
  experience: {
    eyebrow: string;
    heading: string;
    /** Part of the heading set in italic serif. */
    headingAccent: string;
    intro: string;
    currentLabel: string;
    companiesLabel: string;
    /** Duration units: [singular, plural] for years and months. */
    units: { year: [string, string]; month: [string, string] };
    items: ExperienceItem[];
  };
  skills: {
    heading: string;
    coreLabel: string;
    core: string[];
    categories: SkillCategory[];
    note: string;
    /** Cinematic scroll stage (SkillsSection.tsx). */
    intro: string;
    tags: string[];
    stackTitle: string;
    stackText: string;
    totalLabel: string;
    groupsLabel: string;
    securityTitle: string;
    securityCta: { label: string; href: string };
    sliderLabel: string;
    prevLabel: string;
    nextLabel: string;
    itemsUnit: string;
  };
  projects: {
    eyebrow: string;
    heading: string;
    /** Part of the heading set in italic serif. */
    headingAccent: string;
    intro: string;
    archiveLink: string;
    viewLabel: string;
    featuredLabel: string;
    also: string;
    caseStudyLabel: string;
    detailsLabel: string;
    liveLabel: string;
    repoLabel: string;
    galleryLabel: string;
    screenshotsLabel: string;
    prevImage: string;
    nextImage: string;
    showImage: string;
    items: ProjectItem[];
  };
  archive: {
    eyebrow: string;
    heading: string;
    hint: string;
    shots: string;
    projects: string;
    listLink: string;
  };
  /** 3D silver-filigree artifacts from the heritage digitization project. */
  artifacts: {
    brand: string;
    source: string;
    nav: { project: string; projectSub: string; eagle: string; boat: string; oneItem: string; tour: string; tourSub: string };
    featuredEyebrow: string;
    featuredLink: string;
    tabsLabel: string;
    counterLabel: string;
    prev: string;
    next: string;
    hint: string;
    loading: string;
    stageLabel: string;
    zoomIn: string;
    zoomOut: string;
    expand: string;
    light: string;
    turnLeft: string;
    turnFull: string;
    turnRight: string;
    traitsHeading: string;
    highlightHeading: string;
    closeUpTitle: string;
    items: ArtifactItem[];
  };
  certifications: {
    eyebrow: string;
    heading: string;
    /** Big statement split around the inline icon row: [before, after]. */
    statement: [string, string];
    tagline: string;
    pills: string[];
    topBar: string;
    counterLabel: string;
    issuedLabel: string;
    validLabel: string;
    skillsLabel: string;
    verifyLabel: string;
    footer: string;
    items: CertificationItem[];
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

const OCI_VERIFY = 'https://catalog-education.oracle.com/ords/certview/sharebadge?id=';
const OCI_FOUNDATIONS_URL = `${OCI_VERIFY}6C0481056659765AEBDF618C414528D51BEFF0EA24301F442262EAA98494389B`;
const OCI_ARCHITECT_URL = `${OCI_VERIFY}E74E09EA617AE459CCAFDE696119A4E6A47EE66142145452C646A6F68858EE75`;

// Skill statements as published on the Oracle verification pages.
const OCI_ARCHITECT_SKILLS = [
  'OCI Identity and Access Management (IAM)',
  'Virtual Cloud Network & VCN connectivity',
  'DNS and Traffic Management',
  'Load Balancer & Network Command Center',
  'Compute instances & autoscaling',
  'Object Storage',
  'Block Storage & File Storage',
];
const OCI_FOUNDATIONS_SKILLS = [
  'Basic cloud concepts',
  'Core OCI services: Compute, Storage, Networking, Database, AI, Observability',
  'OCI security, identity & compliance',
  'OCI billing & cost management',
  'Governance & administration',
];

const ICS_TAGS = ['Next.js', 'React', 'NestJS', 'PostgreSQL', 'Redis', 'Docker', 'Git'];

const VIETDAI_URL = 'https://vietdai-recruitment-web.vercel.app/';

const img = (file: string, alt: string) => ({ src: `/projects/${file}`, alt });

const FOFREEXIT_TAGS = ['Rust', 'Tauri', 'JavaScript', 'PDFium', 'QPDF'];
const VIETDAI_TAGS = ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'];
const MECHMAP_TAGS = ['Leaflet', 'OpenStreetMap'];
const HOTEL_TAGS =['PHP', 'MySQL', 'JavaScript', 'Bootstrap', 'jQuery'];
const HOTEL_REPO = `${links.github}/hotel-erp`;
const GYM_TAGS =['Next.js', 'React', 'TypeScript', 'Tailwind CSS'];
const GYM_REPO = `${links.github}/gym-for-beginners`;
const GYM_URL = 'https://gym-for-beginners-ten.vercel.app/';
const ELEARNING_URL = 'https://elearning-platform-neon.vercel.app/';
const CRM_TAGS = ['NestJS', 'Next.js', 'PostgreSQL', 'Redis', 'Docker'];

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
      menu: {
        profile: 'Hồ sơ',
        work: 'Dự án',
        connect: 'Kết nối',
        profileItems: [
          { href: '#about', label: 'Về tôi', desc: 'Kỹ sư CNTT tại Hà Nội, từ yêu cầu đến sản phẩm.' },
          { href: '#experience', label: 'Kinh nghiệm', desc: 'Hơn 2 năm xây dựng hệ thống doanh nghiệp.' },
          { href: '#skills', label: 'Kỹ năng', desc: 'NestJS, Next.js, React, Flutter, PostgreSQL.' },
          { href: '#certifications', label: 'Chứng chỉ', desc: 'Oracle Cloud Infrastructure 2025.' },
        ],
        workAll: 'Tất cả dự án',
        workArchive: 'Kho ảnh 3D',
        workArtifacts: 'Cổ vật 3D',
        connectDesc: ['Mã nguồn và case study', 'Hồ sơ chuyên môn', 'Bản PDF mới nhất', 'Gửi email trực tiếp'],
        cvLabel: 'Tải CV',
      },
    },
    hero: {
      badge: 'Đang làm việc tại ICS',
      name: 'Nguyễn Ngọc Tuyền',
      headline:
        'Tôi xây dựng những hệ thống đáng tin cậy cho doanh nghiệp — từ cơ sở dữ liệu đến giao diện.',
      accent: 'đáng tin cậy',
      subheading:
        'Kỹ sư CNTT · Lập trình viên Full-Stack tại Công ty CP An ninh mạng Quốc tế ICS · Hà Nội',
      ctaProjects: 'Xem dự án',
      ctaContact: 'Liên hệ với tôi',
      ctaCv: 'Tải CV',
      ctaGithub: 'GitHub',
      city: 'Hà Nội',
      turnHint: 'Di chuột để xoay',
      loadingLabel: 'Đang tải mô hình 3D',
      figureAlt: 'Mô hình 3D toàn thân của Nguyễn Ngọc Tuyền, xoay theo chuyển động của chuột',
      portraitAlt:
        'Tranh minh hoạ Nguyễn Ngọc Tuyền uống cà phê trong phòng làm việc buổi tối, phía sau là các màn hình hiển thị mã nguồn',
      statsLabel: 'Số liệu nổi bật',
      stats: [
        { value: '2+', label: 'năm kinh nghiệm CNTT' },
        { value: '9', label: 'dự án tiêu biểu' },
        { value: '3', label: 'công ty đã gắn bó' },
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
      title: 'Về tôi',
      degreeLabel: 'Bằng cấp',
      periodLabel: 'Thời gian',
      nextLabel: 'Tiếp theo:',
      enterLabel: 'Đi tiếp',
    },
    experience: {
      eyebrow: 'Kinh nghiệm',
      heading: 'Hành trình làm việc',
      headingAccent: 'làm việc',
      intro:
        'Từ xúc tiến thương mại đến kỹ sư full-stack tại một công ty an ninh mạng — mỗi chặng thêm một lớp kỹ năng mới.',
      currentLabel: 'Hiện tại',
      companiesLabel: 'chặng đường',
      units: { year: ['năm', 'năm'], month: ['tháng', 'tháng'] },
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
          role: 'Lập trình viên Backend',
          org: 'Học Mãi JSC',
          focus: 'Nhân viên kỹ thuật · Phát triển hệ thống phía server cho nền tảng giáo dục trực tuyến',
          achievements: [
            'Xây dựng và tối ưu REST API phục vụ các tính năng của nền tảng học trực tuyến.',
            'Thiết kế cơ sở dữ liệu, viết truy vấn và xử lý logic nghiệp vụ phía server, giữ dữ liệu nhất quán và dễ mở rộng.',
            'Phối hợp với đội frontend và kiểm thử để tích hợp API, xử lý lỗi và đưa tính năng lên môi trường vận hành.',
          ],
          tags: ['Node.js', 'REST API', 'SQL', 'Git'],
        },
        {
          period: '03/2023 – 06/2024',
          role: 'Quản lý đội ngũ kỹ thuật',
          org: 'Công ty TNHH SX&XNK Khang Minh',
          focus: 'Thương mại điện tử, xúc tiến thương mại & lập trình web',
          achievements: [
            'Dẫn dắt đội ngũ kỹ thuật của công ty: phân công công việc, theo dõi tiến độ và hỗ trợ xử lý sự cố.',
            'Vận hành mảng thương mại điện tử: gian hàng trực tuyến, danh mục sản phẩm và nội dung bán hàng.',
            'Xây dựng và cập nhật website công ty bằng HTML, CSS và JavaScript.',
            'Đưa AI (Claude) vào quy trình làm việc: soạn nội dung, tự động hóa tác vụ lặp lại và hỗ trợ lập trình.',
          ],
          tags: ['HTML5', 'CSS3', 'JavaScript'],
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
      intro: 'Một stack TypeScript xuyên suốt, từ API, giao diện web đến ứng dụng di động, chạy trên PostgreSQL, Redis và Docker.',
      tags: ['NestJS · Next.js', 'Flutter', 'PostgreSQL · Redis'],
      stackTitle: 'Một ngôn ngữ, mọi tầng.',
      stackText: 'TypeScript nối API NestJS với giao diện React và Next.js; Flutter cho di động; PostgreSQL và Redis giữ dữ liệu.',
      totalLabel: 'Công nghệ & công cụ',
      groupsLabel: 'Nhóm kỹ năng',
      securityTitle: 'Bảo mật là mặc định.',
      securityCta: { label: 'Xem chứng chỉ', href: '#certifications' },
      sliderLabel: 'Các nhóm kỹ năng',
      prevLabel: 'Nhóm trước',
      nextLabel: 'Nhóm tiếp theo',
      itemsUnit: 'công nghệ',
    },
    projects: {
      eyebrow: 'Dự án chọn lọc',
      heading: 'Dự án tiêu biểu',
      headingAccent: 'tiêu biểu',
      intro: 'Những hệ thống tôi đã xây dựng, từ yêu cầu nghiệp vụ đến khi chạy thực tế.',
      archiveLink: 'Xem kho lưu trữ',
      viewLabel: 'Xem',
      featuredLabel: 'Nổi bật',
      also: 'Ngoài ra: website doanh nghiệp & sản phẩm, công cụ nghiệp vụ nội bộ.',
      caseStudyLabel: 'Xem case study',
      detailsLabel: 'Xem chi tiết',
      liveLabel: 'Xem website',
      repoLabel: 'Mã nguồn',
      galleryLabel: 'Xem ảnh dự án',
      screenshotsLabel: 'ảnh',
      prevImage: 'Ảnh trước',
      nextImage: 'Ảnh tiếp theo',
      showImage: 'Xem ảnh',
      items: [
        {
          title: 'FoFreeXit — Phần mềm chỉnh sửa PDF',
          years: '2026',
          role: 'Full-Stack Developer',
          scope: 'Cá nhân · Mã nguồn mở',
          description:
            'Phần mềm chỉnh sửa PDF trên desktop, miễn phí và mã nguồn mở, thay thế Foxit PDF Editor cho các tác vụ thường dùng.',
          highlights: [
            'Engine Rust trên PDFium + QPDF: xem, tìm kiếm, chú thích, tổ chức trang, gộp/tách, hình mờ, đánh số trang.',
            'Sửa nội dung trực tiếp như Word: giữ font gốc (kể cả tiếng Việt), tự bẻ dòng đoạn văn, thêm/sửa ảnh.',
            'Bảo mật: mã hoá AES-256, che thông tin thật (redaction), chữ ký số PKCS#7/PAdES.',
            'Form AcroForm, OCR Tesseract Việt/Anh, chuyển đổi PDF ↔ Word/Excel/ảnh, so sánh tài liệu.',
            'Trợ lý AI: tóm tắt, trích xuất, dịch và ra lệnh thao tác PDF bằng ngôn ngữ tự nhiên; giao diện sáng/tối, song ngữ.',
          ],
          tags: FOFREEXIT_TAGS,
          images: [
            img('fofreexit-1.png', 'FoFreeXit đang mở một file PDF với bảng Trợ lý AI bên phải'),
            img('fofreexit-2.png', 'FoFreeXit ở giao diện tối với menu chọn chủ đề'),
            img('fofreexit-3.png', 'Tab Trang: chèn, xoá, xoay, gộp/tách PDF và thêm hình mờ'),
            img('fofreexit-4.png', 'Sửa nội dung CV trực tiếp như Word kèm Trợ lý AI'),
          ],
        },
        {
          title: 'Nền tảng tuyển dụng Việt – Đài',
          years: '2026',
          role: 'Full-Stack Developer',
          scope: 'Doanh nghiệp',
          description:
            'Website tuyển dụng đưa lao động Việt Nam sang làm việc tại Đài Loan, kèm khu vực ứng viên và trang quản trị.',
          highlights: [
            'Trang công khai: tìm kiếm & lọc việc làm theo quốc gia, ngành, lương, ca làm, địa điểm; xem dạng lưới/danh sách.',
            'Khu vực ứng viên: hồ sơ, CV, việc đã lưu, thông báo, bảo mật tài khoản.',
            'Trang quản trị: tin tuyển dụng, ứng viên, hồ sơ ứng tuyển, blog, thư viện media, báo cáo và phân tích.',
            'Tối ưu SEO (metadata, canonical, Open Graph) và triển khai trên Vercel.',
          ],
          tags: VIETDAI_TAGS,
          liveUrl: VIETDAI_URL,
          images: [
            img('vietdai-1.png', 'Trang chủ nền tảng tuyển dụng với khối tìm kiếm việc làm'),
            img('vietdai-2.png', 'Trang danh sách việc làm với bộ lọc nâng cao'),
            img('vietdai-3.png', 'Trang đăng nhập ứng viên với Google và LinkedIn'),
            img('vietdai-4.png', 'Trang liên hệ với bản đồ văn phòng và hỗ trợ trực tuyến'),
          ],
        },
        {
          title: 'Hệ thống CRM cho doanh nghiệp',
          years: '2025–2026',
          role: 'Full-Stack Developer',
          scope: 'Doanh nghiệp',
          description:
            'Nền tảng CRM quản lý khách hàng, marketing, bán hàng, công việc và KPI cho doanh nghiệp.',
          highlights: [
            'Trang chủ tổng quan: việc cần xử lý, doanh thu, thương vụ, công nợ và biểu đồ marketing theo kỳ.',
            'Hành trình khách hàng dạng Kanban kéo-thả theo từng giai đoạn bán hàng.',
            'Bán hàng: sản phẩm, chính sách giá, báo giá, đơn hàng, hợp đồng và bảng xếp hạng người bán.',
            'Phần tôi phụ trách: không gian Công việc (timeline, Kanban, lịch hẹn, duyệt việc, nhắc việc), phân quyền dự án/công việc và layout module Marketing.',
          ],
          tags: CRM_TAGS,
          caseStudyUrl: caseStudy('crm-system.md'),
          images: [
            img('crm-1.png', 'Trang chủ CRM với các chỉ số kinh doanh'),
            img('crm-2.png', 'Biểu đồ marketing: người tiếp cận theo nguồn và chi phí theo tháng'),
            img('crm-3.png', 'Bảng Kanban hành trình khách hàng'),
            img('crm-4.png', 'Module Bán hàng với thống kê doanh thu và bảng xếp hạng'),
            img('crm-5.png', 'Timeline công việc với các việc quá hạn'),
            img('crm-6.png', 'Danh sách công việc theo dự án với trạng thái và người phụ trách'),
            img('crm-7.png', 'Form thêm công việc: người phụ trách, kiểm duyệt, tham gia và thời gian'),
            img('crm-8.png', 'Thiết lập nhóm quyền và phạm vi dữ liệu theo từng tính năng'),
          ],
        },
        {
          title: 'Gym Training Plan — Giáo án tập 12 tuần',
          years: '2026',
          role: 'Full-Stack Developer',
          scope: 'Cá nhân',
          description:
            'Ứng dụng web ưu tiên di động cho người mới tập gym: mở lên là thấy buổi tập hôm nay, số set, số rep và video hướng dẫn.',
          highlights: [
            'Tự chọn buổi tập theo ngày hiện tại; chuyển nhanh giữa các ngày trong tuần, ngày nghỉ có gợi ý hồi phục.',
            'Mỗi bài tập hiển thị nhóm cơ, số set, số rep và lưu ý kỹ thuật; thống kê tổng bài, tổng set mỗi buổi.',
            'Chi tiết bài tập mở dạng dialog trên desktop và bottom drawer trên điện thoại, kèm video YouTube (hỗ trợ Shorts 9:16).',
            'Chú trọng trợ năng: điều hướng bàn phím, bẫy focus trong overlay, vùng chạm lớn; có test Vitest + Testing Library.',
          ],
          tags: GYM_TAGS,
          liveUrl: GYM_URL,
          repoUrl: GYM_REPO,
          images: [
            img('gym-1.png', 'Trang lịch tập trong tuần với bộ chọn ngày và thời gian nghỉ'),
            img('gym-2.png', 'Danh sách bài tập của buổi Lưng, Xô và Tay trước với số set, số rep'),
            img('gym-3.png', 'Giao diện điện thoại: lịch tập trong tuần và buổi tập hôm nay'),
            img('gym-4.png', 'Bottom drawer chi tiết bài Pull-up với video hướng dẫn dạng Shorts'),
          ],
        },
        {
          title: 'Hệ thống HRM quản lý nhân sự cho doanh nghiệp',
          years: '2025–2026',
          role: 'Full-Stack Developer',
          scope: 'Doanh nghiệp',
          description: 'Nền tảng nội bộ cho quy trình quản lý tổ chức và nhân sự.',
          tags: ['Java', 'JSP'],
          caseStudyUrl: caseStudy('hrm-system.md'),
          images: [
            img('hrm-1.png', 'Dashboard HRM: chấm công hôm nay, thông tin phòng ban và báo cáo công việc'),
            img('hrm-2.png', 'Danh sách dự án dạng thẻ với lead, tiến độ và trạng thái'),
            img('hrm-3.png', 'Bảng Kanban quản lý công việc theo trạng thái'),
            img('hrm-4.png', 'Chi tiết công việc: người giao, người nhận, phòng ban và trạng thái duyệt'),
            img('hrm-5.png', 'Tiến độ công việc theo việc con và lịch sử thay đổi'),
            img('hrm-6.png', 'Thư viện tài liệu nội bộ theo nhóm'),
          ],
        },
        {
          title: 'Nền tảng đào tạo và giáo dục e‑learning',
          years: '2025–2026',
          role: 'Full-Stack Developer',
          scope: 'Doanh nghiệp',
          description: 'Nền tảng học trực tuyến cho giáo dục số và nội dung học tập.',
          highlights: [
            'Trang chủ giới thiệu khoá học lập trình, thiết kế, khoa học dữ liệu và AI cùng đội ngũ giảng viên.',
            'Trang tuyển giảng viên: quyền lợi, quy trình 4 bước đăng ký, tạo nội dung, xuất bản khoá học và nhận thu nhập.',
            'Giảng viên tải lên video, tài liệu và bài kiểm tra, có công cụ AI hỗ trợ soạn nội dung.',
            'Giao diện sáng/tối và chuyển đổi ngôn ngữ.',
          ],
          tags: ['Next.js', 'NestJS', 'PostgreSQL', 'Redis'],
          caseStudyUrl: caseStudy('e-learning-platform.md'),
          liveUrl: ELEARNING_URL,
          images: [
            img('elearning-1.png', 'Trang chủ ICS Learning với khối giới thiệu khoá học'),
            img('elearning-2.png', 'Trang Trở thành giảng viên với các chỉ số quyền lợi'),
            img('elearning-3.png', 'Quy trình 4 bước để trở thành giảng viên'),
          ],
        },
        {
          title: 'Hệ thống quản trị khách sạn ERP',
          years: '2024–2025',
          role: 'Full-Stack Developer',
          scope: 'Cá nhân',
          description:
            'Ứng dụng web quản lý khách sạn gồm website đặt phòng cho khách, trang quản trị và trang dành cho nhân viên.',
          highlights: [
            'Website công khai: giới thiệu khách sạn, danh sách phòng theo loại và giá, form đặt phòng (ngày nhận/trả, thông tin khách); nội dung lấy từ cấu hình trong CSDL.',
            'Trang quản trị: dashboard Chart.js (số phòng, phòng đang dùng/còn trống, doanh thu theo loại phòng, lương và lợi nhuận); quản lý phòng, đặt phòng, trả phòng và thanh toán.',
            'Vận hành nội bộ: khách hàng, dịch vụ phòng, doanh thu nhà hàng, nhân viên, chấm công, bảng lương và tài sản kho.',
            'Nhập phòng và nhân viên hàng loạt từ file Excel (PhpSpreadsheet); báo cáo dạng bảng có xuất file và in.',
            'Phân quyền hai vai trò: quản trị viên toàn quyền, nhân viên chỉ thêm/sửa và tự chấm công.',
          ],
          tags: HOTEL_TAGS,
          caseStudyUrl: caseStudy('erp-hotel-management.md'),
          repoUrl: HOTEL_REPO,
          images: [
            img('hotel-1.png', 'Trang chủ website khách sạn với nút xem phòng'),
            img('hotel-2.png', 'Menu điều hướng toàn màn hình của website'),
            img('hotel-3.png', 'Danh sách phòng kèm giá theo đêm và nút đặt phòng'),
            img('hotel-4.png', 'Bảng điều khiển quản trị: tình trạng phòng, doanh thu và lợi nhuận'),
            img('hotel-5.png', 'Trang Quản lý phòng với trạng thái, giá và thao tác'),
            img('hotel-6.png', 'Cửa sổ chi tiết một phòng deluxe'),
          ],
        },
        {
          title: 'Bản đồ số cơ giới hoá nông nghiệp ĐBSCL',
          years: '2026',
          role: 'Full-Stack Developer',
          scope: 'Nhà nước',
          description:
            'Hệ thống bản đồ số theo dõi năng lực máy nông nghiệp của các hợp tác xã so với nhu cầu từng mùa vụ tại 11 tỉnh Đồng bằng sông Cửu Long.',
          highlights: [
            'Bản đồ số (Leaflet + OpenStreetMap): gom cụm HTX, tô màu khu vực theo mức đáp ứng (đủ, cần chú ý, thiếu, thừa, chưa có dữ liệu); lọc theo mùa vụ, tỉnh, xã, chủng loại và tình trạng máy.',
            'Bảng tình trạng theo khu vực: số HTX, nhu cầu, năng lực, tỉ lệ đáp ứng và khâu sản xuất thiếu máy nhất.',
            'Trang tổng quan: tổng máy, tổng HTX, HTX đủ/thiếu máy theo kết quả cân đối; cơ cấu chủng loại máy và phân bố máy theo tỉnh.',
            'Tích hợp App HTX: nhật ký đồng bộ (kéo định kỳ và App HTX đẩy), tỉ lệ thành công, số bản ghi lỗi/bỏ qua và hàng đợi đối chiếu dữ liệu.',
            'Danh mục & cấu hình: định mức ha/máy/vụ theo khoảng hiệu lực gắn văn bản ban hành, ngưỡng cảnh báo, khâu sản xuất, mùa vụ, đơn vị hành chính.',
          ],
          tags: MECHMAP_TAGS,
          images: [
            img('mechmap-1.png', 'Bản đồ số với bộ lọc, cụm HTX và bảng tình trạng theo khu vực'),
            img('mechmap-2.png', 'Trang tổng quan cơ giới hoá với cơ cấu chủng loại và phân bố máy theo tỉnh'),
            img('mechmap-3.png', 'Trang Tích hợp App HTX với tình trạng và nhật ký đồng bộ'),
            img('mechmap-4.png', 'Danh mục định mức ha/máy/vụ kèm hiệu lực và văn bản ban hành'),
          ],
        },
        {
          title: 'Số hoá di tích cho xã phường',
          years: '2025–2026',
          role: 'Full-Stack Developer',
          scope: 'Nhà nước',
          description: 'Số hoá di tích lịch sử – văn hoá địa phương bằng VR360 trên nền web.',
          tags: ['Next.js', 'NestJS', 'PostgreSQL'],
          caseStudyUrl: caseStudy('vr360-digital-heritage.md'),
          images: [
            img('vr360-1.png', 'Danh sách di tích với trạng thái tour VR360'),
            img('vr360-2.png', 'Trưng bày tác phẩm đậu bạc 3D xoay và phóng to được'),
            img('vr360-3.png', 'Mô hình 3D tượng đầu chim đại bàng đậu bạc'),
            img('vr360-4.png', 'Tour VR360 toàn cảnh với bản đồ tuyến và danh sách cảnh'),
            img('vr360-5.png', 'Thuyết minh song ngữ cho điểm tham quan trong tour'),
            img('vr360-6.png', 'Cảnh VR360 với thanh điều khiển và bảng cài đặt thuyết minh'),
          ],
        },
      ],
    },
    archive: {
      eyebrow: 'Kho lưu trữ dự án',
      heading: 'Những thứ tôi đã xây dựng',
      hint: 'Kéo để xoay',
      shots: 'ảnh',
      projects: 'dự án',
      listLink: 'Xem danh sách dự án',
    },
    artifacts: {
      brand: 'Atlas Đậu Bạc',
      source: 'Dự án số hoá di tích',
      nav: {
        project: 'Dự án',
        projectSub: 'Số hoá di tích xã phường',
        eagle: 'Tượng linh vật',
        boat: 'Mô hình thuyền',
        oneItem: '1 hiện vật',
        tour: 'Tour VR360',
        tourSub: 'Đọc case study',
      },
      featuredEyebrow: 'Hiện vật nổi bật',
      featuredLink: 'Xem case study',
      tabsLabel: 'Chọn hiện vật',
      counterLabel: 'Hiện vật',
      prev: 'Hiện vật trước',
      next: 'Hiện vật tiếp theo',
      hint: 'Kéo để xoay · Ctrl + cuộn để phóng to',
      loading: 'Đang chuẩn bị hiện vật…',
      stageLabel:
        'Mô hình 3D. Kéo hoặc dùng phím mũi tên để xoay, Ctrl + cuộn, chụm hai ngón hoặc phím + và − để phóng to, nhấp đúp hoặc phím 0 để về góc nhìn ban đầu.',
      zoomIn: 'Phóng to',
      zoomOut: 'Thu nhỏ',
      expand: 'Chế độ trưng bày toàn khung',
      light: 'Đổi ánh sáng phòng trưng bày',
      turnLeft: 'Xoay trái 90°',
      turnFull: 'Xoay trọn 360°',
      turnRight: 'Xoay phải 90°',
      traitsHeading: 'Đặc điểm',
      highlightHeading: 'Điểm nhấn',
      closeUpTitle: 'Cận cảnh chi tiết',
      items: [
        {
          name: 'Tượng đầu chim đại bàng đậu bạc, mỏ mạ vàng',
          short: 'Đầu đại bàng',
          material: 'Bạc đậu · mỏ mạ vàng',
          tags: ['Đậu bạc', 'Mỏ mạ vàng', 'Tượng đầu đại bàng'],
          description:
            'Đầu chim đại bàng uy nghi, từng chiếc lông được kết từ sợi bạc đậu, riêng chiếc mỏ được mạ vàng để làm điểm nhấn — sự tương phản giữa sắc bạc và sắc vàng làm nên thần thái mạnh mẽ cho tác phẩm.',
          traits: [
            { icon: 'material', label: 'Chất liệu', value: 'Bạc đậu' },
            { icon: 'finish', label: 'Hoàn thiện', value: 'Mỏ mạ vàng' },
            { icon: 'form', label: 'Loại hình', value: 'Tượng đầu đại bàng' },
            { icon: 'mesh', label: 'Số hoá', value: '3D · ~220k tam giác' },
          ],
          highlight: { icon: 'contrast', text: 'Sắc vàng của chiếc mỏ nổi bật trên nền lông bạc.' },
          caption: 'Lông bạc, mỏ vàng — một ánh nhìn uy nghi.',
          closeUp: 'Từng chiếc lông kết từ sợi bạc đậu; chiếc mỏ mạ vàng là điểm sáng giữa nền bạc.',
          featuredTitle: 'Ánh vàng trên nền bạc.',
          featuredText: 'Bộ lông kết từ sợi bạc đậu, chiếc mỏ mạ vàng làm điểm nhấn.',
        },
        {
          name: 'Thuyền buồm đậu bạc mạ vàng',
          short: 'Thuyền buồm',
          material: 'Bạc đậu · mạ vàng',
          tags: ['Đậu bạc', 'Mạ vàng', 'Mô hình thuyền buồm'],
          description:
            'Con thuyền buồm ba cột với cánh buồm, dây buồm và lan can được kết bằng những sợi bạc se nhỏ, uốn ghép tỉ mỉ rồi mạ vàng. Hình ảnh thuyền buồm thuận gió thường gửi gắm lời chúc làm ăn hanh thông, thuận buồm xuôi gió.',
          traits: [
            { icon: 'material', label: 'Chất liệu', value: 'Bạc đậu' },
            { icon: 'finish', label: 'Hoàn thiện', value: 'Mạ vàng' },
            { icon: 'form', label: 'Loại hình', value: 'Thuyền buồm ba cột' },
            { icon: 'mesh', label: 'Số hoá', value: '3D · ~250k tam giác' },
          ],
          highlight: { icon: 'wind', text: 'Lời chúc làm ăn hanh thông, thuận buồm xuôi gió.' },
          caption: 'Thuận buồm xuôi gió, từng sợi bạc dệt nên cánh buồm.',
          closeUp: 'Cánh buồm và dây buồm là những sợi bạc se nhỏ, uốn ghép tỉ mỉ rồi mạ vàng.',
          featuredTitle: 'Thuận buồm xuôi gió.',
          featuredText: 'Ba cột buồm, từng sợi bạc se nhỏ uốn ghép rồi mạ vàng.',
        },
      ],
    },
    certifications: {
      eyebrow: 'Chứng chỉ',
      heading: 'Chứng chỉ',
      statement: ['Kiến thức đám mây được', 'kiểm chứng bởi Oracle.'],
      tagline: 'Không chỉ học — mà còn được kiểm chứng',
      pills: ['Oracle Cloud', 'Đã xác minh', 'Còn hiệu lực'],
      topBar: 'Xác minh trực tuyến tại trang của Oracle.',
      counterLabel: 'Chứng chỉ',
      issuedLabel: 'Cấp ngày',
      validLabel: 'Hiệu lực đến',
      skillsLabel: 'Kỹ năng được đánh giá',
      verifyLabel: 'Xác minh trên Oracle',
      footer: 'Xây hệ thống trên nền tảng đám mây',
      items: [
        {
          name: 'Oracle Cloud Infrastructure 2025 Certified Architect Associate',
          short: 'OCI 2025 · Architect Associate',
          issuer: 'Oracle',
          issued: '30/10/2025',
          validUntil: '30/10/2027',
          verifyUrl: OCI_ARCHITECT_URL,
          badge: '/certs/oci-architect-2025.webp',
          summary: 'Kiến thức nền tảng vững về thiết kế hạ tầng trên OCI: định danh và phân quyền, mạng, compute và lưu trữ.',
          skills: OCI_ARCHITECT_SKILLS,
        },
        {
          name: 'Oracle Cloud Infrastructure 2025 Certified Foundations Associate',
          short: 'OCI 2025 · Foundations Associate',
          issuer: 'Oracle',
          issued: '27/10/2025',
          validUntil: '27/10/2027',
          verifyUrl: OCI_FOUNDATIONS_URL,
          badge: '/certs/oci-foundations-2025.webp',
          summary: 'Kiến thức nền tảng về các dịch vụ đám mây công cộng của Oracle Cloud Infrastructure.',
          skills: OCI_FOUNDATIONS_SKILLS,
        },
        {
          name: 'Tin học văn phòng',
          short: 'Tin học văn phòng',
        },
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
      menu: {
        profile: 'Profile',
        work: 'Work',
        connect: 'Connect',
        profileItems: [
          { href: '#about', label: 'About', desc: 'IT engineer in Hanoi, from requirements to shipped software.' },
          { href: '#experience', label: 'Experience', desc: '2+ years building enterprise systems.' },
          { href: '#skills', label: 'Skills', desc: 'NestJS, Next.js, React, Flutter, PostgreSQL.' },
          { href: '#certifications', label: 'Certifications', desc: 'Oracle Cloud Infrastructure, 2025.' },
        ],
        workAll: 'All projects',
        workArchive: '3D archive',
        workArtifacts: '3D artifacts',
        connectDesc: ['Code and case studies', 'Professional profile', 'Latest PDF version', 'Write to me directly'],
        cvLabel: 'Download CV',
      },
    },
    hero: {
      badge: 'Currently at ICS',
      name: 'Nguyen Ngoc Tuyen',
      headline: 'I build enterprise systems that teams can rely on — from database to interface.',
      accent: 'rely on',
      subheading:
        'IT Engineer · Full-Stack Developer at ICS International Cybersecurity JSC · Hanoi',
      ctaProjects: 'View projects',
      ctaContact: 'Get in touch',
      ctaCv: 'Download CV',
      ctaGithub: 'GitHub',
      city: 'Hanoi',
      turnHint: 'Move your mouse to turn',
      loadingLabel: 'Loading 3D model',
      figureAlt: 'Full-body 3D model of Nguyen Ngoc Tuyen that turns as you move your mouse',
      portraitAlt:
        'Illustrated portrait of Nguyen Ngoc Tuyen drinking coffee in a night-time workspace, with code on the monitors behind',
      statsLabel: 'Key figures',
      stats: [
        { value: '2+', label: 'years of IT experience' },
        { value: '9', label: 'featured projects' },
        { value: '3', label: 'companies worked at' },
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
      title: 'About',
      degreeLabel: 'Degree',
      periodLabel: 'Period',
      nextLabel: 'Next:',
      enterLabel: 'Enter',
    },
    experience: {
      eyebrow: 'Experience',
      heading: 'Work experience',
      headingAccent: 'experience',
      intro:
        'From trade promotion to full-stack engineering at a cybersecurity company — each stop added a new layer of skill.',
      currentLabel: 'Current',
      companiesLabel: 'stops',
      units: { year: ['yr', 'yrs'], month: ['mo', 'mos'] },
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
          role: 'Backend Developer',
          org: 'Học Mãi Education JSC',
          focus: 'Technical Staff · Server-side development for an online education platform',
          achievements: [
            'Built and optimized REST APIs powering features of the online learning platform.',
            'Designed database schemas, wrote queries, and implemented server-side business logic that keeps data consistent and scalable.',
            'Worked with frontend and QA teams to integrate APIs, fix defects, and ship features to production.',
          ],
          tags: ['Node.js', 'REST API', 'SQL', 'Git'],
        },
        {
          period: '03/2023 – 06/2024',
          role: 'Technical Team Manager',
          org: 'Khang Minh Import-Export Manufacturing Co., Ltd',
          focus: 'E-commerce, trade promotion & web development',
          achievements: [
            "Led the company's technical team: assigned work, tracked progress, and supported incident handling.",
            'Ran the e-commerce operation: online storefronts, product catalog, and sales content.',
            'Built and maintained the company website with HTML, CSS, and JavaScript.',
            'Brought AI (Claude) into daily workflows for content drafting, automating repetitive tasks, and coding support.',
          ],
          tags: ['HTML5', 'CSS3', 'JavaScript'],
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
      intro: 'One TypeScript stack end to end, from APIs and web interfaces to mobile apps, running on PostgreSQL, Redis and Docker.',
      tags: ['NestJS · Next.js', 'Flutter', 'PostgreSQL · Redis'],
      stackTitle: 'One language, every layer.',
      stackText: 'TypeScript links NestJS APIs to React and Next.js interfaces; Flutter covers mobile; PostgreSQL and Redis hold the data.',
      totalLabel: 'Technologies & tools',
      groupsLabel: 'Skill groups',
      securityTitle: 'Security is built in.',
      securityCta: { label: 'See certifications', href: '#certifications' },
      sliderLabel: 'Skill groups',
      prevLabel: 'Previous group',
      nextLabel: 'Next group',
      itemsUnit: 'technologies',
    },
    projects: {
      eyebrow: 'Selected work',
      heading: 'Featured projects',
      headingAccent: 'projects',
      intro: 'Systems I have built, from business requirements to software running in production.',
      archiveLink: 'Open the archive',
      viewLabel: 'View',
      featuredLabel: 'Featured',
      also: 'Also: corporate & product websites, internal business tools.',
      caseStudyLabel: 'Case study',
      detailsLabel: 'View details of',
      liveLabel: 'Visit website',
      repoLabel: 'Source code',
      galleryLabel: 'View screenshots of',
      screenshotsLabel: 'shots',
      prevImage: 'Previous image',
      nextImage: 'Next image',
      showImage: 'Show image',
      items: [
        {
          title: 'FoFreeXit — PDF Editor',
          years: '2026',
          role: 'Full-Stack Developer',
          scope: 'Personal · Open source',
          description:
            'A free, open-source desktop PDF editor built to replace Foxit PDF Editor for everyday tasks.',
          highlights: [
            'Rust engine on PDFium + QPDF: viewing, search, annotations, page organization, merge/split, watermarks, page numbers.',
            'Word-like in-place editing: keeps the original fonts (including Vietnamese), reflows paragraphs, adds and edits images.',
            'Security: AES-256 encryption, true redaction, PKCS#7/PAdES digital signatures.',
            'AcroForm forms, Vietnamese/English Tesseract OCR, PDF ↔ Word/Excel/image conversion, document comparison.',
            'AI assistant: summarize, extract, translate and run PDF commands in natural language; light/dark themes, bilingual UI.',
          ],
          tags: FOFREEXIT_TAGS,
          images: [
            img('fofreexit-1.png', 'FoFreeXit with a PDF open and the AI Assistant panel on the right'),
            img('fofreexit-2.png', 'FoFreeXit in dark mode with the theme menu open'),
            img('fofreexit-3.png', 'Page tab: insert, delete, rotate, merge/split PDFs and add watermarks'),
            img('fofreexit-4.png', 'Word-like in-place editing of a resume with the AI Assistant'),
          ],
        },
        {
          title: 'Vietnam–Taiwan Recruitment Platform',
          years: '2026',
          role: 'Full-Stack Developer',
          scope: 'Enterprise',
          description:
            'A recruitment website placing Vietnamese workers in jobs in Taiwan, with a candidate area and an admin panel.',
          highlights: [
            'Public site: job search and filters by country, industry, salary, shift and location; grid and list views.',
            'Candidate area: profile, resume, saved jobs, notifications, account security.',
            'Admin panel: job posts, candidates, applications, blog, media library, reports and analytics.',
            'SEO-ready (metadata, canonical, Open Graph), deployed on Vercel.',
          ],
          tags: VIETDAI_TAGS,
          liveUrl: VIETDAI_URL,
          images: [
            img('vietdai-1.png', 'Recruitment platform home page with the job search block'),
            img('vietdai-2.png', 'Job listing page with advanced filters'),
            img('vietdai-3.png', 'Candidate sign-in page with Google and LinkedIn'),
            img('vietdai-4.png', 'Contact page with office map and live support'),
          ],
        },
        {
          title: 'Enterprise CRM System',
          years: '2025–2026',
          role: 'Full-Stack Developer',
          scope: 'Enterprise',
          description:
            'A CRM platform for customers, marketing, sales, tasks and KPIs.',
          highlights: [
            'Overview dashboard: pending actions, revenue, deals, receivables and marketing charts per period.',
            'Drag-and-drop Kanban customer journey across sales stages.',
            'Sales: products, pricing policies, quotes, orders, contracts and a top-seller leaderboard.',
            'My part: the Tasks workspace (timeline, Kanban, appointments, approvals, reminders), project/task permissions and the Marketing module layouts.',
          ],
          tags: CRM_TAGS,
          caseStudyUrl: caseStudy('crm-system.md'),
          images: [
            img('crm-1.png', 'CRM home dashboard with business metrics'),
            img('crm-2.png', 'Marketing charts: reach by source and monthly spend'),
            img('crm-3.png', 'Customer journey Kanban board'),
            img('crm-4.png', 'Sales module with revenue stats and leaderboard'),
            img('crm-5.png', 'Task timeline with overdue items'),
            img('crm-6.png', 'Project task list with status and assignees'),
            img('crm-7.png', 'New task form: assignee, reviewer, participants and schedule'),
            img('crm-8.png', 'Permission groups and data scope per feature'),
          ],
        },
        {
          title: 'Gym Training Plan — 12-Week Program',
          years: '2026',
          role: 'Full-Stack Developer',
          scope: 'Personal',
          description:
            "A mobile-first web app for gym beginners: open it and see today's session, sets, reps and how-to videos.",
          highlights: [
            "Selects today's session from the current date; quick switching between weekdays, with recovery tips on rest days.",
            'Each exercise shows target muscles, sets, reps and technique notes; per-session totals for exercises and sets.',
            'Exercise details open as a dialog on desktop and a bottom drawer on mobile, with YouTube videos (including 9:16 Shorts).',
            'Accessibility-focused: keyboard navigation, focus trapping in overlays, large touch targets; tested with Vitest + Testing Library.',
          ],
          tags: GYM_TAGS,
          liveUrl: GYM_URL,
          repoUrl: GYM_REPO,
          images: [
            img('gym-1.png', 'Weekly schedule page with day selector and rest times'),
            img('gym-2.png', 'Back, lats and biceps session with sets and reps per exercise'),
            img('gym-3.png', "Mobile view: weekly schedule and today's session"),
            img('gym-4.png', 'Pull-up detail bottom drawer with a Shorts how-to video'),
          ],
        },
        {
          title: 'HRM System for Enterprise',
          years: '2025–2026',
          role: 'Full-Stack Developer',
          scope: 'Enterprise',
          description: 'Internal platform for organizational and employee management processes.',
          tags: ['Java', 'JSP'],
          caseStudyUrl: caseStudy('hrm-system.md'),
          images: [
            img('hrm-1.png', "HRM dashboard: today's attendance, department info and task report"),
            img('hrm-2.png', 'Project cards with lead, progress and status'),
            img('hrm-3.png', 'Task management Kanban board by status'),
            img('hrm-4.png', 'Task details: assigner, assignees, department and approval status'),
            img('hrm-5.png', 'Task progress by subtasks with change history'),
            img('hrm-6.png', 'Internal document library organized by group'),
          ],
        },
        {
          title: 'E‑learning Education Platform',
          years: '2025–2026',
          role: 'Full-Stack Developer',
          scope: 'Enterprise',
          description: 'Online learning platform for digital education and learning content.',
          highlights: [
            'Home page showcasing programming, design, data science and AI courses and the instructor team.',
            'Instructor recruitment page: benefits and a 4-step flow to register, create content, publish courses and earn.',
            'Instructors upload videos, materials and quizzes, with AI tools to help author content.',
            'Light/dark themes and a language switcher.',
          ],
          tags: ['Next.js', 'NestJS', 'PostgreSQL', 'Redis'],
          caseStudyUrl: caseStudy('e-learning-platform.md'),
          liveUrl: ELEARNING_URL,
          images: [
            img('elearning-1.png', 'ICS Learning home page with the course hero'),
            img('elearning-2.png', 'Become an Instructor page with benefit stats'),
            img('elearning-3.png', 'The 4-step flow to become an instructor'),
          ],
        },
        {
          title: 'Hotel Management ERP System',
          years: '2024–2025',
          role: 'Full-Stack Developer',
          scope: 'Personal',
          description:
            'A hotel management web app with a public booking site, an admin panel and a staff panel.',
          highlights: [
            'Public site: hotel introduction, rooms by type and price, and a booking form (check-in/check-out dates, guest details); content comes from settings in the database.',
            'Admin panel: Chart.js dashboard (rooms, occupied/available, revenue by room type, payroll and profit); rooms, reservations, check-out and payments.',
            'Internal operations: customers, room service, restaurant sales, staff, attendance, payroll and inventory assets.',
            'Bulk import of rooms and staff from Excel (PhpSpreadsheet); table reports with export and print.',
            'Two roles: administrators with full access, staff limited to add/edit and their own attendance.',
          ],
          tags: HOTEL_TAGS,
          caseStudyUrl: caseStudy('erp-hotel-management.md'),
          repoUrl: HOTEL_REPO,
          images: [
            img('hotel-1.png', 'Hotel website home page with the view-rooms button'),
            img('hotel-2.png', 'Full-screen navigation menu of the website'),
            img('hotel-3.png', 'Room listing with nightly prices and booking buttons'),
            img('hotel-4.png', 'Admin dashboard: room status, revenue and profit'),
            img('hotel-5.png', 'Room management page with status, price and actions'),
            img('hotel-6.png', 'Detail dialog for a deluxe room'),
          ],
        },
        {
          title: 'Mekong Delta Farm Mechanization Digital Map',
          years: '2026',
          role: 'Full-Stack Developer',
          scope: 'Government',
          description:
            "A digital map system tracking cooperatives' farm machinery capacity against seasonal demand across 11 Mekong Delta provinces.",
          highlights: [
            'Digital map (Leaflet + OpenStreetMap): clustered cooperatives, regions colored by coverage level (sufficient, watch, short, surplus, no data); filters by season, province, commune, machine type and status.',
            'Per-region status table: cooperatives, demand, capacity, coverage rate and the production stage most short of machines.',
            'Overview dashboard: total machines and cooperatives, cooperatives with enough/too few machines from the balancing results; machine type mix and machines per province.',
            'Cooperative app integration: sync log (scheduled pulls and app pushes), success rate, failed/skipped records and a data reconciliation queue.',
            'Catalogs & settings: ha/machine/season norms with validity periods tied to issuing decisions, alert thresholds, production stages, seasons, administrative units.',
          ],
          tags: MECHMAP_TAGS,
          images: [
            img('mechmap-1.png', 'Digital map with filters, cooperative clusters and the per-region status table'),
            img('mechmap-2.png', 'Mechanization overview with machine type mix and machines per province'),
            img('mechmap-3.png', 'Cooperative app integration page with sync status and log'),
            img('mechmap-4.png', 'Ha/machine/season norms catalog with validity and issuing documents'),
          ],
        },
        {
          title: 'Heritage Site Digitization System',
          years: '2025–2026',
          role: 'Full-Stack Developer',
          scope: 'Government',
          description: 'Web-based VR360 digitalization of local historical and cultural sites.',
          tags: ['Next.js', 'NestJS', 'PostgreSQL'],
          caseStudyUrl: caseStudy('vr360-digital-heritage.md'),
          images: [
            img('vr360-1.png', 'Heritage site list with VR360 tour status'),
            img('vr360-2.png', '3D silver filigree gallery with rotate and zoom'),
            img('vr360-3.png', '3D model of a silver filigree eagle head'),
            img('vr360-4.png', 'Aerial VR360 tour with route map and scene list'),
            img('vr360-5.png', 'Bilingual narration for a point of interest in the tour'),
            img('vr360-6.png', 'VR360 scene with control bar and narration settings'),
          ],
        },
      ],
    },
    archive: {
      eyebrow: 'Project archive',
      heading: 'Things I have built',
      hint: 'Drag to rotate',
      shots: 'shots',
      projects: 'projects',
      listLink: 'See the project list',
    },
    artifacts: {
      brand: 'Filigree Atlas',
      source: 'Heritage digitization project',
      nav: {
        project: 'Project',
        projectSub: 'Heritage site digitization',
        eagle: 'Sculptures',
        boat: 'Ship models',
        oneItem: '1 artifact',
        tour: 'VR360 tour',
        tourSub: 'Read the case study',
      },
      featuredEyebrow: 'Featured artifact',
      featuredLink: 'Read the case study',
      tabsLabel: 'Choose an artifact',
      counterLabel: 'Artifact',
      prev: 'Previous artifact',
      next: 'Next artifact',
      hint: 'Drag to turn · Ctrl + scroll to zoom',
      loading: 'Preparing the artifact…',
      stageLabel:
        '3D model. Drag or use the arrow keys to turn; Ctrl + scroll, pinch or the + and − keys to zoom; double-click or press 0 to reset the view.',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      expand: 'Full-frame display mode',
      light: 'Switch gallery lighting',
      turnLeft: 'Turn left 90°',
      turnFull: 'Turn a full 360°',
      turnRight: 'Turn right 90°',
      traitsHeading: 'Key traits',
      highlightHeading: 'Highlight',
      closeUpTitle: 'Close-up detail',
      items: [
        {
          name: 'Silver filigree eagle head, gilded beak',
          short: 'Eagle head',
          material: 'Silver filigree · gilded beak',
          tags: ['Silver filigree', 'Gilded beak', 'Eagle head sculpture'],
          description:
            'A majestic eagle head: every feather is built from silver filigree wire, while the beak alone is gilded as an accent — the contrast between silver and gold gives the piece its commanding presence.',
          traits: [
            { icon: 'material', label: 'Material', value: 'Silver filigree' },
            { icon: 'finish', label: 'Finish', value: 'Gilded beak' },
            { icon: 'form', label: 'Form', value: 'Eagle head sculpture' },
            { icon: 'mesh', label: 'Digital', value: '3D · ~220k triangles' },
          ],
          highlight: { icon: 'contrast', text: 'A gold beak set against silver plumage.' },
          caption: 'Silver feathers, a golden beak — a commanding gaze.',
          closeUp: 'Each feather is formed from silver filigree; the gilded beak is the bright point on the silver.',
          featuredTitle: 'Gold against silver.',
          featuredText: 'Plumage of silver filigree, with a gilded beak as the accent.',
        },
        {
          name: 'Gilded silver filigree sailing ship',
          short: 'Sailing ship',
          material: 'Silver filigree · gold-plated',
          tags: ['Silver filigree', 'Gold-plated', 'Sailing ship model'],
          description:
            'A three-masted sailing ship whose sails, rigging and railings are made from finely twisted silver wire, meticulously bent and joined, then gold-plated. A ship running before the wind carries the wish for smooth, prosperous business — fair winds and following seas.',
          traits: [
            { icon: 'material', label: 'Material', value: 'Silver filigree' },
            { icon: 'finish', label: 'Finish', value: 'Gold-plated' },
            { icon: 'form', label: 'Form', value: 'Three-masted ship' },
            { icon: 'mesh', label: 'Digital', value: '3D · ~250k triangles' },
          ],
          highlight: { icon: 'wind', text: 'A wish for prosperous business and fair winds.' },
          caption: 'Fair winds — sails woven from threads of silver.',
          closeUp: 'Sails and rigging are finely twisted silver wire, bent and joined by hand, then gold-plated.',
          featuredTitle: 'Fair winds ahead.',
          featuredText: 'Three masts, each silver thread twisted, joined and gold-plated.',
        },
      ],
    },
    certifications: {
      eyebrow: 'Certifications',
      heading: 'Certifications',
      statement: ['Cloud knowledge', 'verified by Oracle.'],
      tagline: 'Not just learned — verified',
      pills: ['Oracle Cloud', 'Verified', 'Active'],
      topBar: 'Verifiable online on Oracle’s site.',
      counterLabel: 'Certificate',
      issuedLabel: 'Issued',
      validLabel: 'Valid until',
      skillsLabel: 'Skills assessed',
      verifyLabel: 'Verify on Oracle',
      footer: 'Building systems on the cloud',
      items: [
        {
          name: 'Oracle Cloud Infrastructure 2025 Certified Architect Associate',
          short: 'OCI 2025 · Architect Associate',
          issuer: 'Oracle',
          issued: '30 Oct 2025',
          validUntil: '30 Oct 2027',
          verifyUrl: OCI_ARCHITECT_URL,
          badge: '/certs/oci-architect-2025.webp',
          summary: 'Strong foundational knowledge of architecting infrastructure on OCI: identity and access, networking, compute and storage.',
          skills: OCI_ARCHITECT_SKILLS,
        },
        {
          name: 'Oracle Cloud Infrastructure 2025 Certified Foundations Associate',
          short: 'OCI 2025 · Foundations Associate',
          issuer: 'Oracle',
          issued: '27 Oct 2025',
          validUntil: '27 Oct 2027',
          verifyUrl: OCI_FOUNDATIONS_URL,
          badge: '/certs/oci-foundations-2025.webp',
          summary: 'Fundamental knowledge of the public cloud services provided by Oracle Cloud Infrastructure.',
          skills: OCI_FOUNDATIONS_SKILLS,
        },
        {
          name: 'Office Informatics',
          short: 'Office Informatics',
        },
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
