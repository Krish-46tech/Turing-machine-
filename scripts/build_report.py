from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.shared import Inches, Mm, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import re

ROOT=Path(__file__).resolve().parents[1]
DOCS=ROOT/'docs'; DIAGS=DOCS/'diagrams'; OUT=DOCS/'M1_Report.docx'
NAVY='#17365D'; BLUE='#DCE6F1'; PALE='#F4F7FA'; GRAY='#D9E0E8'

def font(size,bold=False):
    try:return ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',size)
    except:return ImageFont.load_default()

def diagram(name,title,columns):
    w,h=1600,850; im=Image.new('RGB',(w,h),'white'); d=ImageDraw.Draw(im)
    d.text((70,45),title,fill='#111827',font=font(42,True))
    boxw=360; boxh=95; gapx=120; top=170
    coords=[]
    for col,items in enumerate(columns):
        x=70+col*(boxw+gapx)
        for row,label in enumerate(items):
            y=top+row*160; coords.append((col,row,x,y,label))
            d.rounded_rectangle((x,y,x+boxw,y+boxh),18,fill='#EDF4FF',outline='#315B9A',width=4)
            bbox=d.multiline_textbbox((0,0),label,font=font(23,True),spacing=5,align='center')
            tw=bbox[2]-bbox[0]; th=bbox[3]-bbox[1]
            d.multiline_text((x+(boxw-tw)/2,y+(boxh-th)/2),label,fill='#17365D',font=font(23,True),spacing=5,align='center')
    for a,b in zip(coords,coords[1:]):
        if b[0]==a[0] and b[1]==a[1]+1:
            x=a[2]+boxw/2; y1=a[3]+boxh; y2=b[3]
            d.line((x,y1,x,y2-12),fill='#60728A',width=5);d.polygon([(x-9,y2-18),(x+9,y2-18),(x,y2)],fill='#60728A')
    im.save(DIAGS/name)

diagram('architecture.png','Figure 3  TuringLab System Architecture',[
 ['React User Interface','Input and Definition\nValidation','Machine Configuration'],
 ['TypeScript Execution\nEngine','Sparse Tape Manager','Snapshot and History\nManager'],
 ['Tape and Graph\nVisualization','Result Module','Validation Dashboard']])
diagram('flowchart.png','Figure 4  Simulator Execution Flow',[
 ['Initialize Machine\nand Input','Valid?','Already Halted?'],
 ['Read State and Symbol','Rule Available?','Write Move Update'],
 ['Record Snapshot','Accept or Reject?','Continue or Limit']])
diagram('uml.png','Figure 5  Component and Class Relationships',[
 ['MachineDefinition','SimulatorStore'],['TuringMachineEngine','SparseTape','ExecutionSnapshot'],['React Components','Import Export','Validation Runner']])
diagram('sequence.png','Figure 6  Step Execution Sequence',[
 ['User','React UI'],['Zustand Store','TuringMachineEngine'],['SparseTape','ExecutionSnapshot']])
diagram('usecase.png','Figure 5  Primary Use Cases',[
 ['Student','Lecturer'],['Select or Define\nMachine','Enter Input','Control Execution'],['Inspect Visualization','Run Validation','Export Evidence']])

doc=Document(); sec=doc.sections[0]
sec.page_width=Mm(210);sec.page_height=Mm(297);sec.top_margin=Mm(22);sec.bottom_margin=Mm(20);sec.left_margin=Mm(23);sec.right_margin=Mm(20)
styles=doc.styles
styles['Normal'].font.name='Aptos';styles['Normal'].font.size=Pt(10.5);styles['Normal'].font.color.rgb=RGBColor.from_string('20242B')
styles['Normal'].paragraph_format.space_after=Pt(7);styles['Normal'].paragraph_format.line_spacing=1.15
for name,size in [('Title',25),('Heading 1',17),('Heading 2',13),('Heading 3',11)]:
    st=styles[name];st.font.name='Aptos Display';st.font.size=Pt(size);st.font.bold=True;st.font.color.rgb=RGBColor(0,0,0)
    st.paragraph_format.space_before=Pt(14 if name!='Title' else 0);st.paragraph_format.space_after=Pt(6);st.paragraph_format.keep_with_next=True

def set_cell_shading(cell,fill):
    tcPr=cell._tc.get_or_add_tcPr();shd=tcPr.find(qn('w:shd'))
    if shd is None: shd=OxmlElement('w:shd');tcPr.append(shd)
    shd.set(qn('w:fill'),fill.replace('#',''))
def set_cell_border(cell,color='D9D9D9'):
    tcPr=cell._tc.get_or_add_tcPr();borders=OxmlElement('w:tcBorders')
    for edge in ('top','left','bottom','right','insideH','insideV'):
        tag=OxmlElement(f'w:{edge}');tag.set(qn('w:val'),'single');tag.set(qn('w:sz'),'6');tag.set(qn('w:color'),color);borders.append(tag)
    tcPr.append(borders)
def add_table(rows,widths=None):
    t=doc.add_table(rows=len(rows),cols=len(rows[0]));t.alignment=WD_TABLE_ALIGNMENT.CENTER;t.autofit=False
    for r,row in enumerate(rows):
        for c,val in enumerate(row):
            cell=t.cell(r,c);cell.text=val;cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER;set_cell_border(cell)
            if widths: cell.width=Inches(widths[c])
            for p in cell.paragraphs:
                p.paragraph_format.space_after=Pt(2);p.paragraph_format.space_before=Pt(2)
                for run in p.runs:run.font.size=Pt(8.3);run.font.name='Aptos'
            if r==0:
                set_cell_shading(cell,NAVY)
                for run in cell.paragraphs[0].runs:run.font.bold=True;run.font.color.rgb=RGBColor(255,255,255)
            elif r%2==0:set_cell_shading(cell,PALE)
    doc.add_paragraph().paragraph_format.space_after=Pt(1)
    return t
def add_field(paragraph,code):
    run=paragraph.add_run();begin=OxmlElement('w:fldChar');begin.set(qn('w:fldCharType'),'begin');instr=OxmlElement('w:instrText');instr.set(qn('xml:space'),'preserve');instr.text=code;sep=OxmlElement('w:fldChar');sep.set(qn('w:fldCharType'),'separate');end=OxmlElement('w:fldChar');end.set(qn('w:fldCharType'),'end');run._r.extend([begin,instr,sep,end])

# Cover
p=doc.add_paragraph(style='Title');p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.add_run('Design and Development of an\nInteractive Turing Machine Simulator')
p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;r=p.add_run('CSET302  Automata Theory and Computability');r.bold=True;r.font.size=Pt(13)
p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.add_run('M1  Problem Analysis and Project Design').italic=True
doc.add_paragraph('\n')
add_table([['Submission field','Value'],['University name','Bennett University'],['Student name','Krish Kumar'],['Enrollment number','S24CSEU1480'],['Faculty name','Dr Vicky Vikrant'],['Academic year','2028'],['Submission date','2 November 2026']],[2.2,3.6])
p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.space_before=Pt(30);p.add_run('TuringLab').bold=True
p.add_run('\nVerified implementation and design report\n2 November 2026').italic=True
doc.add_page_break()

# Stable rendered contents index. Editable Word heading styles remain available for an automatic TOC update.
doc.add_heading('Table of Contents',level=1)
toc=[('Acknowledgement','3'),('Abstract','3'),('1  Introduction','3'),('2  Problem Statement','3'),('3  Motivation and Problem Selection','3'),('4  Project Objectives','3'),('5  Scope','4'),('6  Formal Automata Specification','4'),('7  Existing Tools and Comparative Analysis','4'),('8  Feasibility Study','5'),('9  Technology Stack','5'),('10  System Architecture','5'),('11  Software Modules','6'),('12  Simulator Flowchart','6'),('13  UML Diagrams','7'),('14  UI Design and Mock-ups','8'),('15  Algorithm Selection','9'),('16  Pseudocode','9'),('17  Correctness Analysis','10'),('18  Complexity Analysis','10'),('19  Manual Validation Example','10'),('20  Built-in Machines','11'),('21  Testing and Verification','11'),('22  Results and Discussion','11'),('23  Limitations','11'),('24  Future Enhancements','12'),('25  Conclusion','12'),('27  References','12'),('28  Appendix A Installation','12'),('29  Appendix B Directory and Sample JSON','13')]
rows=[]
for j in range(0,len(toc),2):
    left=toc[j];right=toc[j+1] if j+1<len(toc) else ('','')
    rows.append([left[0],left[1],right[0],right[1]])
add_table([['Section','Page','Section','Page'],*rows],[2.55,.45,2.55,.45]);doc.add_page_break()

# Header/footer
for section in doc.sections:
    hp=section.header.paragraphs[0];hp.text='TuringLab  |  CSET302 Milestone 1';hp.alignment=WD_ALIGN_PARAGRAPH.RIGHT
    for r in hp.runs:r.font.size=Pt(8);r.font.color.rgb=RGBColor.from_string('68758A')
    fp=section.footer.paragraphs[0];fp.alignment=WD_ALIGN_PARAGRAPH.CENTER;fp.add_run('Page ');add_field(fp,'PAGE')

md=(DOCS/'M1_Report.md').read_text(encoding='utf-8').splitlines()
ack=next(i for i,x in enumerate(md) if x.strip()=='## 26 Acknowledgement')
ack_end=next(i for i in range(ack+1,len(md)) if md[i].startswith('## '))
ack_lines=md[ack:ack_end]
doc.add_heading('Acknowledgement',level=1)
ai=1
while ai<len(ack_lines):
    line=ack_lines[ai]
    if not line.strip(): ai+=1;continue
    if line.startswith('|'):
        rows=[]
        while ai<len(ack_lines) and ack_lines[ai].startswith('|'):
            vals=[x.strip() for x in ack_lines[ai].strip('|').split('|')]
            if not all(re.fullmatch(r':?-+:?',v) for v in vals): rows.append(vals)
            ai+=1
        add_table(rows,[1.55,1.35,3.2])
        continue
    if line.startswith('Project repository:'):
        doc.add_paragraph(line);ai+=1;continue
    doc.add_paragraph(line);ai+=1
doc.add_page_break()
start=next(i for i,x in enumerate(md) if x.strip()=='## Abstract')
lines=md[start:];i=0;in_code=False;code=[]
diag_map={'architecture.mmd':'architecture.png','execution-flowchart.mmd':'flowchart.png','component-class.mmd':'uml.png','sequence.mmd':'sequence.png','use-case.mmd':'usecase.png'}
while i<len(lines):
    line=lines[i].rstrip()
    if line.startswith('```'):
        if not in_code:in_code=True;code=[]
        else:
            p=doc.add_paragraph();p.paragraph_format.left_indent=Mm(7);p.paragraph_format.line_spacing=Pt(7.5);p.paragraph_format.space_after=Pt(3)
            r=p.add_run('\n'.join(code));r.font.name='Courier New';r.font.size=Pt(7);in_code=False
        i+=1;continue
    if in_code:code.append(line);i+=1;continue
    if not line.strip():i+=1;continue
    if line.startswith('### '):doc.add_heading(re.sub(r'^###\s+','',line),level=2);i+=1;continue
    if line.startswith('## '):
        doc.add_heading(re.sub(r'^##\s+','',line),level=1);i+=1;continue
    if line.startswith('|'):
        rows=[]
        while i<len(lines) and lines[i].startswith('|'):
            vals=[x.strip() for x in lines[i].strip('|').split('|')]
            if not all(re.fullmatch(r':?-+:?',v) for v in vals):rows.append(vals)
            i+=1
        if rows:add_table(rows)
        continue
    matched=False
    for token,png in diag_map.items():
        if token in line:
            p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.add_run().add_picture(str(DIAGS/png),width=Inches(6.2));matched=True;break
    if matched:i+=1;continue
    if line.startswith('- '):
        text=line[2:].replace('**','').replace('`','');p=doc.add_paragraph(style='List Bullet');p.add_run(text);i+=1;continue
    if re.match(r'^\d+\. ',line):
        p=doc.add_paragraph();p.paragraph_format.left_indent=Mm(7);p.paragraph_format.first_line_indent=Mm(-7);p.add_run(line.replace('`',''));i+=1;continue
    if line.startswith('!['):
        target=re.search(r'\(([^)]+)\)',line)
        if target:
            path=DOCS/target.group(1)
            if path.exists():
                p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.add_run().add_picture(str(path),width=Inches(6.2))
        i+=1;continue
    if line.startswith('**Figure'):
        p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.keep_with_next=True;r=p.add_run(line.replace('**',''));r.bold=True;i+=1;continue
    # paragraph with simple markdown cleanup
    para=[line];i+=1
    while i<len(lines) and lines[i].strip() and not lines[i].startswith(('#','|','```','![','- ')) and not re.match(r'^\d+\. ',lines[i]):
        para.append(lines[i].strip());i+=1
    text=' '.join(para);text=re.sub(r'\[([^]]+)\]\([^)]+\)',r'\1',text);text=text.replace('**','').replace('`','')
    doc.add_paragraph(text)

core=doc.core_properties;core.title='Design and Development of an Interactive Turing Machine Simulator';core.subject='CSET302 M1 Problem Analysis and Project Design';core.author='[Student name]';core.keywords='Turing machine, automata theory, simulator, CSET302'
doc.save(OUT)
print(OUT)
