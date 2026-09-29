import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm

HERE = os.path.dirname(os.path.abspath(__file__))
for n, f in [("B", "Barlow-Regular.ttf"), ("B-M", "Barlow-Medium.ttf"), ("B-S", "Barlow-SemiBold.ttf")]:
    pdfmetrics.registerFont(TTFont(n, os.path.join(HERE, f)))
pdfmetrics.registerFontFamily("B", normal="B", bold="B-S", italic="B", boldItalic="B-S")

ACC = HexColor("#0F766E"); INK = HexColor("#1F2937"); MUT = HexColor("#4B5563")
base = ParagraphStyle("b", fontName="B", fontSize=10, leading=13.8, textColor=INK)
S = lambda n, **k: ParagraphStyle(n, parent=base, **k)
name = S("n", fontName="B-S", fontSize=26, leading=30, textColor=INK)
sub = S("s", fontName="B-M", fontSize=11.5, leading=15, textColor=ACC)
contact = S("c", fontSize=8.7, textColor=MUT)
head = S("h", fontName="B-S", fontSize=10, leading=13, textColor=ACC, spaceBefore=11, spaceAfter=0)
role = S("r", fontName="B-S", fontSize=10, leading=13)
bul = S("bl", leftIndent=11, bulletIndent=2, spaceBefore=0.5)
proj = S("p", leftIndent=0, spaceBefore=1)

def link(t, u): return f'<link href="{u}" color="#0F766E">{t}</link>'
def section(t): return [Paragraph(t.upper(), head), HRFlowable(width="100%", thickness=0.6, color=ACC, spaceBefore=1.5, spaceAfter=4)]
def job(title, org, dates, bullets):
    t = Table([[Paragraph(f'{title} — <font name="B" color="#4B5563">{org}</font>', role), Paragraph(dates, S("d", alignment=2, textColor=MUT))]],
              colWidths=[None, 30*mm])
    t.setStyle(TableStyle([("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),1),("VALIGN",(0,0),(-1,-1),"TOP")]))
    return [t] + [Paragraph(b, bul, bulletText="•") for b in bullets]

W, H = A4; M = 17*mm
doc = BaseDocTemplate(os.path.join(HERE, "..", "public", "cv.pdf"), pagesize=A4, leftMargin=M, rightMargin=M, topMargin=14*mm, bottomMargin=12*mm,
                      title="Nguyễn Ngọc Tuyền — CV", author="Nguyễn Ngọc Tuyền")
doc.addPageTemplates([PageTemplate(id="p", frames=[Frame(M, 12*mm, W-2*M, H-26*mm, 0, 0, 0, 0)])])

st = []
st += [Paragraph("Nguyễn Ngọc Tuyền", name), Paragraph("IT Engineer | Full-Stack Developer · Hanoi, Vietnam", sub), Spacer(1, 3),
       Paragraph(" · ".join([link("nguyenngoctuyen11032003@gmail.com", "mailto:nguyenngoctuyen11032003@gmail.com"),
                             link("github.com/nguyenngoctuyen11032003", "https://github.com/nguyenngoctuyen11032003"),
                             link("linkedin.com/in/tuyền-nguyễn-ngọc-40432243b", "https://www.linkedin.com/in/tuy%E1%BB%81n-nguy%E1%BB%85n-ng%E1%BB%8Dc-40432243b/")]), contact)]
st += section("Summary")
st += [Paragraph("IT Engineer and Full-Stack Developer with 2+ years of professional IT experience building business applications and enterprise management systems (HRM, CRM, ERP, e-learning, VR360 digital heritage). Full-stack implementation with NestJS, Next.js/React, and PostgreSQL within a system architecture defined by the team and technical leads.", base)]
st += section("Experience")
st += job("IT Engineer / Full-Stack Developer", "ICS International Cybersecurity JSC", "07/2025 – Present",
          ["Build frontend and backend features with Next.js, React, and NestJS.",
           "Develop REST APIs, business logic, and JWT authentication on PostgreSQL and Redis.",
           "Deliver and maintain features in a large team using Git and Docker."])
st += job("Technical Staff — Software Development", "Học Mãi Education JSC", "09/2024 – 02/2025",
          ["Contributed to software development for an e-learning business."])
st += job("Staff — IT &amp; Trade Promotion", "Khang Minh Import-Export Manufacturing Co., Ltd", "03/2023 – 06/2024",
          ["Handled IT tasks and trade promotion activities for the company."])
st += section("Selected Projects")
st += [Paragraph('<font name="B" color="#4B5563">Role on all projects: Full-Stack Developer</font>', S("rl", spaceAfter=2))]
for t, y, tech in [("HRM System for Enterprise", "2025–2026", "Java, JSP"),
                   ("Enterprise CRM System", "2025–2026", "NestJS, Next.js, PostgreSQL, Redis, Docker"),
                   ("E-learning Education Platform", "2025–2026", "Next.js, NestJS, PostgreSQL, Redis"),
                   ("Heritage Site Digitization, VR360 (Government", "2025–2026)", "Next.js, NestJS, PostgreSQL"),
                   ("Hotel Management ERP System", "2024–2025", "NestJS, Next.js, PostgreSQL, Docker"),
                   ("Classroom &amp; Teacher Management System", "2025", "Next.js, NestJS, PostgreSQL")]:
    if t.startswith("Heritage"):
        line = f'<font name="B-S">Heritage Site Digitization, VR360</font> (Government, 2025–2026) — {tech}'
    else:
        line = f'<font name="B-S">{t}</font> ({y}) — {tech}'
    st.append(Paragraph(line, bul, bulletText="•"))
st.append(Paragraph("Case studies: " + link("github.com/nguyenngoctuyen11032003/project-case-studies", "https://github.com/nguyenngoctuyen11032003/project-case-studies"), bul, bulletText="•"))
st += section("Technical Skills")
sk = [("Languages", "TypeScript, JavaScript, Dart, Java, Python, SQL, HTML5, CSS3"), ("Frontend", "React, Next.js"), ("Backend", "Node.js, NestJS"),
      ("Mobile", "Flutter, Android"), ("Database &amp; Cache", "PostgreSQL, MySQL, Redis"), ("DevOps", "Docker, Linux, Nginx, CI/CD"),
      ("Cloud", "AWS, Oracle Cloud Infrastructure, Firebase"), ("API &amp; Security", "REST API, JWT, authentication, authorization"),
      ("Collaboration", "Git, GitHub (branching, merging, conflict resolution in team workflows)")]
t = Table([[Paragraph(f'<font name="B-S">{a}</font>', base), Paragraph(b, base)] for a, b in sk], colWidths=[33*mm, None])
t.setStyle(TableStyle([("LEFTPADDING",(0,0),(-1,-1),0),("TOPPADDING",(0,0),(-1,-1),0.8),("BOTTOMPADDING",(0,0),(-1,-1),0.8),("VALIGN",(0,0),(-1,-1),"TOP")]))
st.append(t)
st += section("Education")
st += job("B.Eng. in Information Technology (full-time)", "Đông Á University of Technology", "09/2021 – 06/2025", [])
st += section("Certifications &amp; Languages")
st += [Paragraph("Oracle Cloud Infrastructure (OCI) · Office Informatics · English: basic (technical documentation)", base)]
doc.build(st)
