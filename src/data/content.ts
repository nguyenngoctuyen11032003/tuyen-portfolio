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
    liveLabel: string;
    repoLabel: string;
    galleryLabel: string;
    screenshotsLabel: string;
    prevImage: string;
    nextImage: string;
    showImage: string;
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
        { value: '9', label: 'dự án tiêu biểu' },
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
        { value: '9', label: 'featured projects' },
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
