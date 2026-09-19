import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type UploadResponse } from './api';

export const generateJSONReport = (metadata: UploadResponse): void => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(metadata, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "security-assessment-report.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

export const generatePDFReport = (metadata: UploadResponse): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let yPos = 20;

  // Title
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text("Security Assessment Report", pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // Disclaimer
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const disclaimerText = "Disclaimer: This report contains sensitive security information. The attack simulation section is purely hypothetical and illustrates potential access paths. Actual attacks were not performed.";
  const splitDisclaimer = doc.splitTextToSize(disclaimerText, pageWidth - 30);
  doc.text(splitDisclaimer, 15, yPos);
  yPos += splitDisclaimer.length * 5 + 10;

  // Report Metadata
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Report Metadata", 15, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [['Field', 'Value']],
    body: [
      ['Target', metadata.metadata?.target || 'N/A'],
      ['Scan Mode', metadata.metadata?.scan_mode || 'N/A'],
      ['Scan Duration', metadata.metadata?.scan_duration || 'N/A'],
      ['Generated At', metadata.metadata?.generated_at || 'N/A'],
      ['Generator', metadata.metadata?.generator || 'N/A'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
  });
  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Scan Information
  doc.setFontSize(14);
  doc.text("Scan Information", 15, yPos);
  yPos += 10;
  
  autoTable(doc, {
    startY: yPos,
    head: [['Feature', 'Status', 'Count/Info']],
    body: [
      ['Port Scan', metadata.availability?.port_scan ? 'Available' : 'N/A', metadata.availability?.port_count?.toString() || '0'],
      ['Web Security', metadata.availability?.web_security ? 'Available' : 'N/A', 'N/A'],
      ['CVE Analysis', metadata.availability?.cve_analysis || 'N/A', 'N/A'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
  });
  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Open Ports & Services
  if (yPos > 250) { doc.addPage(); yPos = 20; }
  doc.setFontSize(14);
  doc.text("Open Ports & Services", 15, yPos);
  yPos += 10;

  if (metadata.port_analysis?.ports && metadata.port_analysis.ports.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Port', 'Service', 'Product', 'Version']],
      body: metadata.port_analysis.ports.map(p => [
        p.port?.toString() || 'N/A',
        p.service || 'N/A',
        p.product || 'N/A',
        p.version || 'N/A'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [39, 174, 96] },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(11);
    doc.text("No data available in the analyzed report.", 15, yPos);
    yPos += 15;
  }

  // Security Threat Analysis
  if (yPos > 250) { doc.addPage(); yPos = 20; }
  doc.setFontSize(14);
  doc.text("Security Threat Analysis", 15, yPos);
  yPos += 10;

  if (metadata.threat_analysis?.threats && metadata.threat_analysis.threats.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Severity', 'Port', 'Title', 'Type']],
      body: metadata.threat_analysis.threats.map(t => [
        t.severity || 'N/A',
        t.port?.toString() || 'N/A',
        t.title || 'N/A',
        t.threat_type || 'N/A'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [231, 76, 60] },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(11);
    doc.text("No data available in the analyzed report.", 15, yPos);
    yPos += 15;
  }

  // Security Risk Assessment
  if (yPos > 250) { doc.addPage(); yPos = 20; }
  doc.setFontSize(14);
  doc.text("Security Risk Assessment", 15, yPos);
  yPos += 10;

  if (metadata.risk_summary) {
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: [
        ['Overall Risk', metadata.risk_summary.overall_risk || 'N/A'],
        ['Risk Score', metadata.risk_summary.risk_score?.toString() || 'N/A'],
        ['Exposed Ports', metadata.risk_summary.exposed_ports?.toString() || '0'],
        ['Critical Threats', metadata.risk_summary.critical_count?.toString() || '0'],
        ['High Threats', metadata.risk_summary.high_count?.toString() || '0'],
        ['CVE Count', metadata.risk_summary.cve_count?.toString() || '0'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [142, 68, 173] },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(11);
    doc.text("No data available in the analyzed report.", 15, yPos);
    yPos += 15;
  }

  // Attack Analysis
  if (yPos > 250) { doc.addPage(); yPos = 20; }
  doc.setFontSize(14);
  doc.text("Attack Analysis", 15, yPos);
  yPos += 10;

  if (metadata.attack_analysis?.services && metadata.attack_analysis.services.length > 0) {
    const attackRows: any[] = [];
    metadata.attack_analysis.services.forEach(s => {
      if (s.threats && s.threats.length > 0) {
        s.threats.forEach(t => {
          attackRows.push([s.port?.toString(), s.service, t.name, t.severity]);
        });
      }
    });

    if (attackRows.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Port', 'Service', 'Threat', 'Severity']],
        body: attackRows,
        theme: 'striped',
        headStyles: { fillColor: [211, 84, 0] },
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    } else {
      doc.setFontSize(11);
      doc.text("No data available in the analyzed report.", 15, yPos);
      yPos += 15;
    }
  } else {
    doc.setFontSize(11);
    doc.text("No data available in the analyzed report.", 15, yPos);
    yPos += 15;
  }

  // Hypothetical Attack Simulation
  if (yPos > 250) { doc.addPage(); yPos = 20; }
  doc.setFontSize(14);
  doc.text("Hypothetical Attack Simulation", 15, yPos);
  yPos += 10;
  
  if (metadata.attack_analysis?.services) {
    const simText = "The following is a hypothetical attack timeline based on the identified vulnerabilities. It illustrates potential access paths and illustrative impacts.";
    const splitSim = doc.splitTextToSize(simText, pageWidth - 30);
    doc.setFontSize(11);
    doc.text(splitSim, 15, yPos);
    yPos += splitSim.length * 5 + 5;
    
    let hasSimulationData = false;
    metadata.attack_analysis.services.forEach(s => {
      if (s.threats && s.threats.length > 0) {
        hasSimulationData = true;
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.setFontSize(12);
        doc.setTextColor(192, 57, 43);
        doc.text(`Hypothetical Initial Access Path: Port ${s.port} (${s.service})`, 15, yPos);
        yPos += 7;
        
        s.threats.forEach(t => {
          if (yPos > 270) { doc.addPage(); yPos = 20; }
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          const threatDesc = doc.splitTextToSize(`- Potential Access: ${t.name}. ${t.description}`, pageWidth - 35);
          doc.text(threatDesc, 20, yPos);
          yPos += threatDesc.length * 5 + 3;
        });
        yPos += 5;
      }
    });

    if (!hasSimulationData) {
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text("No data available in the analyzed report.", 15, yPos);
      yPos += 15;
    }
  } else {
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("No data available in the analyzed report.", 15, yPos);
    yPos += 15;
  }

  // Recommendations
  if (yPos > 250) { doc.addPage(); yPos = 20; }
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Recommendations", 15, yPos);
  yPos += 10;

  if (metadata.recommendations && metadata.recommendations.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Severity', 'Title', 'Recommendation']],
      body: metadata.recommendations.map(r => [
        r.severity || 'N/A',
        r.title || 'N/A',
        r.recommendation || 'N/A'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [52, 73, 94] },
    });
  } else if (metadata.risk_assessment?.recommendations && metadata.risk_assessment.recommendations.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Severity', 'Recommendation']],
      body: metadata.risk_assessment.recommendations.map(r => [
        r.severity || 'N/A',
        r.text || 'N/A'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [52, 73, 94] },
    });
  } else {
    doc.setFontSize(11);
    doc.text("No data available in the analyzed report.", 15, yPos);
  }

  doc.save("security-assessment-report.pdf");
};
