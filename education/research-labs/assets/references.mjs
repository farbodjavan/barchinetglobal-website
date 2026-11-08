/**
 * Verified primary-source reading catalogue for Barchinet Research Labs.
 * Publication records/abstracts and official method pages were checked.
 * Bibliographic references inform the teaching questions and method boundaries.
 * They are NOT the source of the synthetic app coefficients or evidence that
 * any Barchinet model has been independently validated.
 */

const iso14040 = {
  type: 'International standard',
  title: 'ISO 14040:2006 — Environmental management — Life cycle assessment — Principles and framework',
  authors: ['International Organization for Standardization'],
  year: 2006,
  url: 'https://www.iso.org/standard/37456.html',
  publisher: 'International Organization for Standardization',
  usedFor: 'Defining a study goal, functional comparison, system boundary, inventory, impact assessment and interpretation.',
  limitation: 'A methodological framework, not a dataset. The public scope was checked; this demo is not a complete or independently reviewed ISO-compliant LCA.',
};

export const referencesByLab = {
  circularbuild: [
    {
      type: 'Peer-reviewed research article',
      title: 'Environmental Impact Assessment of Construction Waste Recycling versus Disposal Scenarios Using an LCA-BIM Tool during the Design Stage',
      authors: ['Carmen Llatas', 'Rocío Quiñones', 'Nuria Bizcocho'],
      year: 2022,
      doi: '10.3390/recycling7060082',
      url: 'https://www.mdpi.com/2313-4321/7/6/82',
      publisher: 'Recycling, 7(6), 82 · MDPI',
      usedFor: 'Connecting construction material quantities with alternative recycling/disposal scenarios and making environmental comparisons accessible through a digital tool.',
      limitation: 'The paper studies its own BIM-based case and inventory. This app does not reproduce the authors’ software, case results or numerical factors.',
    },
    {
      type: 'Official technical report',
      title: 'Documentation for Greenhouse Gas Emission and Energy Factors Used in the Waste Reduction Model (WARM): Management Practices Chapters, Version 16',
      authors: ['U.S. Environmental Protection Agency, Office of Resource Conservation and Recovery'],
      year: 2023,
      url: 'https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P101982A.txt',
      publisher: 'U.S. Environmental Protection Agency · EPA-530-R-23-018',
      usedFor: 'Understanding how baseline and alternative material-management pathways, avoided production and transport belong in a comparative account.',
      limitation: 'WARM factors are context- and material-specific. None of this demo’s prices, yields or emission factors are taken from WARM; the app is not WARM itself.',
    },
    { ...iso14040 },
  ],
  panelbuild: [
    {
      type: 'Peer-reviewed research article',
      title: 'Sustainable Performance of Buildings through Modular Prefabrication in the Construction Phase: A Comparative Study',
      authors: ['Yongsheng Jiang', 'Dong Zhao', 'Dedong Wang', 'Yudong Xing'],
      year: 2019,
      doi: '10.3390/su11205658',
      url: 'https://www.mdpi.com/2071-1050/11/20/5658',
      publisher: 'Sustainability, 11(20), 5658 · MDPI',
      usedFor: 'Comparing prefabricated and conventional construction through economic, environmental and social indicators while considering different stakeholder priorities.',
      limitation: 'A Chinese case-project and stakeholder-survey study. Its findings do not establish universal cost or speed advantages, and its numerical results are not used as app coefficients.',
    },
    {
      type: 'Official research report',
      title: 'Building Materials and the Climate: Constructing a New Future',
      authors: ['United Nations Environment Programme'],
      year: 2023,
      url: 'https://wedocs.unep.org/items/effe9d8d-a949-4397-bed6-7afda856e261',
      publisher: 'United Nations Environment Programme',
      usedFor: 'Placing material production and deployment impacts within a broader decarbonisation discussion, beyond construction speed alone.',
      limitation: 'A sector-level report rather than a local supplier catalogue or validated panel-design specification. The demo’s cost, labour and carbon profiles remain synthetic.',
    },
    { ...iso14040 },
  ],
  vernacular: [
    {
      type: 'Peer-reviewed research article',
      title: 'Cradle to site Life Cycle Assessment (LCA) of natural vs conventional building materials: A case study on cob earthen material',
      authors: ['Lola Ben-Alon', 'Vivian Loftness', 'Kent A. Harries', 'Gwen DiPietro', 'Erica Cochran Hameen'],
      year: 2019,
      doi: '10.1016/j.buildenv.2019.05.028',
      url: 'https://www.sciencedirect.com/science/article/pii/S0360132319303464',
      publisher: 'Building and Environment, 160, 106150 · Elsevier',
      usedFor: 'Comparing earthen and conventional wall assemblies using an explicit functional unit and testing sensitivity to material sourcing and transport.',
      limitation: 'The study covers cradle-to-site wall impacts in its own context. It does not validate this app’s whole-building energy proxy, repair schedules or whole-life financial results.',
    },
    {
      type: 'Official research handbook',
      title: 'Life Cycle Costing Manual for the Federal Energy Management Program',
      authors: ['Joshua D. Kneifel', 'David Webb'],
      year: 2022,
      doi: '10.6028/NIST.HB.135e2022',
      url: 'https://www.nist.gov/publications/life-cycle-costing-manual-federal-energy-management-program',
      publisher: 'National Institute of Standards and Technology · NIST Handbook 135e2022',
      usedFor: 'Separating life-cycle costing from environmental LCA and expressing future operating, repair and end-of-life cash flows in present-value terms.',
      limitation: 'The handbook’s federal economic evaluation context is not a universal financing rule. The app’s 3% rate, energy price and costs are stated teaching assumptions.',
    },
    { ...iso14040 },
  ],
  reliefroute: [
    {
      type: 'Peer-reviewed research article',
      title: 'An integrated location-routing problem with post-disaster relief distribution',
      authors: ['Xiaowen Wei', 'Huaxin Qiu', 'Dujuan Wang', 'Jiahui Duan', 'Yanzhang Wang', 'T. C. E. Cheng'],
      year: 2020,
      doi: '10.1016/j.cie.2020.106632',
      url: 'https://research.polyu.edu.hk/en/publications/an-integrated-location-routing-problem-with-post-disaster-relief-/',
      publisher: 'Computers & Industrial Engineering, 147, 106632 · Elsevier; author record at The Hong Kong Polytechnic University',
      usedFor: 'Showing why depot decisions, vehicle tours, service timing and operational cost interact in post-disaster distribution.',
      limitation: 'The paper uses a bi-objective location-routing model and hybrid ant-colony algorithm. The app instead uses one fictional depot and a simpler nearest-feasible-demand heuristic; it does not reproduce or validate the published algorithm.',
    },
    {
      type: 'Industrial software documentation',
      title: 'Vehicle Routing — Google OR-Tools',
      authors: ['Google for Developers'],
      year: 2025,
      url: 'https://developers.google.com/optimization/routing',
      publisher: 'Google · OR-Tools documentation; page last updated 22 January 2025',
      usedFor: 'Identifying vehicle-routing constraints such as capacity, time windows, resources and omitted visits, and distinguishing good solutions from proven optima.',
      limitation: 'This is a capability and method reference. OR-Tools is not embedded in this static demo, and the app’s custom heuristic provides no global optimality guarantee.',
    },
  ],
  shelterspace: [
    {
      type: 'Peer-reviewed research article',
      title: 'Emergency shelter location–allocation analysis with time–varying demand',
      authors: ['Eiei Tun', 'Toshimitsu Nishikiori', 'Varun Varghese', 'Makoto Chikaraishi', 'Miho Seike', 'Akimasa Fujiwara'],
      year: 2024,
      doi: '10.1016/j.eastsj.2024.100152',
      url: 'https://doi.org/10.1016/j.eastsj.2024.100152',
      publisher: 'Asian Transport Studies, 10, 100152 · Elsevier',
      usedFor: 'Connecting shelter opening, capacity, spatial demand and travel time, and showing why a demand estimate is part of the planning model.',
      limitation: 'The paper applies a time-varying location–allocation model in Higashihiroshima. This app uses static fictional demand, fixed site activation order and a greedy allocator; it does not implement the paper’s solver or verify accessibility and equity.',
    },
    {
      type: 'Humanitarian standards handbook',
      title: 'The Sphere Handbook: Humanitarian Charter and Minimum Standards in Humanitarian Response, Fourth Edition',
      authors: ['Sphere Association'],
      year: 2018,
      url: 'https://spherestandards.org/handbook/',
      publisher: 'Sphere Association',
      usedFor: 'Grounding teaching discussions in shelter, settlement, essential services and the need to apply humanitarian standards in context with affected people.',
      limitation: 'The app’s area-per-person slider is an invented scenario assumption, not a quoted Sphere threshold. A modelled assignment does not establish compliance, site safety, protection or adequate services.',
    },
  ],
};

/** A Barchinet teaching ladder, not an externally certified TRL assessment. */
export const maturityLevels = [
  {
    level: 1, key: 'research', title: 'Research',
    evidenceRequired: ['A defined problem, intended users and decision to support', 'Relevant literature, explicit assumptions and unanswered research questions'],
  },
  {
    level: 2, key: 'model', title: 'Model',
    evidenceRequired: ['A documented mathematical or computational model with clear units and boundaries', 'Traceable input data, reproducible calculations and sensitivity analysis'],
  },
  {
    level: 3, key: 'prototype', title: 'Prototype',
    evidenceRequired: ['A functioning product workflow connected to the documented research model', 'Task-based usability evidence from intended users and recorded defects'],
  },
  {
    level: 4, key: 'pilot', title: 'Pilot',
    evidenceRequired: ['A bounded partner deployment with governed, representative real data', 'Defined pilot measures, human oversight and recorded operational outcomes'],
  },
  {
    level: 5, key: 'validated', title: 'Validated',
    evidenceRequired: ['Independent review against predefined scientific and operational acceptance criteria', 'Performance, limitations and reproducibility demonstrated across representative cases'],
  },
  {
    level: 6, key: 'operational', title: 'Operational',
    evidenceRequired: ['An accountable service owner, support, security and data governance', 'Ongoing monitoring, change control, user adoption and evidenced deployment outcomes'],
  },
];

export const projectMaturity = Object.fromEntries(Object.keys(referencesByLab).map(id => [id, {
  currentLevel: 1,
  label: 'Research — Interactive Demo',
  description: 'This level describes the evidence behind the proposed research product, not the visual polish of the web app. The current experience uses synthetic teaching data. No original calibrated research model, partner pilot, independent scientific validation or operational market deployment is evidenced here.',
  verifiedEvidence: [],
}]));

export const referenceNotice = 'These primary sources inform the research questions and method boundaries. The app scenarios and all numerical coefficients are synthetic. A citation is not evidence of endorsement, compliance, replication or product validation.';
