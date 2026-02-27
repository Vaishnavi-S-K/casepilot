const router = require('express').Router();
const Case = require('../models/Case');
const Client = require('../models/Client');
const Document = require('../models/Document');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

const attorneys = ['Arjun Mehta', 'Elena Vasquez', 'Daniel Okafor', 'Sofia Petrov', 'Kevin Liang'];

function randomEl(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

// GET /api/seed
router.get('/', async (req, res, next) => {
  try {
    // Drop all collections
    await Promise.all([
      Case.deleteMany({}),
      Client.deleteMany({}),
      Document.deleteMany({}),
      Task.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    // ─── CLIENTS (10) ───
    const clientData = [
      { fullName: 'Blackwell Logistics Inc.', email: 'legal@blackwell-logistics.com', mobile: '+1-212-555-0101', organisation: 'Blackwell Logistics Inc.', clientType: 'Corporation', city: 'New York', country: 'United States', tier: 'VIP', standing: 'Active', openCases: 3, closedCases: 5, billedTotal: 1850000, internalNotes: 'Long-standing corporate client. Priority handling required.', onboardedAt: monthsAgo(24) },
      { fullName: 'Margaret O. Sullivan', email: 'margaret.sullivan@proton.me', mobile: '+1-415-555-0202', organisation: '', clientType: 'Individual', city: 'San Francisco', country: 'United States', tier: 'Premium', standing: 'Active', openCases: 1, closedCases: 2, billedTotal: 420000, internalNotes: 'Estate planning and family matters. Referred by Judge Hawkins.', onboardedAt: monthsAgo(18) },
      { fullName: 'TechNova LLC', email: 'counsel@technova.io', mobile: '+1-650-555-0303', organisation: 'TechNova LLC', clientType: 'Corporation', city: 'Palo Alto', country: 'United States', tier: 'VIP', standing: 'Active', openCases: 2, closedCases: 1, billedTotal: 2200000, internalNotes: 'Major IP client. Multiple ongoing patent disputes.', onboardedAt: monthsAgo(12) },
      { fullName: 'Carlos Ramos', email: 'carlos.ramos@email.com', mobile: '+1-305-555-0404', organisation: '', clientType: 'Individual', city: 'Miami', country: 'United States', tier: 'Standard', standing: 'Active', openCases: 1, closedCases: 0, billedTotal: 75000, internalNotes: 'Criminal defense case. Pro-bono consideration pending.', onboardedAt: monthsAgo(6) },
      { fullName: 'Frontier Capital Partners', email: 'legal@frontiercapital.com', mobile: '+1-312-555-0505', organisation: 'Frontier Capital Partners', clientType: 'Corporation', city: 'Chicago', country: 'United States', tier: 'Premium', standing: 'Active', openCases: 2, closedCases: 3, billedTotal: 980000, internalNotes: 'Investment fund. Complex securities matters.', onboardedAt: monthsAgo(20) },
      { fullName: 'Greenleaf Housing Authority', email: 'procurement@greenleafha.gov', mobile: '+1-202-555-0606', organisation: 'Greenleaf Housing Authority', clientType: 'Government', city: 'Washington D.C.', country: 'United States', tier: 'Premium', standing: 'Active', openCases: 2, closedCases: 4, billedTotal: 560000, internalNotes: 'Government contracts. Strict compliance deadlines.', onboardedAt: monthsAgo(30) },
      { fullName: 'Horizon Education Trust', email: 'admin@horizonedu.org', mobile: '+1-617-555-0707', organisation: 'Horizon Education Trust', clientType: 'Non-Profit', city: 'Boston', country: 'United States', tier: 'Standard', standing: 'Active', openCases: 1, closedCases: 1, billedTotal: 120000, internalNotes: 'Non-profit. Reduced rates applied per partner agreement.', onboardedAt: monthsAgo(14) },
      { fullName: 'Julia Hernandez-Park', email: 'julia.hpark@gmail.com', mobile: '+1-713-555-0808', organisation: '', clientType: 'Individual', city: 'Houston', country: 'United States', tier: 'Standard', standing: 'Active', openCases: 1, closedCases: 0, billedTotal: 35000, internalNotes: 'Immigration case. H-1B visa complications.', onboardedAt: monthsAgo(4) },
      { fullName: 'Pinnacle Real Estate Group', email: 'legal@pinnaclereg.com', mobile: '+1-310-555-0909', organisation: 'Pinnacle Real Estate Group', clientType: 'Corporation', city: 'Los Angeles', country: 'United States', tier: 'Premium', standing: 'Active', openCases: 2, closedCases: 2, billedTotal: 1450000, internalNotes: 'Commercial real estate portfolio. Ongoing zoning disputes.', onboardedAt: monthsAgo(22) },
      { fullName: 'David & Rachel Goodwin', email: 'goodwins@familymail.com', mobile: '+1-404-555-1010', organisation: '', clientType: 'Individual', city: 'Atlanta', country: 'United States', tier: 'Standard', standing: 'Inactive', openCases: 0, closedCases: 2, billedTotal: 95000, internalNotes: 'Family matter concluded. May re-engage for estate planning.', onboardedAt: monthsAgo(16) },
    ];
    const clients = await Client.insertMany(clientData);

    // ─── CASES (20) ───
    const categories = ['Criminal', 'Civil', 'Family', 'Corporate', 'Immigration', 'Intellectual Property', 'Real Estate', 'Labor'];
    const statuses = ['Active', 'Pending', 'On Hold', 'Closed', 'Appeal'];
    const urgencies = ['Critical', 'High', 'Standard', 'Low'];

    const caseData = [
      { ref: 'CP-2026-0001', title: 'Hendricks Corp v. Blackwell Logistics — Breach of Contract', category: 'Corporate', status: 'Active', urgency: 'High', clientId: clients[0]._id, leadAttorney: 'Arjun Mehta', supportingCounsel: 'Elena Vasquez', court: 'U.S. District Court, Southern District of NY', hearingDate: daysFromNow(12), filedOn: monthsAgo(3), portfolioValue: 750000, overview: 'Breach of contract claim involving shipping logistics agreement. Defendant alleges force majeure clause applicability due to port disruptions.', labels: ['high-profile', 'breach'] },
      { ref: 'CP-2026-0002', title: 'In re: Estate of Margaret O. Sullivan', category: 'Family', status: 'Pending', urgency: 'Standard', clientId: clients[1]._id, leadAttorney: 'Sofia Petrov', supportingCounsel: '', court: 'San Francisco Probate Court', hearingDate: daysFromNow(25), filedOn: monthsAgo(2), portfolioValue: 1200000, overview: 'Probate proceedings for estate distribution. Three beneficiaries contesting the amended will from 2024.', labels: ['estate', 'probate'] },
      { ref: 'CP-2026-0003', title: 'TechNova LLC Patent Dispute — Claim 14 Infringement', category: 'Intellectual Property', status: 'Active', urgency: 'Critical', clientId: clients[2]._id, leadAttorney: 'Elena Vasquez', supportingCounsel: 'Kevin Liang', court: 'U.S. Patent Trial and Appeal Board', hearingDate: daysFromNow(5), filedOn: monthsAgo(5), portfolioValue: 4500000, overview: 'Patent infringement claim against ClearView Systems for unauthorized use of machine learning optimization algorithms covered under Patent US-10,234,567.', labels: ['patent', 'ip', 'high-profile'] },
      { ref: 'CP-2026-0004', title: 'State v. Ramos — Second Degree Felony', category: 'Criminal', status: 'Active', urgency: 'Critical', clientId: clients[3]._id, leadAttorney: 'Daniel Okafor', supportingCounsel: 'Arjun Mehta', court: 'Miami-Dade Circuit Court, Criminal Division', hearingDate: daysFromNow(3), filedOn: monthsAgo(4), portfolioValue: 75000, overview: 'Client charged with second-degree felony. Defense strategy centers on challenging evidence chain of custody and witness credibility.', labels: ['criminal', 'pro-bono'] },
      { ref: 'CP-2026-0005', title: 'Frontier Capital v. SEC — Securities Compliance Review', category: 'Corporate', status: 'On Hold', urgency: 'High', clientId: clients[4]._id, leadAttorney: 'Arjun Mehta', supportingCounsel: 'Sofia Petrov', court: 'U.S. Securities and Exchange Commission', hearingDate: daysFromNow(45), filedOn: monthsAgo(6), portfolioValue: 3200000, overview: 'SEC investigation into potential insider trading activities. Currently cooperating under voluntary disclosure program.', labels: ['sec', 'securities', 'compliance'] },
      { ref: 'CP-2026-0006', title: 'Greenleaf HA v. Morrison Developers — Zoning Violation', category: 'Real Estate', status: 'Active', urgency: 'Standard', clientId: clients[5]._id, leadAttorney: 'Kevin Liang', supportingCounsel: 'Elena Vasquez', court: 'D.C. Superior Court, Civil Division', hearingDate: daysFromNow(18), filedOn: monthsAgo(2), portfolioValue: 890000, overview: 'Government housing authority challenging private developer zoning permit. Dispute over mixed-use development impact on affordable housing reserves.', labels: ['zoning', 'government'] },
      { ref: 'CP-2026-0007', title: 'Hernandez-Park Immigration Appeal — H-1B Denial', category: 'Immigration', status: 'Appeal', urgency: 'High', clientId: clients[7]._id, leadAttorney: 'Sofia Petrov', supportingCounsel: 'Daniel Okafor', court: 'Board of Immigration Appeals', hearingDate: daysFromNow(30), filedOn: monthsAgo(3), portfolioValue: 35000, overview: 'Appeal of H-1B visa denial. USCIS cited insufficient specialty occupation evidence. Preparing administrative appeal with enhanced documentation.', labels: ['immigration', 'visa', 'appeal'] },
      { ref: 'CP-2026-0008', title: 'Pinnacle REG v. City of Los Angeles — Eminent Domain', category: 'Real Estate', status: 'Active', urgency: 'High', clientId: clients[8]._id, leadAttorney: 'Elena Vasquez', supportingCounsel: 'Kevin Liang', court: 'California Superior Court, Los Angeles', hearingDate: daysFromNow(8), filedOn: monthsAgo(4), portfolioValue: 5600000, overview: 'Challenging municipal eminent domain action affecting commercial property portfolio on Wilshire Blvd. Just compensation dispute.', labels: ['eminent-domain', 'real-estate'] },
      { ref: 'CP-2026-0009', title: 'Horizon Trust v. Board of Education — Employment Discrimination', category: 'Labor', status: 'Pending', urgency: 'Standard', clientId: clients[6]._id, leadAttorney: 'Daniel Okafor', supportingCounsel: '', court: 'Massachusetts Commission Against Discrimination', hearingDate: daysFromNow(35), filedOn: monthsAgo(1), portfolioValue: 280000, overview: 'Non-profit education trust filing claim of employment discrimination against board of education regarding faculty termination practices.', labels: ['labor', 'discrimination'] },
      { ref: 'CP-2026-0010', title: 'Blackwell Logistics — International Trade Compliance', category: 'Corporate', status: 'Active', urgency: 'Standard', clientId: clients[0]._id, leadAttorney: 'Arjun Mehta', supportingCounsel: 'Kevin Liang', court: 'International Trade Commission', hearingDate: daysFromNow(22), filedOn: monthsAgo(1), portfolioValue: 1100000, overview: 'Review of international trade compliance protocols following new tariff regulations. Voluntary self-disclosure to ITC.', labels: ['trade', 'compliance'] },
      { ref: 'CP-2026-0011', title: 'Goodwin Family Trust — Custody Modification', category: 'Family', status: 'Closed', urgency: 'Low', clientId: clients[9]._id, leadAttorney: 'Sofia Petrov', supportingCounsel: '', court: 'Fulton County Family Court', hearingDate: monthsAgo(1), filedOn: monthsAgo(8), portfolioValue: 45000, overview: 'Modification of custody arrangement pursuant to relocation. Settled by mediation agreement.', labels: ['family', 'custody', 'settled'] },
      { ref: 'CP-2026-0012', title: 'TechNova v. DataSync Corp — Trade Secret Misappropriation', category: 'Intellectual Property', status: 'Active', urgency: 'High', clientId: clients[2]._id, leadAttorney: 'Elena Vasquez', supportingCounsel: 'Arjun Mehta', court: 'Northern District of California', hearingDate: daysFromNow(15), filedOn: monthsAgo(2), portfolioValue: 3800000, overview: 'Trade secret misappropriation claim. Former employee allegedly transferred proprietary source code to competitor before departure.', labels: ['trade-secret', 'ip'] },
      { ref: 'CP-2026-0013', title: 'State v. Henderson — DUI Third Offense', category: 'Criminal', status: 'Pending', urgency: 'High', clientId: clients[3]._id, leadAttorney: 'Daniel Okafor', supportingCounsel: '', court: 'Miami-Dade County Court', hearingDate: daysFromNow(10), filedOn: monthsAgo(1), portfolioValue: 25000, overview: 'Third DUI offense with aggravating circumstances. Negotiating plea agreement for reduced sentencing.', labels: ['criminal', 'dui'] },
      { ref: 'CP-2026-0014', title: 'Frontier Capital — Limited Partnership Dissolution', category: 'Corporate', status: 'Closed', urgency: 'Low', clientId: clients[4]._id, leadAttorney: 'Kevin Liang', supportingCounsel: 'Arjun Mehta', court: 'Cook County Circuit Court', hearingDate: monthsAgo(2), filedOn: monthsAgo(10), portfolioValue: 620000, overview: 'Dissolution of limited partnership fund. All distributions completed. Final accounting filed.', labels: ['dissolution', 'partnership'] },
      { ref: 'CP-2026-0015', title: 'Greenleaf HA — Fair Housing Compliance Audit', category: 'Civil', status: 'Active', urgency: 'Standard', clientId: clients[5]._id, leadAttorney: 'Daniel Okafor', supportingCounsel: 'Sofia Petrov', court: 'U.S. Department of Housing and Urban Development', hearingDate: daysFromNow(40), filedOn: monthsAgo(1), portfolioValue: 340000, overview: 'Assisting government housing authority with Fair Housing Act compliance audit. Reviewing policies and tenant selection criteria.', labels: ['compliance', 'fair-housing'] },
      { ref: 'CP-2026-0016', title: 'Pinnacle REG — Commercial Lease Dispute Portfolio', category: 'Civil', status: 'On Hold', urgency: 'Standard', clientId: clients[8]._id, leadAttorney: 'Kevin Liang', supportingCounsel: '', court: 'California Superior Court', hearingDate: daysFromNow(60), filedOn: monthsAgo(3), portfolioValue: 1750000, overview: 'Multiple commercial lease disputes across three retail properties. Tenant defaults totaling $1.75M. Consolidation motion pending.', labels: ['lease', 'commercial'] },
      { ref: 'CP-2026-0017', title: 'Martinez v. Global Freight Systems — Wrongful Termination', category: 'Labor', status: 'Active', urgency: 'High', clientId: clients[0]._id, leadAttorney: 'Sofia Petrov', supportingCounsel: 'Daniel Okafor', court: 'New York Supreme Court, Labor Division', hearingDate: daysFromNow(7), filedOn: monthsAgo(2), portfolioValue: 450000, overview: 'Wrongful termination claim filed by former operations manager. Alleges retaliation for whistleblowing on safety violations.', labels: ['labor', 'wrongful-termination'] },
      { ref: 'CP-2026-0018', title: 'In re: Sullivan Family Trust Amendment', category: 'Family', status: 'Closed', urgency: 'Low', clientId: clients[1]._id, leadAttorney: 'Sofia Petrov', supportingCounsel: '', court: 'San Francisco Probate Court', hearingDate: monthsAgo(3), filedOn: monthsAgo(7), portfolioValue: 800000, overview: 'Amendment to irrevocable family trust. Updated beneficiary designations and trustee succession plan. Filed and accepted.', labels: ['trust', 'family'] },
      { ref: 'CP-2026-0019', title: 'Chen Immigration Services — E-2 Investor Visa Application', category: 'Immigration', status: 'Pending', urgency: 'Standard', clientId: clients[7]._id, leadAttorney: 'Kevin Liang', supportingCounsel: 'Sofia Petrov', court: 'USCIS Service Center', hearingDate: daysFromNow(50), filedOn: monthsAgo(1), portfolioValue: 55000, overview: 'E-2 treaty investor visa application for restaurant franchise investment. Preparing business plan and financial documentation.', labels: ['immigration', 'investor-visa'] },
      { ref: 'CP-2026-0020', title: 'State v. Thompson — White Collar Fraud Investigation', category: 'Criminal', status: 'Appeal', urgency: 'Critical', clientId: clients[4]._id, leadAttorney: 'Arjun Mehta', supportingCounsel: 'Elena Vasquez', court: 'U.S. District Court, Northern District of Illinois', hearingDate: daysFromNow(20), filedOn: monthsAgo(5), portfolioValue: 2100000, overview: 'Appeal of wire fraud conviction. Grounds include improper jury instructions and newly discovered exculpatory evidence.', labels: ['criminal', 'fraud', 'appeal'] },
    ];
    const cases = await Case.insertMany(caseData);

    // ─── DOCUMENTS (20) ───
    const docTypes = ['Contract', 'Affidavit', 'Motion', 'Legal Brief', 'Evidence', 'Subpoena', 'Court Order', 'Settlement', 'NDA'];
    const reviewStatuses = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Filed', 'Rejected'];

    const documentData = [
      { name: 'Master Services Agreement — Blackwell-Hendricks', caseId: cases[0]._id, docType: 'Contract', reviewStatus: 'Filed', preparedBy: 'Elena Vasquez', revision: 3, remarks: 'Final version with executed signatures from both parties.', dueBy: monthsAgo(1), labels: ['executed', 'contract'] },
      { name: 'Sullivan Estate — Last Will and Testament (Amended)', caseId: cases[1]._id, docType: 'Legal Brief', reviewStatus: 'Under Review', preparedBy: 'Sofia Petrov', revision: 2, remarks: 'Amended will from 2024 under review by all beneficiaries.', dueBy: daysFromNow(10), labels: ['will', 'estate'] },
      { name: 'Patent Infringement Analysis Report — Claim 14', caseId: cases[2]._id, docType: 'Evidence', reviewStatus: 'Approved', preparedBy: 'Kevin Liang', revision: 1, remarks: 'Technical analysis confirming claim overlap with defendant product.', dueBy: daysFromNow(3), labels: ['technical', 'patent'] },
      { name: 'Motion to Suppress Evidence — State v. Ramos', caseId: cases[3]._id, docType: 'Motion', reviewStatus: 'Submitted', preparedBy: 'Daniel Okafor', revision: 1, remarks: 'Motion challenging chain of custody for physical evidence items 12-18.', dueBy: daysFromNow(2), labels: ['motion', 'criminal'] },
      { name: 'SEC Voluntary Disclosure Letter — Frontier Capital', caseId: cases[4]._id, docType: 'Legal Brief', reviewStatus: 'Filed', preparedBy: 'Arjun Mehta', revision: 4, remarks: 'Voluntary self-disclosure under SEC cooperation credit program.', dueBy: monthsAgo(2), labels: ['sec', 'disclosure'] },
      { name: 'Zoning Impact Assessment — Morrison Development', caseId: cases[5]._id, docType: 'Evidence', reviewStatus: 'Under Review', preparedBy: 'Kevin Liang', revision: 1, remarks: 'Independent zoning impact analysis commissioned by Greenleaf HA.', dueBy: daysFromNow(14), labels: ['zoning', 'assessment'] },
      { name: 'H-1B Specialty Occupation Evidence Bundle', caseId: cases[6]._id, docType: 'Affidavit', reviewStatus: 'Draft', preparedBy: 'Sofia Petrov', revision: 1, remarks: 'Compilation of supporting evidence for specialty occupation criteria.', dueBy: daysFromNow(20), labels: ['immigration', 'h1b'] },
      { name: 'Appraisal Report — Wilshire Commercial Properties', caseId: cases[7]._id, docType: 'Evidence', reviewStatus: 'Approved', preparedBy: 'Elena Vasquez', revision: 2, remarks: 'Independent fair market value appraisal for eminent domain compensation.', dueBy: daysFromNow(5), labels: ['appraisal', 'real-estate'] },
      { name: 'Employment Discrimination Complaint — Horizon Trust', caseId: cases[8]._id, docType: 'Legal Brief', reviewStatus: 'Submitted', preparedBy: 'Daniel Okafor', revision: 1, remarks: 'Formal complaint filing with Massachusetts Commission Against Discrimination.', dueBy: daysFromNow(30), labels: ['discrimination', 'complaint'] },
      { name: 'International Trade Compliance Manual (v2)', caseId: cases[9]._id, docType: 'Contract', reviewStatus: 'Draft', preparedBy: 'Kevin Liang', revision: 2, remarks: 'Updated compliance manual incorporating new tariff regulations.', dueBy: daysFromNow(15), labels: ['compliance', 'manual'] },
      { name: 'Non-Disclosure Agreement — TechNova-DataSync', caseId: cases[11]._id, docType: 'NDA', reviewStatus: 'Filed', preparedBy: 'Elena Vasquez', revision: 1, remarks: 'Mutual NDA executed prior to discovery phase.', dueBy: monthsAgo(1), labels: ['nda', 'executed'] },
      { name: 'Subpoena Duces Tecum — Henderson DUI Records', caseId: cases[12]._id, docType: 'Subpoena', reviewStatus: 'Filed', preparedBy: 'Daniel Okafor', revision: 1, remarks: 'Subpoena for breathalyzer calibration records from Miami-Dade Police.', dueBy: daysFromNow(7), labels: ['subpoena', 'dui'] },
      { name: 'Partnership Dissolution Agreement — Frontier LP', caseId: cases[13]._id, docType: 'Settlement', reviewStatus: 'Filed', preparedBy: 'Kevin Liang', revision: 3, remarks: 'Final dissolution agreement with distribution schedule.', dueBy: monthsAgo(1), labels: ['settlement', 'dissolution'] },
      { name: 'Fair Housing Policy Review Memorandum', caseId: cases[14]._id, docType: 'Legal Brief', reviewStatus: 'Under Review', preparedBy: 'Sofia Petrov', revision: 1, remarks: 'Internal review of tenant selection and reasonable accommodation policies.', dueBy: daysFromNow(25), labels: ['fair-housing', 'memo'] },
      { name: 'Commercial Lease Default Notices (Consolidated)', caseId: cases[15]._id, docType: 'Court Order', reviewStatus: 'Rejected', preparedBy: 'Kevin Liang', revision: 2, remarks: 'Consolidated default notices rejected — individual notices required per lease.', dueBy: monthsAgo(1), labels: ['default', 'lease'] },
      { name: 'Whistleblower Protection Affidavit — Martinez', caseId: cases[16]._id, docType: 'Affidavit', reviewStatus: 'Submitted', preparedBy: 'Sofia Petrov', revision: 1, remarks: 'Sworn statement detailing safety violation reports and subsequent retaliation.', dueBy: daysFromNow(4), labels: ['whistleblower', 'affidavit'] },
      { name: 'Sullivan Family Trust — Beneficiary Designations', caseId: cases[17]._id, docType: 'Contract', reviewStatus: 'Filed', preparedBy: 'Sofia Petrov', revision: 2, remarks: 'Updated beneficiary designations per trust amendment.', dueBy: monthsAgo(2), labels: ['trust', 'beneficiary'] },
      { name: 'E-2 Visa Business Plan — Chen Restaurant Franchise', caseId: cases[18]._id, docType: 'Evidence', reviewStatus: 'Draft', preparedBy: 'Kevin Liang', revision: 1, remarks: 'Comprehensive business plan for franchise investment demonstrating treaty investor requirements.', dueBy: daysFromNow(35), labels: ['business-plan', 'visa'] },
      { name: 'Appellate Brief — State v. Thompson', caseId: cases[19]._id, docType: 'Legal Brief', reviewStatus: 'Under Review', preparedBy: 'Arjun Mehta', revision: 2, remarks: 'Appeal brief citing improper jury instructions under Federal Rule 30.', dueBy: daysFromNow(12), labels: ['appellate', 'brief'] },
      { name: 'Motion for New Trial — Thompson Fraud Case', caseId: cases[19]._id, docType: 'Motion', reviewStatus: 'Draft', preparedBy: 'Elena Vasquez', revision: 1, remarks: 'Motion based on newly discovered Brady material evidence.', dueBy: daysFromNow(18), labels: ['motion', 'new-trial'] },
    ];
    const documents = await Document.insertMany(documentData);

    // ─── TASKS (20) ───
    const stages = ['Backlog', 'Todo', 'In Progress', 'Review', 'Done', 'Dropped'];

    const taskData = [
      { title: 'Draft motion to compel discovery responses', caseId: cases[0]._id, owner: 'Elena Vasquez', createdBy: 'Arjun Mehta', urgency: 'High', stage: 'In Progress', deadline: daysFromNow(3), plannedHours: 8, loggedHours: 5, progress: 62, checklist: [{ item: 'Research applicable case law', done: true }, { item: 'Draft motion body', done: true }, { item: 'Prepare exhibits', done: false }, { item: 'Final review and filing', done: false }] },
      { title: 'Prepare beneficiary communication letters', caseId: cases[1]._id, owner: 'Sofia Petrov', createdBy: 'Sofia Petrov', urgency: 'Standard', stage: 'Todo', deadline: daysFromNow(10), plannedHours: 4, loggedHours: 0, progress: 0, checklist: [{ item: 'Draft letter template', done: false }, { item: 'Customize for each beneficiary', done: false }, { item: 'Send via certified mail', done: false }] },
      { title: 'Conduct prior art search for Patent US-10,234,567', caseId: cases[2]._id, owner: 'Kevin Liang', createdBy: 'Elena Vasquez', urgency: 'Critical', stage: 'Review', deadline: daysFromNow(2), plannedHours: 12, loggedHours: 11, progress: 90, checklist: [{ item: 'Search USPTO database', done: true }, { item: 'Review international patents', done: true }, { item: 'Compile analysis report', done: true }, { item: 'Partner review', done: false }] },
      { title: 'Interview character witnesses for Ramos defense', caseId: cases[3]._id, owner: 'Daniel Okafor', createdBy: 'Daniel Okafor', urgency: 'Critical', stage: 'In Progress', deadline: daysFromNow(1), plannedHours: 6, loggedHours: 4, progress: 50, checklist: [{ item: 'Contact witness list', done: true }, { item: 'Schedule interviews', done: true }, { item: 'Conduct interviews', done: false }, { item: 'Document statements', done: false }] },
      { title: 'Review SEC correspondence and prepare response timeline', caseId: cases[4]._id, owner: 'Arjun Mehta', createdBy: 'Arjun Mehta', urgency: 'High', stage: 'Done', deadline: monthsAgo(1), resolvedAt: daysFromNow(-5), plannedHours: 10, loggedHours: 12, progress: 100, checklist: [{ item: 'Catalog all SEC requests', done: true }, { item: 'Map response deadlines', done: true }, { item: 'Assign team responsibilities', done: true }] },
      { title: 'Gather zoning ordinance documentation', caseId: cases[5]._id, owner: 'Kevin Liang', createdBy: 'Kevin Liang', urgency: 'Standard', stage: 'In Progress', deadline: daysFromNow(8), plannedHours: 5, loggedHours: 2, progress: 35, checklist: [] },
      { title: 'Compile H-1B specialty occupation evidence', caseId: cases[6]._id, owner: 'Sofia Petrov', createdBy: 'Sofia Petrov', urgency: 'High', stage: 'Todo', deadline: daysFromNow(15), plannedHours: 8, loggedHours: 0, progress: 0, checklist: [{ item: 'Gather degree evaluations', done: false }, { item: 'Obtain expert opinion letters', done: false }, { item: 'Compile industry wage data', done: false }] },
      { title: 'Commission independent property appraisal', caseId: cases[7]._id, owner: 'Elena Vasquez', createdBy: 'Elena Vasquez', urgency: 'High', stage: 'Done', deadline: monthsAgo(1), resolvedAt: daysFromNow(-10), plannedHours: 3, loggedHours: 4, progress: 100, checklist: [] },
      { title: 'Prepare MCAD complaint filing package', caseId: cases[8]._id, owner: 'Daniel Okafor', createdBy: 'Daniel Okafor', urgency: 'Standard', stage: 'Review', deadline: daysFromNow(20), plannedHours: 6, loggedHours: 5, progress: 80, checklist: [{ item: 'Draft complaint', done: true }, { item: 'Compile supporting evidence', done: true }, { item: 'Client review and sign-off', done: false }] },
      { title: 'Update tariff classification database', caseId: cases[9]._id, owner: 'Kevin Liang', createdBy: 'Arjun Mehta', urgency: 'Low', stage: 'Backlog', deadline: daysFromNow(30), plannedHours: 4, loggedHours: 0, progress: 0, checklist: [] },
      { title: 'Deposition preparation — DataSync CTO testimony', caseId: cases[11]._id, owner: 'Elena Vasquez', createdBy: 'Elena Vasquez', urgency: 'Critical', stage: 'In Progress', deadline: daysFromNow(6), plannedHours: 15, loggedHours: 8, progress: 55, checklist: [{ item: 'Review deponent background', done: true }, { item: 'Prepare question outline', done: true }, { item: 'Mock deposition session', done: false }, { item: 'Finalize exhibit list', done: false }] },
      { title: 'Obtain breathalyzer calibration records', caseId: cases[12]._id, owner: 'Daniel Okafor', createdBy: 'Daniel Okafor', urgency: 'High', stage: 'Todo', deadline: daysFromNow(5), plannedHours: 3, loggedHours: 0, progress: 0, checklist: [] },
      { title: 'File final distribution report — Frontier LP', caseId: cases[13]._id, owner: 'Kevin Liang', createdBy: 'Kevin Liang', urgency: 'Low', stage: 'Done', deadline: monthsAgo(1), resolvedAt: monthsAgo(1), plannedHours: 4, loggedHours: 3, progress: 100, checklist: [] },
      { title: 'Draft tenant selection criteria revision', caseId: cases[14]._id, owner: 'Sofia Petrov', createdBy: 'Daniel Okafor', urgency: 'Standard', stage: 'In Progress', deadline: daysFromNow(18), plannedHours: 6, loggedHours: 2, progress: 30, checklist: [{ item: 'Review current criteria', done: true }, { item: 'Compare with FHA requirements', done: false }, { item: 'Draft revised criteria', done: false }] },
      { title: 'Serve individual lease default notices', caseId: cases[15]._id, owner: 'Kevin Liang', createdBy: 'Kevin Liang', urgency: 'Standard', stage: 'Backlog', deadline: daysFromNow(25), plannedHours: 3, loggedHours: 0, progress: 0, checklist: [] },
      { title: 'Compile safety violation evidence — Martinez case', caseId: cases[16]._id, owner: 'Sofia Petrov', createdBy: 'Sofia Petrov', urgency: 'High', stage: 'In Progress', deadline: daysFromNow(4), plannedHours: 7, loggedHours: 3, progress: 40, checklist: [{ item: 'Gather OSHA reports', done: true }, { item: 'Obtain internal memos', done: false }, { item: 'Interview co-workers', done: false }] },
      { title: 'Process trust amendment filing confirmation', caseId: cases[17]._id, owner: 'Sofia Petrov', createdBy: 'Sofia Petrov', urgency: 'Low', stage: 'Done', deadline: monthsAgo(2), resolvedAt: monthsAgo(2), plannedHours: 2, loggedHours: 1, progress: 100, checklist: [] },
      { title: 'Prepare franchise financial projections', caseId: cases[18]._id, owner: 'Kevin Liang', createdBy: 'Kevin Liang', urgency: 'Standard', stage: 'Todo', deadline: daysFromNow(28), plannedHours: 8, loggedHours: 0, progress: 0, checklist: [] },
      { title: 'Research Brady material precedents for Thompson appeal', caseId: cases[19]._id, owner: 'Arjun Mehta', createdBy: 'Arjun Mehta', urgency: 'Critical', stage: 'In Progress', deadline: daysFromNow(9), plannedHours: 10, loggedHours: 6, progress: 60, checklist: [{ item: 'Review Brady v. Maryland ruling', done: true }, { item: 'Identify analogous circuit decisions', done: true }, { item: 'Draft precedent analysis section', done: false }] },
      { title: 'File appellate brief — Thompson case', caseId: cases[19]._id, owner: 'Elena Vasquez', createdBy: 'Arjun Mehta', urgency: 'Critical', stage: 'Backlog', deadline: daysFromNow(-3), plannedHours: 12, loggedHours: 0, progress: 0, details: 'OVERDUE — Brief filing deadline was three days ago. Emergency extension request required.', checklist: [] },
    ];
    await Task.insertMany(taskData);

    // ─── NOTIFICATIONS (seed a few) ───
    const notifData = [
      { level: 'success', heading: 'Case created', body: 'Case "Hendricks Corp v. Blackwell Logistics — Breach of Contract" was created by Arjun Mehta.', entity: 'Case', action: 'created', entityId: cases[0]._id, triggeredBy: 'Arjun Mehta' },
      { level: 'alert', heading: 'Task overdue', body: 'Task "File appellate brief — Thompson case" is overdue by 3 days.', entity: 'Task', action: 'updated', triggeredBy: 'System' },
      { level: 'info', heading: 'Document updated', body: 'Document "Patent Infringement Analysis Report" was approved by Elena Vasquez.', entity: 'Document', action: 'updated', triggeredBy: 'Elena Vasquez' },
      { level: 'warning', heading: 'Hearing approaching', body: 'Hearing for "State v. Ramos" is in 3 days. Preparation status: 50%.', entity: 'Case', action: 'updated', entityId: cases[3]._id, triggeredBy: 'System' },
      { level: 'success', heading: 'Client onboarded', body: 'Client "TechNova LLC" was successfully onboarded to the platform.', entity: 'Client', action: 'created', entityId: clients[2]._id, triggeredBy: 'Sofia Petrov' },
    ];
    await Notification.insertMany(notifData);

    const counts = {
      clients: clients.length,
      cases: cases.length,
      documents: documents.length,
      tasks: taskData.length,
      notifications: notifData.length,
    };

    res.json({ success: true, message: 'Database seeded successfully', counts });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
