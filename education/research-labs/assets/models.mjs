/**
 * Barchinet Research Labs: deliberately small, deterministic teaching models.
 * Every scenario, price and numerical coefficient in this file is synthetic.
 * References explain methods; they do not validate these invented datasets.
 */
const USD = 'USD';
const colors = ['#c76e4d', '#c6a349', '#4b8983', '#849466', '#8c899f'];
const range = (key, label, min, max, step, value, unit = '') => ({ type: 'range', key, label, min, max, step, value, unit });
const select = (key, label, value, options) => ({ type: 'select', key, label, value, options: options.map(([value, label]) => ({ value, label })) });
const metric = (label, value, unit, detail) => ({ label, value, unit, detail });
const refs = {
  waste: { title: 'EPA · WARM method and documentation', url: 'https://www.epa.gov/waste-reduction-model/documentation-waste-reduction-model' },
  lca: { title: 'ISO 14040 · Life cycle assessment framework', url: 'https://www.iso.org/standard/37456.html' },
  lcc: { title: 'NIST · Life Cycle Costing Manual', url: 'https://www.nist.gov/publications/life-cycle-costing-manual-federal-energy-management-program' },
  material: { title: 'UNEP · Building Materials and the Climate', url: 'https://www.unep.org/resources/report/building-materials-and-climate-constructing-new-future' },
  route: { title: 'Google OR-Tools · Vehicle routing concepts', url: 'https://developers.google.com/optimization/routing' },
  shelter: { title: 'Sphere · Shelter and settlement guidance', url: 'https://spherestandards.org/handbook/' },
};

export const labs = [
  {
    id: 'circularbuild', title: 'CircularBuild Lab', shortTitle: 'CircularBuild', kicker: '01 / MATERIAL RECOVERY',
    description: 'Give a building a second material life. Explore the trade-off between sorting effort, transport and recovery.',
    mission: 'Plan the material recovery of a fictional 2,000 m² renewal project. Can you reduce landfill without losing sight of cost?',
    roles: [{ name: 'Student', goal: 'Explain why the preferred recovery plan changes when distance or sorting changes.' }, { name: 'Site manager', goal: 'Balance sorting effort, haulage and disposal costs.' }, { name: 'City planner', goal: 'Track landfill diversion and the boundaries of a carbon comparison.' }],
    controls: [range('area', 'Building floor area', 500, 5000, 100, 2000, 'm²'), range('demolition', 'Share removed', 20, 100, 5, 60, '%'), range('sorting', 'Material sorted on site', 0, 100, 5, 70, '%'), range('distance', 'Average haul distance', 5, 150, 5, 35, 'km')],
    defaults: { area: 2000, demolition: 60, sorting: 70, distance: 35 },
    sources: [refs.waste, refs.lca],
    assumptions: ['All masses, prices, yields and emission factors are invented teaching values; none are WARM factors.', 'One average haul distance applies to every tonne. The same transport assumption is used for the all-disposal baseline.', 'Only removed material is modelled. Hazardous materials, contamination, building safety and structural suitability are outside this model.', 'The carbon result is a simplified net scenario proxy including an assumed avoided-production credit; it is not a project LCA.'],
    methods: ['Mass = floor area × removed share × material intensity.', 'Recovered mass = material mass × sorting share × recovery yield. Reuse and recycling divide recovered mass; the balance goes to landfill.', 'Net cost = sorting + haulage + disposal − assumed recovery revenue. Baseline = haulage + disposal of all material.'],
  },
  {
    id: 'panelbuild', title: 'PanelBuild Studio', shortTitle: 'PanelBuild', kicker: '02 / RAPID RECONSTRUCTION',
    description: 'Compare delivery strategies for the same housing programme. Watch factory work, delivery and site assembly unfold.',
    mission: 'Deliver a fictional programme of 40 equal-size homes. Compare panel, hybrid and masonry scenarios on time, cost and production-plus-haul emissions.',
    roles: [{ name: 'Student', goal: 'Explain the trade-off between build speed, cost and material impacts.' }, { name: 'Project manager', goal: 'Explore crew size and supply distance before choosing a delivery strategy.' }, { name: 'Procurement lead', goal: 'Compare like-for-like programme costs and identify what the model leaves out.' }],
    controls: [select('method', 'Construction strategy', 'panel', [['panel', 'Factory panels'], ['hybrid', 'Hybrid assembly'], ['masonry', 'Site-built masonry']]), range('units', 'Homes in programme', 10, 100, 10, 40, 'homes'), range('crews', 'Site crews', 1, 8, 1, 3, 'crews'), range('distance', 'Supplier distance', 20, 600, 20, 80, 'km')],
    defaults: { method: 'panel', units: 40, crews: 3, distance: 80 },
    sources: [refs.material, refs.lca],
    assumptions: ['All productivity rates, prices and emission factors are invented; the comparison demonstrates a method rather than a market forecast.', 'Every home has 30 m² of floor area and is assumed to meet the same service requirements. Engineering compliance is not evaluated.', 'Factory, delivery and assembly stages run sequentially in this simplified schedule. Crew productivity is linear.', 'Carbon covers a synthetic production-and-haul proxy only. Operational energy, maintenance and end of life are excluded.'],
    methods: ['Floor area = homes × 30 m². Site days = ceiling(floor area × labour hours per m² ÷ [crews × 8 hours]).', 'Programme days = factory + delivery + mobilisation + site days.', 'Cost = material + site labour + transport + plant. Compare all strategies using the same programme size, crew count and haul distance.'],
  },
  {
    id: 'vernacular', title: 'Vernacular Futures', shortTitle: 'Vernacular', kicker: '03 / WHOLE-LIFE THINKING',
    description: 'Look beyond the purchase price. Explore how climate, maintenance and material choices change a building over time.',
    mission: 'Compare three hypothetical wall systems for a 300 m² courtyard building over a chosen study period. Keep financial and environmental accounts separate.',
    roles: [{ name: 'Student', goal: 'Distinguish LCC financial accounting from LCA environmental accounting.' }, { name: 'Conservation designer', goal: 'Explore material layers and maintenance obligations over time.' }, { name: 'Building owner', goal: 'Compare upfront expenditure with discounted future costs.' }],
    controls: [select('material', 'Wall system', 'earth', [['earth', 'Earth + timber'], ['brick', 'Fired-brick wall'], ['hybrid', 'Insulated hybrid']]), select('climate', 'Illustrative climate', 'mild', [['mild', 'Mild'], ['hot', 'Hot'], ['cold', 'Cold']]), range('years', 'Study period', 10, 60, 5, 40, 'years'), range('distance', 'Material haul distance', 5, 500, 5, 45, 'km')],
    defaults: { material: 'earth', climate: 'mild', years: 40, distance: 45 },
    sources: [refs.lca, refs.lcc, refs.material],
    assumptions: ['All material profiles, energy intensities, prices, maintenance cycles and transport factors are synthetic.', '300 m² floor area, 420 m² wall area, a constant 3% real discount rate, USD 0.18/kWh and 0.30 kg CO₂e/kWh are assumed.', 'Energy is an illustrative whole-building proxy influenced by wall choice and climate, not a validated thermal simulation.', 'Financial flows are discounted; environmental quantities are not. No claim is made that local materials always perform better.', 'The financial account includes construction, energy, repairs and end of life. The environmental proxy excludes end-of-life impacts and is not a full, reviewed LCA.'],
    methods: ['LCC = construction + present value of annual energy + present value of repairs + discounted net end-of-life cost.', 'Future cash flow at year t is divided by (1 + 0.03)^t. Repairs at the final study year are excluded to avoid a repair immediately before assumed disposal.', 'Environmental proxy = production + haulage + undiscounted operating emissions + repair material emissions. The study period is held equal across options.'],
  },
  {
    id: 'reliefroute', title: 'ReliefRoute Lab', shortTitle: 'ReliefRoute', kicker: '04 / RELIEF LOGISTICS',
    description: 'A road closure changes more than a route. Explore capacity, delivery time and the people still waiting.',
    mission: 'Deliver relief kits from one fictional warehouse to six neighbourhoods. Close the northern bridge and see which constraints become binding.',
    roles: [{ name: 'Student', goal: 'Explain why a feasible route plan can leave demand unmet.' }, { name: 'Logistics coordinator', goal: 'Match a limited fleet to demand within a shift.' }, { name: 'Field coordinator', goal: 'Locate unserved demand and examine the consequences of a road closure.' }],
    controls: [range('fleet', 'Available vehicles', 1, 8, 1, 3, 'vehicles'), range('demandScale', 'Demand relative to baseline', 50, 200, 10, 100, '%'), select('bridge', 'Northern bridge', 'open', [['open', 'Open'], ['closed', 'Closed']]), range('shift', 'Delivery shift', 120, 480, 30, 240, 'min')],
    defaults: { fleet: 3, demandScale: 100, bridge: 'open', shift: 240 },
    sources: [refs.route],
    assumptions: ['The map, demands, road distances and vehicle characteristics are fictional; no live maps or disaster data are used.', 'Each vehicle carries 40 kits, travels at a constant 30 km/h, spends 10 minutes at each delivery stop, and makes at most one tour.', 'Shortest road paths use Dijkstra’s algorithm. Tours use a deterministic nearest-feasible-demand heuristic with split deliveries.', 'This custom teaching heuristic is not the OR-Tools solver and does not prove a globally optimal result. Loading, congestion and risk probabilities are excluded.'],
    methods: ['Find shortest open-road distances. For each vehicle, select the nearest remaining demand that still allows a depot return within the shift.', 'Deliver the lesser of remaining vehicle capacity and neighbourhood demand; then repeat until capacity or shift constraints bind.', 'Coverage = delivered kits ÷ requested kits. Unmet demand is always displayed, including when no feasible delivery can be made.'],
  },
  {
    id: 'shelterspace', title: 'ShelterSpace Lab', shortTitle: 'ShelterSpace', kicker: '05 / EQUITABLE SHELTER',
    description: 'Choose places, distribute people and make the gaps visible. Explore capacity and access on a fictional city map.',
    mission: 'Assign 6,000 people from eight fictional districts to available arenas. Explore usable space, active sites and allocation order.',
    roles: [{ name: 'Student', goal: 'Explain how a capacity assumption changes coverage and travel.' }, { name: 'Shelter coordinator', goal: 'Identify capacity shortages before assigning people.' }, { name: 'Accessibility planner', goal: 'Compare how allocation order changes travel for farther districts.' }],
    controls: [range('population', 'People needing shelter', 2000, 12000, 500, 6000, 'people'), range('centres', 'Active arenas', 1, 5, 1, 3, 'sites'), range('space', 'Assumed usable space per person', 3.5, 6, 0.5, 4, 'm²'), select('access', 'Allocation order', 'balanced', [['balanced', 'Farther districts first'], ['nearest', 'District sequence']])],
    defaults: { population: 6000, centres: 3, space: 4, access: 'balanced' },
    sources: [refs.shelter, refs.route],
    assumptions: ['All districts, populations, site areas, distances and travel speeds are invented. The space slider is a teaching assumption, not a quoted Sphere minimum.', 'Arena areas are assumed usable after service and circulation space is set aside; facilities and structural safety are not assessed.', 'Sites activate in a fixed illustrative order. District demands use fixed population shares, with rounding reconciled to the total.', 'The greedy allocation serves farther districts first or uses district sequence, then chooses the nearest site with capacity. It does not prove optimality or certify fairness.', 'Travel uses straight-line distance scaled by 0.04 km per map unit, at 20 km/h. Mobility, household unity and protection needs require a richer real-world model.'],
    methods: ['Capacity per arena = floor(usable area ÷ assumed area per person). Total capacity includes active arenas only.', 'Allocate each district to its nearest available arena, splitting allocations only when necessary; explicitly retain unmet demand.', 'Average travel time is weighted by assigned people. Report the worst assigned trip separately; unassigned people are excluded from travel averages.'],
  },
];

function cleanInputs(lab, supplied = {}) {
  return Object.fromEntries(lab.controls.map(c => {
    const raw = supplied[c.key] ?? lab.defaults[c.key];
    if (c.type === 'select') return [c.key, c.options.some(o => o.value === raw) ? raw : lab.defaults[c.key]];
    const n = Number(raw);
    const bounded = Math.min(c.max, Math.max(c.min, Number.isFinite(n) ? n : lab.defaults[c.key]));
    const stepped = c.min + Math.round((bounded - c.min) / c.step) * c.step;
    return [c.key, Math.min(c.max, Number(stepped.toFixed(6)))];
  }));
}

function circular(p) {
  const profiles = [
    ['Concrete', .45, .88, .12, 11, 18], ['Brick', .16, .80, .30, 32, 12], ['Steel', .025, .98, .70, 260, 1300], ['Timber', .035, .65, .35, 70, 90], ['Glass', .03, .75, .05, 15, 110],
  ];
  const removedArea = p.area * p.demolition / 100;
  const materials = profiles.map(([name, intensity, yieldRate, reuseShare, price, credit], i) => {
    const mass = removedArea * intensity;
    const recovered = mass * p.sorting / 100 * yieldRate;
    return { name, mass, reuse: recovered * reuseShare, recycle: recovered * (1 - reuseShare), landfill: mass - recovered, recovered, revenue: recovered * price, avoidedKg: recovered * credit, color: colors[i] };
  });
  const total = materials.reduce((a, m) => a + m.mass, 0);
  const recovered = materials.reduce((a, m) => a + m.recovered, 0);
  const landfill = total - recovered;
  const sorting = total * p.sorting / 100 * 18;
  const haul = total * p.distance * .19;
  const disposal = landfill * 85;
  const revenue = materials.reduce((a, m) => a + m.revenue, 0);
  const netCost = sorting + haul + disposal - revenue;
  const baselineCost = total * 85 + haul;
  const carbonKg = landfill * 9 + total * p.distance * .11 - materials.reduce((a, m) => a + m.avoidedKg, 0);
  const costDifference = netCost - baselineCost;
  const costComparison = Math.abs(costDifference) < .005 ? 'The assumed recovery plan costs the same as' : costDifference < 0 ? 'The assumed recovery plan costs less than' : 'The assumed recovery plan costs more than';
  return {
    metrics: [metric('Net management cost', netCost, USD, 'Sorting + haul + disposal − recovery revenue'), metric('Material recovered', recovered, 't', 'Reuse and recycling combined'), metric('Landfill diversion', recovered / total * 100, '%', 'Recovered share of removed material'), metric('Net carbon proxy', carbonKg / 1000, 't CO₂e', 'Synthetic factors, including avoided-production credits')],
    explanation: `${Math.round(recovered)} of ${Math.round(total)} tonnes are recovered. ${costComparison} sending everything to landfill under the same haul-distance assumption.`,
    steps: [
      { title: 'Start with the material account', text: `${p.area.toLocaleString('en-US')} m² × ${p.demolition}% removed = ${removedArea.toLocaleString('en-US')} m² affected. The five assumed material intensities add up to 0.70 t/m², giving ${total.toFixed(1)} tonnes.` },
      { title: 'Follow the recovery stream', text: `For concrete: ${materials[0].mass.toFixed(1)} t × ${p.sorting}% sorted × 88% assumed yield = ${materials[0].recovered.toFixed(1)} t recovered. Unsorted material and recovery losses go to landfill.` },
      { title: 'Build the cost account', text: `USD ${sorting.toFixed(0)} sorting + ${haul.toFixed(0)} haulage + ${disposal.toFixed(0)} disposal − ${revenue.toFixed(0)} revenue = USD ${netCost.toFixed(0)} net. The all-disposal baseline is USD ${baselineCost.toFixed(0)}.` },
      { title: 'Test a research claim', text: 'Change sorting and haul distance separately. Distinguish the mass result from the cost result, and remember that the carbon credits here are invented rather than measured project benefits.' },
    ],
    details: { materials, total, recovered, landfill, baselineCost, netCost, sorting, haul, disposal, revenue, carbonKg, removedArea },
    chart: materials.map(m => ({ label: m.name, value: m.mass, recovered: m.recovered, color: m.color })),
  };
}

const panelProfiles = {
  panel: { label: 'Factory panels', material: 108, labour: .5, factory: 12, plant: 7200, intensity: .14, embodied: 145 },
  hybrid: { label: 'Hybrid assembly', material: 88, labour: 1.05, factory: 7, plant: 4500, intensity: .23, embodied: 175 },
  masonry: { label: 'Site-built masonry', material: 62, labour: 1.8, factory: 0, plant: 1600, intensity: .40, embodied: 210 },
};
function panelScenario(method, p) {
  const x = panelProfiles[method];
  const area = p.units * 30;
  const siteDays = Math.ceil(area * x.labour / (p.crews * 8));
  const delivery = Math.ceil(p.distance / 400);
  const stages = [{ label: 'Factory', days: x.factory, color: '#c6a349' }, { label: 'Delivery', days: delivery, color: '#7a9fa0' }, { label: 'Mobilise', days: 3, color: '#bca78c' }, { label: 'Assembly', days: siteDays, color: '#c76e4d' }];
  const costs = [{ label: 'Material', value: area * x.material }, { label: 'Site labour', value: area * x.labour * 24 }, { label: 'Transport', value: Math.ceil(area * x.intensity / 12) * p.distance * 2.4 }, { label: 'Plant', value: x.plant }];
  return { label: x.label, method, area, stages, costs, days: stages.reduce((a, s) => a + s.days, 0), cost: costs.reduce((a, c) => a + c.value, 0), carbonKg: area * x.embodied + area * x.intensity * p.distance * .11 };
}
function panel(p) {
  const selected = panelScenario(p.method, p);
  const baseline = panelScenario('masonry', p);
  const { area, days, stages, costs } = selected;
  return {
    metrics: [metric('Programme duration', days, 'days', 'Sequential factory, delivery, mobilisation and site work'), metric('Programme cost', selected.cost, USD, 'Synthetic material, labour, transport and plant costs'), metric('Days saved vs masonry', baseline.days - days, 'days', 'Same programme, crews and haul distance'), metric('Production + haul proxy', selected.carbonKg / 1000, 't CO₂e', 'Excludes operation, maintenance and end of life')],
    explanation: `${p.units} homes provide ${area.toLocaleString('en-US')} m². With ${p.crews} site crews, ${selected.label.toLowerCase()} takes ${days} days in this sequential model. ${p.method === 'masonry' ? 'This is the comparison baseline.' : 'Compare the faster schedule against purchase, transport and plant costs.'}`,
    steps: [
      { title: 'Make the comparison equivalent', text: `${p.units} homes × 30 m² = ${area.toLocaleString('en-US')} m² for every method. The model assumes equal service performance; it does not verify structural or thermal compliance.` },
      { title: 'Translate productivity into days', text: `${area} m² × ${panelProfiles[p.method].labour} labour hours/m² ÷ (${p.crews} crews × 8 h/day), rounded up, gives ${stages[3].days} site days. One model crew represents one unit of the assumed productivity.` },
      { title: 'Include the supply chain', text: `Add ${stages[0].days} factory days, ${stages[1].days} delivery days and 3 mobilisation days. At ${p.distance} km, assumed transport costs USD ${costs[2].value.toFixed(0)}.` },
      { title: 'Compare more than speed', text: `The masonry baseline takes ${baseline.days} days and costs USD ${baseline.cost.toFixed(0)}. Change distance or crew size and examine cost and emissions separately. No method is assigned a universal advantage.` },
    ],
    details: { units: p.units, area, method: p.method, days, baselineDays: baseline.days, stages, costs, embodiedKg: selected.carbonKg, comparison: Object.keys(panelProfiles).map(method => panelScenario(method, p)) },
    chart: Object.keys(panelProfiles).map(method => { const s = panelScenario(method, p); return { label: s.label, value: s.days, cost: s.cost }; }),
  };
}

const wallProfiles = {
  earth: { label: 'Earth + timber', production: 38, rate: 95, energy: 55, mass: .40, interval: 8, repair: 12, repairCarbon: 2.5, cold: 1.35, hot: .90, localShare: .85, layers: [{ label: 'Earth plaster', thickness: 20, color: '#d7bb93' }, { label: 'Earth wall', thickness: 350, color: '#a97858' }, { label: 'Lime finish', thickness: 15, color: '#eee3ce' }] },
  brick: { label: 'Fired-brick wall', production: 72, rate: 90, energy: 62, mass: .25, interval: 15, repair: 8, repairCarbon: 1.8, cold: 1, hot: 1.05, localShare: .25, layers: [{ label: 'Render', thickness: 20, color: '#e4d9c6' }, { label: 'Brick', thickness: 230, color: '#ba6a4d' }, { label: 'Plaster', thickness: 15, color: '#eee3ce' }] },
  hybrid: { label: 'Insulated hybrid', production: 58, rate: 115, energy: 48, mass: .30, interval: 12, repair: 10, repairCarbon: 2.1, cold: .90, hot: .95, localShare: .60, layers: [{ label: 'Lime finish', thickness: 20, color: '#e4d9c6' }, { label: 'Insulation', thickness: 80, color: '#c6a349' }, { label: 'Earth block', thickness: 200, color: '#a97858' }, { label: 'Plaster', thickness: 15, color: '#eee3ce' }] },
};
function wallScenario(material, p) {
  const x = wallProfiles[material], area = 300, wallArea = 420, rate = .03;
  const climateMultiplier = p.climate === 'cold' ? 1.8 * x.cold : p.climate === 'hot' ? 1.4 * x.hot : 1;
  const annualEnergy = area * x.energy * climateMultiplier;
  const construction = wallArea * x.rate + wallArea * x.mass * p.distance * .19;
  let energyPV = 0, maintenancePV = 0, repairKg = 0;
  const timeline = [{ year: 0, cost: construction, kind: 'Construction' }];
  for (let year = 1; year <= p.years; year++) {
    energyPV += annualEnergy * .18 / (1 + rate) ** year;
    if (year % x.interval === 0 && year < p.years) {
      const cost = wallArea * x.repair;
      maintenancePV += cost / (1 + rate) ** year;
      repairKg += wallArea * x.repairCarbon;
      timeline.push({ year, cost, kind: 'Maintenance' });
    }
  }
  const endOfLife = wallArea * 12;
  const endOfLifePV = endOfLife / (1 + rate) ** p.years;
  timeline.push({ year: p.years, cost: endOfLife, kind: 'End of life' });
  const totalCost = construction + energyPV + maintenancePV + endOfLifePV;
  const carbonKg = wallArea * x.production + wallArea * x.mass * p.distance * .11 + annualEnergy * p.years * .30 + repairKg;
  return { label: x.label, material, years: p.years, area, wallArea, annualEnergy, construction, maintenancePV, energyPV, endOfLifePV, totalCost, cost: totalCost, carbonKg, timeline, layers: x.layers, localSpend: wallArea * x.rate * x.localShare };
}
function vernacular(p) {
  const s = wallScenario(p.material, p);
  return {
    metrics: [metric('Discounted whole-life cost', s.totalCost, USD, `${p.years}-year financial account at 3% real discount rate`), metric('Annual energy proxy', s.annualEnergy, 'kWh/yr', 'Synthetic whole-building intensity × floor area × climate'), metric('Environmental proxy', s.carbonKg / 1000, 't CO₂e', 'Undiscounted production, haul, operation and repair proxies'), metric('Assumed local spending', s.localSpend, USD, 'Illustrative share of initial wall material expenditure')],
    explanation: `${s.label} is evaluated over ${p.years} years in the ${p.climate} scenario. Future energy and repairs affect the financial total; their timing matters. The carbon proxy is tracked separately without financial discounting.`,
    steps: [
      { title: 'Set a common study boundary', text: `All alternatives describe the same 300 m² building and 420 m² wall area over ${p.years} years. Numerical performance and material profiles are invented teaching assumptions.` },
      { title: 'Estimate recurring use', text: `The selected material and climate give ${s.annualEnergy.toFixed(0)} kWh per year. At the assumed USD 0.18/kWh, that is USD ${(s.annualEnergy * .18).toFixed(0)} per year before discounting.` },
      { title: 'Bring future costs to the present', text: `Discount each future payment by (1.03)^year. Construction USD ${s.construction.toFixed(0)} + energy PV ${s.energyPV.toFixed(0)} + maintenance PV ${s.maintenancePV.toFixed(0)} + end-of-life PV ${s.endOfLifePV.toFixed(0)} = USD ${s.totalCost.toFixed(0)}.` },
      { title: 'Keep LCC and LCA separate', text: `The financial account uses a discount rate; the environmental account sums physical emissions without it. Switch climate: the earth-wall option deliberately loses some energy advantage in the cold scenario. Local origin alone does not establish better whole-life performance.` },
    ],
    details: { ...s, comparison: Object.keys(wallProfiles).map(material => wallScenario(material, p)) },
    chart: [{ label: 'Construction', value: s.construction }, { label: 'Energy PV', value: s.energyPV }, { label: 'Maintenance PV', value: s.maintenancePV }, { label: 'End of life PV', value: s.endOfLifePV }],
  };
}

const roadNodes = [
  { id: 0, x: 70, y: 230, name: 'Central warehouse', type: 'warehouse' },
  { id: 1, x: 235, y: 140, name: 'North junction', type: 'transit' },
  { id: 2, x: 235, y: 350, name: 'South junction', type: 'transit' },
  { id: 3, x: 155, y: 65, name: 'Hill district', type: 'demand', base: 18 },
  { id: 4, x: 420, y: 125, name: 'East bank', type: 'demand', base: 25 },
  { id: 5, x: 420, y: 350, name: 'Riverside', type: 'demand', base: 15 },
  { id: 6, x: 610, y: 70, name: 'North ridge', type: 'demand', base: 22 },
  { id: 7, x: 625, y: 255, name: 'Market district', type: 'demand', base: 30 },
  { id: 8, x: 540, y: 425, name: 'South park', type: 'demand', base: 16 },
];
const roadEdges = [[0, 1, 8], [0, 2, 10], [1, 2, 10], [1, 3, 5], [1, 4, 6], [2, 5, 20], [4, 5, 9], [4, 6, 8], [6, 7, 8], [5, 7, 10], [5, 8, 6], [7, 8, 8]];
function shortest(nodes, edges, start) {
  const distances = new Map(nodes.map(n => [n.id, Infinity])), paths = new Map([[start, [start]]]), visited = new Set();
  distances.set(start, 0);
  while (visited.size < nodes.length) {
    const next = nodes.filter(n => !visited.has(n.id)).sort((a, b) => distances.get(a.id) - distances.get(b.id) || a.id - b.id)[0];
    if (!next || !Number.isFinite(distances.get(next.id))) break;
    visited.add(next.id);
    for (const edge of edges.filter(e => !e.closed && (e.a === next.id || e.b === next.id))) {
      const to = edge.a === next.id ? edge.b : edge.a;
      const candidate = distances.get(next.id) + edge.km;
      if (candidate < distances.get(to)) {
        distances.set(to, candidate);
        paths.set(to, [...paths.get(next.id), to]);
      }
    }
  }
  return { distances, paths };
}
function relief(p) {
  const nodes = roadNodes.map(n => ({ ...n, demand: n.base ? Math.round(n.base * p.demandScale / 100) : 0, served: 0 }));
  const edges = roadEdges.map(([a, b, km]) => ({ a, b, km, closed: p.bridge === 'closed' && a === 1 && b === 4 }));
  const allPaths = new Map(nodes.map(n => [n.id, shortest(nodes, edges, n.id)]));
  const routes = [];
  for (let vehicle = 1; vehicle <= p.fleet; vehicle++) {
    let current = 0, load = 0, elapsed = 0, km = 0;
    const path = [0], stops = [];
    while (load < 40) {
      const candidates = nodes.filter(n => n.type === 'demand' && n.served < n.demand).map(n => {
        const distance = allPaths.get(current).distances.get(n.id);
        const returnDistance = allPaths.get(n.id).distances.get(0);
        return { n, distance, returnDistance };
      }).filter(c => Number.isFinite(c.distance) && elapsed + c.distance * 2 + 10 + c.returnDistance * 2 <= p.shift).sort((a, b) => a.distance - b.distance || a.n.id - b.n.id);
      if (!candidates.length) break;
      const { n, distance } = candidates[0];
      const delivery = Math.min(40 - load, n.demand - n.served);
      path.push(...allPaths.get(current).paths.get(n.id).slice(1));
      stops.push({ node: n.id, kits: delivery });
      elapsed += distance * 2 + 10;
      km += distance;
      n.served += delivery;
      load += delivery;
      current = n.id;
    }
    if (current !== 0) {
      const back = allPaths.get(current);
      km += back.distances.get(0);
      elapsed += back.distances.get(0) * 2;
      path.push(...back.paths.get(0).slice(1));
    }
    routes.push({ vehicle, path, load, minutes: elapsed, km, stops });
  }
  const demand = nodes.reduce((a, n) => a + n.demand, 0), served = nodes.reduce((a, n) => a + n.served, 0), unmet = demand - served;
  const totalKm = routes.reduce((a, r) => a + r.km, 0), lastReturn = Math.max(0, ...routes.map(r => r.minutes));
  return {
    metrics: [metric('Demand served', served / demand * 100, '%', `${served} of ${demand} kits delivered`), metric('Unmet demand', unmet, 'kits', 'Demand left after fleet and shift limits'), metric('Fleet road distance', totalKm, 'km', 'Includes each vehicle’s warehouse return'), metric('Last vehicle return', lastReturn, 'min', `Delivery shift limit: ${p.shift} min`)],
    explanation: `${served} of ${demand} requested kits are delivered by ${routes.filter(r => r.load > 0).length} active vehicles. ${unmet ? `${unmet} kits remain unserved; the shortfall is not hidden.` : 'All requested kits are served in this teaching scenario.'} This feasible nearest-demand heuristic does not establish a global optimum.`,
    steps: [
      { title: 'Map demand and constraints', text: `Six districts request ${demand} kits. ${p.fleet} vehicles × 40 kits allow at most ${p.fleet * 40} kits on one tour each. The shift lasts ${p.shift} minutes.` },
      { title: 'Update the road graph', text: `The northern bridge is ${p.bridge}. Shortest paths are recomputed over open roads only. Travel time is distance × 2 min/km at the assumed constant 30 km/h.` },
      { title: 'Build feasible vehicle tours', text: `Choose the nearest district that still permits a warehouse return; serve up to remaining capacity and add 10 minutes per stop. Vehicle 1 carries ${routes[0].load} kits and returns after ${routes[0].minutes} minutes.` },
      { title: 'Read the gaps, then challenge the plan', text: `${unmet} kits remain unmet. Add a vehicle, extend the shift or change road availability to discover the binding constraint. A different search method may find a better plan; this app reports a deterministic heuristic, not an optimality certificate.` },
    ],
    details: { nodes, edges, routes, demand, served, unmet, totalKm, lastReturn, bridgeClosed: p.bridge === 'closed', algorithm: 'Dijkstra shortest paths + nearest-feasible-demand heuristic; one tour per vehicle; no proof of global optimality' },
    chart: nodes.filter(n => n.type === 'demand').map(n => ({ label: n.name, value: n.demand, served: n.served })),
  };
}

const arenaProfiles = [
  { id: 'a', x: 180, y: 140, name: 'North Arena', area: 8000 }, { id: 'b', x: 490, y: 200, name: 'Central Arena', area: 6500 }, { id: 'c', x: 320, y: 370, name: 'South Arena', area: 5000 }, { id: 'd', x: 640, y: 370, name: 'East Arena', area: 9000 }, { id: 'e', x: 80, y: 350, name: 'West Arena', area: 4000 },
];
const districtProfiles = [
  { id: 'd1', x: 95, y: 75, name: 'Old Town', share: .16 }, { id: 'd2', x: 340, y: 60, name: 'Northfield', share: .13 }, { id: 'd3', x: 640, y: 85, name: 'Hillview', share: .14 }, { id: 'd4', x: 695, y: 255, name: 'Eastbank', share: .09 }, { id: 'd5', x: 520, y: 440, name: 'Southgate', share: .15 }, { id: 'd6', x: 240, y: 450, name: 'Gardens', share: .10 }, { id: 'd7', x: 60, y: 235, name: 'Westside', share: .12 }, { id: 'd8', x: 335, y: 245, name: 'Centre', share: .11 },
];
const tripMinutes = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) * .04 * 3;
function shelter(p) {
  const centres = arenaProfiles.map((c, i) => ({ ...c, capacity: Math.floor(c.area / p.space), assigned: 0, active: i < p.centres }));
  const districts = districtProfiles.map(d => ({ ...d, demand: Math.floor(p.population * d.share), served: 0 }));
  districts[districts.length - 1].demand += p.population - districts.reduce((a, d) => a + d.demand, 0);
  const active = centres.filter(c => c.active);
  const nearestTime = d => Math.min(...active.map(c => tripMinutes(d, c)));
  const ordered = [...districts];
  if (p.access === 'balanced') ordered.sort((a, b) => nearestTime(b) - nearestTime(a) || a.id.localeCompare(b.id));
  const allocations = [];
  for (const district of ordered) {
    const candidates = [...active].sort((a, b) => tripMinutes(district, a) - tripMinutes(district, b) || a.id.localeCompare(b.id));
    for (const centre of candidates) {
      const people = Math.min(district.demand - district.served, centre.capacity - centre.assigned);
      if (people > 0) {
        district.served += people;
        centre.assigned += people;
        allocations.push({ from: district.id, to: centre.id, people, minutes: tripMinutes(district, centre) });
      }
      if (district.served === district.demand) break;
    }
  }
  const capacity = active.reduce((a, c) => a + c.capacity, 0), served = districts.reduce((a, d) => a + d.served, 0), unmet = p.population - served;
  const averageMinutes = served ? allocations.reduce((a, q) => a + q.people * q.minutes, 0) / served : 0;
  const worstMinutes = Math.max(0, ...allocations.map(a => a.minutes));
  return {
    metrics: [metric('People assigned', served, 'people', `${(served / p.population * 100).toFixed(1)}% of shelter demand`), metric('Unmet shelter need', unmet, 'people', 'Shown explicitly when usable space is insufficient'), metric('Average assigned trip', averageMinutes, 'min', 'Weighted by people; excludes those still unassigned'), metric('Farthest assigned trip', worstMinutes, 'min', 'Straight-line teaching travel proxy')],
    explanation: `${p.centres} active arenas provide ${capacity.toLocaleString('en-US')} places at the assumed ${p.space} m² per person. ${unmet ? `${unmet.toLocaleString('en-US')} people remain without an assignment.` : 'Everyone receives an assignment under these simplified assumptions.'} The allocation order changes who receives nearby space first; it is not a certificate of equity.`,
    steps: [
      { title: 'Translate area into capacity', text: `North Arena has 8,000 m² assumed usable area ÷ ${p.space} m²/person = ${centres[0].capacity.toLocaleString('en-US')} places, rounded down. This space value is a scenario assumption, not a quoted humanitarian standard.` },
      { title: 'Make demand visible', text: `Eight fictional districts sum to ${p.population.toLocaleString('en-US')} people. Active-site capacity is ${capacity.toLocaleString('en-US')}; the unavoidable capacity shortfall is at least ${Math.max(0, p.population - capacity).toLocaleString('en-US')} people.` },
      { title: 'Allocate transparently', text: `${p.access === 'balanced' ? 'Farther districts are processed first' : 'Districts are processed in their listed sequence'}, then each district uses its nearest arena with spare capacity. Splitting is allowed, which a real plan would need to reconcile with household unity.` },
      { title: 'Compare coverage and access', text: `Average assigned travel is ${averageMinutes.toFixed(1)} minutes and the worst assigned trip is ${worstMinutes.toFixed(1)} minutes. Neither number includes the ${unmet.toLocaleString('en-US')} unassigned people, whose unmet need must remain visible.` },
    ],
    details: { centres, districts, allocations, population: p.population, capacity, served, unmet, averageMinutes, worstMinutes, algorithm: 'Greedy nearest-capacity allocation with selectable district order; no proof of optimality or equity' },
    chart: centres.map(c => ({ label: c.name, value: c.active ? c.capacity : 0, assigned: c.assigned, active: c.active })),
  };
}

export function simulate(id, supplied = {}) {
  const lab = labs.find(l => l.id === id);
  if (!lab) throw new RangeError(`Unknown lab: ${id}`);
  const inputs = cleanInputs(lab, supplied);
  const result = ({ circularbuild: circular, panelbuild: panel, vernacular, reliefroute: relief, shelterspace: shelter })[id](inputs);
  return { ...result, inputs, dataNotice: 'Synthetic educational scenario. All numerical coefficients are illustrative. References describe methods, not validation of this dataset.' };
}
