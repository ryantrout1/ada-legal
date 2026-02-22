import React from 'react';
import ChapterPageLayout from '../components/guide/ChapterPageLayout';

const sections = [
  {
    number: '§101', title: 'Purpose',
    plain: <p>This section establishes the purpose of the 2010 Standards: to ensure that buildings and facilities are <strong>accessible to and usable by</strong> people with disabilities. These standards apply to new construction, alterations, and additions to existing buildings covered by the ADA or the Architectural Barriers Act.</p>,
    legal: <p>§101.1 "These Standards provide scoping and technical requirements for accessibility to sites, facilities, buildings, and elements by individuals with disabilities. The requirements are to be applied during the design, construction, and alteration of sites, facilities, buildings, and elements."</p>
  },
  {
    number: '§102', title: 'Dimensions for Adults & Children',
    plain: <><p>The Standards are primarily based on <strong>adult dimensions</strong>. When a building or space is designed specifically for children ages 12 and under — like an elementary school — <strong>child-sized measurements</strong> may be used instead.</p><p><strong>Example:</strong> A drinking fountain in an elementary school can be mounted lower than one in an office building.</p></>,
    legal: <p>§102 "The technical requirements are based on adult dimensions and anthropometrics. In addition, this document includes technical requirements based on children's dimensions and anthropometrics for drinking fountains, water closets, toilet compartments, lavatories and sinks, and grab bars."</p>
  },
  {
    number: '§103', title: 'Equivalent Facilitation',
    plain: <p>If someone comes up with a <strong>different design solution</strong> that provides equal or greater accessibility than what the Standards require, it can be used instead. This gives designers flexibility to innovate while still meeting the goal of accessibility.</p>,
    legal: <p>§103 "Nothing in these requirements prevents the use of designs, products, or technologies as alternatives to those prescribed, provided they result in substantially equivalent or greater accessibility and usability."</p>
  },
  {
    number: '§104', title: 'Conventions',
    plain: <><p>This section explains how to read measurements and tolerances throughout the Standards:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Dimensions:</strong> Given in both inches and millimeters</li><li style={{marginBottom:'6px'}}><strong>Figures:</strong> Illustrations are provided for reference but the text governs if there's a conflict</li><li style={{marginBottom:'6px'}}><strong>"Shall" vs. "should":</strong> "Shall" means required; advisory notes are recommendations</li></ul></>,
    legal: <p>§104.1 "Dimensions that are not stated as 'maximum' or 'minimum' are absolute." §104.1.1 "All dimensions are subject to conventional industry tolerances except where the requirement is stated as a range with specific minimum and maximum end points."</p>
  },
  {
    number: '§105', title: 'Referenced Standards',
    plain: <p>The ADA Standards incorporate other published standards by reference — such as ANSI/BHMA standards for door hardware and ASTM standards for surfaces. These external standards are treated as <strong>part of the requirements</strong> when referenced.</p>,
    legal: <p>§105.2 "The specific edition of the referenced standards… are the editions that are referenced in this document." Referenced standards include ANSI/BHMA (door hardware), ASTM (surface standards), and NFPA (fire alarm systems).</p>
  },
  {
    number: '§106', title: 'Definitions',
    plain: <><p>Key terms used throughout the Standards:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Accessible:</strong> A site, building, or element that complies with the Standards</li><li style={{marginBottom:'6px'}}><strong>Alteration:</strong> A change that affects usability of a building or facility</li><li style={{marginBottom:'6px'}}><strong>Cross slope:</strong> The slope perpendicular to the direction of travel</li><li style={{marginBottom:'6px'}}><strong>Element:</strong> An architectural or mechanical component of a building</li><li style={{marginBottom:'6px'}}><strong>Facility:</strong> All or any portion of buildings, structures, or site improvements</li></ul></>,
    legal: <p>§106.5 "Definitions. For the purpose of these Standards, the following terms shall have the indicated meaning." Includes 30+ defined terms covering construction, design, and accessibility concepts used throughout all chapters.</p>
  }
];

export default function StandardsCh1() {
  return (
    <ChapterPageLayout
      chapterNum={1}
      title="Application & Administration"
      range="§101–106"
      overview={<p>Chapter 1 sets the foundation for the entire 2010 ADA Standards for Accessible Design. It establishes the <strong>purpose, scope, and definitions</strong> that apply to every other chapter. Think of it as the "instructions" for reading the rest of the Standards — it defines what terms mean, how measurements work, and when alternative approaches are allowed.</p>}
      sections={sections}
    />
  );
}