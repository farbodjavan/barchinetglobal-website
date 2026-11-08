import { maturityLevels } from './references.mjs';

/** Faithful English adaptation of the transferred Sample.html teaching dataset.
 *  No coordinates, measured performance, field photographs or real village records
 *  have been added. The source's ten observations per village remain distinct.
 */
export const provenance={
  source:'Transferred Sample.html · 30 synthetic observations, translated to English',
  sourceSha256:'778c12f249b20cc3bca753a2db9f5e880ebd290c823b9a23ba8f9d2cac61bff7',
  notice:'All villages, observations, study illustrations and schematic placements are fictional. No field survey or geographic location is represented.',
  boundary:'A recorded pattern, a design suggestion and an adopted local rule are different kinds of information. This prototype supplies the first two only, using synthetic data.',
  realDataNeeds:['A traceable source and capture date','A named reviewer and review history','Location records with appropriate privacy','Image rights and permission to use the material','Local cultural context, field verification and applicable rules'],
};
export const categories=[
  {id:'materials',label:'Materials',short:'Materials',symbol:'layers'},
  {id:'roof',label:'Roof',short:'Roof',symbol:'roof'},
  {id:'openings',label:'Openings',short:'Openings',symbol:'window'},
  {id:'courtyard',label:'Courtyard',short:'Courtyard',symbol:'court'},
  {id:'paths',label:'Paths',short:'Paths',symbol:'path'},
  {id:'settlement',label:'Settlement',short:'Settlement',symbol:'settlement'},
];
const codes={materials:'M',roof:'R',openings:'O',courtyard:'C',paths:'P',settlement:'S'};
function observations(prefix,items){const counts={};return items.map(([category,title,text],index)=>{counts[category]=(counts[category]||0)+1;return {id:`${prefix}-${codes[category]}${String(counts[category]).padStart(2,'0')}`,category,title,text,sourceIndex:index+1,source:'Sample.html · synthetic observation',synthetic:true}})}
export const villages=[
  {id:'cheshmeh-sar',code:'CS',name:'Cheshmeh-sar',climate:'Cold mountain',setting:'A fictional sloping hillside',summary:'Compact fabric, stone and timber on an imagined cold hillside.',image:'cheshmeh-sar',color:'#7b8b85',map:{x:72,y:23},
    facts:{materials:'Stone and timber',roof:'Pitched roof',openings:'Small, deeply set openings',courtyard:'Enclosed courtyard',settlement:'Compact, following the slope',paths:'Stepped passages'},
    markers:{materials:{x:36,y:64},roof:{x:53,y:31},openings:{x:55,y:55},courtyard:{x:64,y:73},paths:{x:34,y:82},settlement:{x:73,y:49}},
    question:'How might a compact hillside pattern relate to shelter, access and the way buildings meet the slope?',
    observations:observations('CS',[
      ['materials','Stone wall','Fictional local stone is used in thick walls.'],
      ['materials','Timber roof structure','Assumed timber beams support the roof structure.'],
      ['roof','Pitched roof','The fictional roof pitch is intended to shed snow and rain.'],
      ['roof','Roof overhang','The assumed roof edge shelters part of the wall from precipitation.'],
      ['openings','Small windows','Small fictional openings appear in the envelope facing the cold.'],
      ['openings','Deep window reveal','The assumed wall depth sets the window frame in shade and shelter.'],
      ['courtyard','Enclosed courtyard','A small fictional courtyard is sheltered from wind between walls.'],
      ['paths','Stepped passage','Assumed steps make movement along the slope possible.'],
      ['settlement','Compact arrangement','Fictional houses stand close together and align with the slope.'],
      ['settlement','Successive levels','The fictional buildings sit at different levels on the hillside.'],
    ])},
  {id:'aftab-dasht',code:'AD',name:'Aftab-dasht',climate:'Hot and dry',setting:'A fictional sun-exposed plain',summary:'Inward-facing courtyards and shade in an imagined warm settlement.',image:'aftab-dasht',color:'#aa8563',map:{x:44,y:60},
    facts:{materials:'Earth blocks and earth render',roof:'Flat roof',openings:'Small, shaded openings',courtyard:'Inward-facing, enclosed courtyard',settlement:'Compact, around courtyards',paths:'Narrow, shaded passages'},
    markers:{materials:{x:30,y:60},roof:{x:57,y:28},openings:{x:72,y:54},courtyard:{x:54,y:60},paths:{x:30,y:80},settlement:{x:77,y:36}},
    question:'How might an inward-facing courtyard and narrow passages organise shade and shared space?',
    observations:observations('AD',[
      ['materials','Earth-block wall','The fictional thick earth-block wall represents thermal mass.'],
      ['materials','Earth render','Assumed earth render creates a continuous wall surface.'],
      ['roof','Flat roof','The fictional flat roof is intended as a usable surface.'],
      ['roof','Roof parapet','A parapet marks the edge of the fictional roof.'],
      ['openings','Small exterior window','Small assumed openings reduce direct sunlight entering the interior.'],
      ['openings','Window shading','An assumed shading element blocks sunlight during part of the day.'],
      ['courtyard','Central courtyard','Fictional spaces are organised around an enclosed courtyard.'],
      ['courtyard','Courtyard porch','An assumed porch makes a shaded, semi-open space.'],
      ['paths','Narrow passage','The assumed height-to-width relationship of the passage helps create shade.'],
      ['settlement','Continuous fabric','Fictional building volumes sit close together around courtyards.'],
    ])},
  {id:'meh-darreh',code:'MD',name:'Meh-darreh',climate:'Mild and humid',setting:'A fictional rainy valley',summary:'Steep roofs, ventilation and spacing in an imagined green valley.',image:'meh-darreh',color:'#729281',map:{x:25,y:36},
    facts:{materials:'Timber and stone',roof:'Steep pitch with deep overhangs',openings:'Large, operable openings',courtyard:'Open, green courtyard',settlement:'Dispersed, with space between buildings',paths:'Open earth paths'},
    markers:{materials:{x:40,y:68},roof:{x:52,y:30},openings:{x:60,y:54},courtyard:{x:70,y:75},paths:{x:31,y:82},settlement:{x:77,y:43}},
    question:'How might roof cover, operable openings and spacing respond to an imagined wet setting?',
    observations:observations('MD',[
      ['materials','Timber structure','A fictional timber frame appears in the building construction.'],
      ['materials','Stone base','An assumed stone base separates a timber floor from damp ground.'],
      ['roof','Steeply pitched roof','The fictional steep roof pitch helps shed rain.'],
      ['roof','Deep roof overhang','An assumed overhang covers the wall and the space around it.'],
      ['openings','Operable windows','Fictional windows on two sides of a room allow an airflow path.'],
      ['openings','Timber shutter','An assumed shutter permits light adjustment and protection from rain.'],
      ['courtyard','Open courtyard','An imagined open green space extends around the house.'],
      ['courtyard','Perimeter veranda','An assumed veranda provides a covered, semi-open space.'],
      ['paths','Open passage','The fictional passage runs through open green spaces.'],
      ['settlement','Spaced arrangement','Assumed gaps between buildings leave a path for air movement.'],
    ])},
];
export const comparisonDimensions=['materials','roof','openings','courtyard','settlement','paths'].map(id=>categories.find(c=>c.id===id));
export const projectTypes=[
  {id:'new',label:'New house',action:'Review spatial organisation and orientation against the observed pattern and actual site conditions.',reason:'A new-house brief calls for testing organisation and orientation. This prompt comes from the selected project type, not a field finding.'},
  {id:'renovation',label:'House upgrade',action:'Document structural condition and moisture before making changes, then review the findings with an appropriate specialist.',reason:'An upgrade brief calls for a condition assessment. This is a project-type teaching prompt; no existing building has been surveyed.'},
  {id:'public',label:'Small shared space',action:'Explore a semi-open shared space together with an access route usable by everyone.',reason:'A small shared-space brief calls for considering semi-open space and access. Accessibility has not been assessed or certified.'},
];
export const atlasApps=[
  {id:'village-atlas',number:'01',title:'Village Atlas',description:'Locate a pattern. Inspect its record.',mission:'Explore ten synthetic observations for each village. Select a component to trace its description and source record.',primary:'Open the atlas'},
  {id:'village-comparison',number:'02',title:'Village Comparison',description:'Read differences without declaring a winner.',mission:'Compare two different villages across six recorded dimensions. Follow each comparison back to its observation IDs.',primary:'Compare villages'},
  {id:'design-guide',number:'03',title:'Design Guide',description:'Keep the reason beside the suggestion.',mission:'Choose a fictional village and project type. Follow four rule-based teaching prompts back to the records and choices that generated them.',primary:'Explore the guide'},
];
export const atlasMaturity={currentLevel:1,label:'Research — Interactive Demo',description:'This level describes the evidence behind the research product, not the polish of the interface. The current collection has synthetic observations and illustrative studies. No field survey, accepted local design statement, partner pilot or independent validation is evidenced.',verifiedEvidence:[],levels:maturityLevels};
export const atlasBibliography=[
  {type:'Official survey and evaluation guidance',title:'Guidelines for Evaluating and Documenting Rural Historic Landscapes — National Register Bulletin 30',authors:['Linda Flint McClelland','J. Timothy Keller','Genevieve P. Keller','Robert Z. Melnick'],year:1999,publisher:'U.S. Department of the Interior, National Park Service · revised edition',url:'https://www.nps.gov/subjects/nationalregister/upload/NRB30-Complete.pdf',usedFor:'Distinguishing identification, documentation and evaluation, and examining relationships between buildings, land use and landscape context.',limitation:'U.S. National Register guidance for rural historic landscapes. It supplies no data for these fictional villages and is not a building regulation or a universal designation test.'},
  {type:'Local-authority method guidance',title:'Introduction to Village Design Statements',authors:['East Devon District Council'],year:2026,publisher:'East Devon District Council · updated 8 July 2026',url:'https://eastdevon.gov.uk/planning/planning-policy/neighbourhood-and-community-plans/village-design-statements/introduction-to-village-design-statements/',usedFor:'Connecting local character, community understanding and development guidance while distinguishing guidance from formal planning status.',limitation:'An England-specific local-authority explanation, not guidance for the whole UK. It does not establish the status of this prototype or supply its synthetic observations.'},
  {type:'Official catalogue-standard index',title:'ICCD catalogue standards — Version 4.01, including AR: Rural Architecture',authors:['Istituto Centrale per il Catalogo e la Documentazione'],year:2024,publisher:'ICCD, Italian Ministry of Culture · version 4.01 standards list',url:'https://iccd.cultura.gov.it/getFile.php?id=9490',usedFor:'Keeping record classes, vocabulary and schema versions explicit when thinking about a rural-architecture archive.',limitation:'This index identifies the AR rural-architecture catalogue class. The prototype does not implement the full AR schema or contain Italian catalogue records; the legacy AR page currently redirects.'},
  {type:'Official heritage-plan publication record',title:'National Plan for Traditional Architecture / Plan nacional de arquitectura tradicional',authors:['Spanish Ministry of Culture'],year:2016,publisher:'Spanish Ministry of Culture · first edition, 56 pages',url:'https://libreria.cultura.gob.es/libro/plan-nacional-de-arquitectura-tradicional_1149/',usedFor:'A conservation and documentation context for discussing the cultural diversity of traditional architecture.',limitation:'The reference is to the publication catalogue record. It supplies no village observations, local planning permission or evidence of market demand; the complete plan is not implemented in this prototype.'},
];

export function getVillage(id){const v=villages.find(v=>v.id===id);if(!v)throw new RangeError('Unknown village: '+id);return v}
export function getObservation(villageId,observationId){return getVillage(villageId).observations.find(o=>o.id===observationId)||null}
const normal=value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function filterObservations(villageId,{query='',category=''}={}){const q=normal(query);return getVillage(villageId).observations.filter(o=>(!category||o.category===category)&&(!q||normal([o.id,o.category,o.title,o.text].join(' ')).includes(q)))}
export function compareVillages(leftId,rightId){const left=getVillage(leftId),right=getVillage(rightId);if(leftId===rightId)return {duplicate:true,left,right,rows:[],observationCount:left.observations.length};return {duplicate:false,left,right,observationCount:left.observations.length+right.observations.length,rows:comparisonDimensions.map(c=>({id:c.id,label:c.label,left:{text:left.facts[c.id],evidence:left.observations.filter(o=>o.category===c.id)},right:{text:right.facts[c.id],evidence:right.observations.filter(o=>o.category===c.id)}}))}}
export function buildDesignGuide(villageId,projectTypeId){const village=getVillage(villageId),projectType=projectTypes.find(p=>p.id===projectTypeId);if(!projectType)throw new RangeError('Unknown project type: '+projectTypeId);const relevant=(...cats)=>village.observations.filter(o=>cats.includes(o.category));const recommendations=[
  {id:'materials',title:'Materials and envelope',action:`Assess ${village.facts.materials.toLowerCase()} or compatible alternatives against technical feasibility and actual local availability.`,reason:`The synthetic profile records ${village.facts.materials.toLowerCase()}.`,evidence:relevant('materials'),category:'materials',basis:'Synthetic village observations'},
  {id:'roof',title:'Roof and precipitation',action:`Study the ${village.facts.roof.toLowerCase()} pattern together with appropriate water-shedding details.`,reason:`The synthetic profile records a ${village.facts.roof.toLowerCase()} pattern.`,evidence:relevant('roof'),category:'roof',basis:'Synthetic village observations'},
  {id:'layout',title:'Open space and settlement',action:`Test the project layout against the recorded settlement pattern (${village.facts.settlement.toLowerCase()}) and courtyard type (${village.facts.courtyard.toLowerCase()}).`,reason:'These courtyard and settlement patterns are recorded in the synthetic collection; suitability for a real project remains to be investigated.',evidence:relevant('courtyard','settlement'),category:'settlement',basis:'Synthetic village observations'},
  {id:'project',title:'The project brief',action:projectType.action,reason:projectType.reason,evidence:[],category:'courtyard',basis:'Selected project type · not a village observation'},
];return {village,projectType,recommendations,evidenceCount:new Set(recommendations.flatMap(r=>r.evidence.map(o=>o.id))).size,notice:'Rule-based teaching prompts, not adopted guidance, a performance assessment or permission to build.'}}
export function observationIndex(villageId){const v=getVillage(villageId);return categories.map(c=>({...c,count:v.observations.filter(o=>o.category===c.id).length}))}
