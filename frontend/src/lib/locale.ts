const statusLabels: Record<string, string> = {
  new: 'Problema raportata',
  ai_analyzed: 'Problema activa',
  duplicate_detected: 'Posibil duplicat',
  in_review: 'Problema activa',
  in_progress: 'In lucru',
  mission_created: 'Misiune activa',
  resolved: 'Rezolvat',
  issue_resolved: 'Rezolvat',
  rejected: 'Respins',
  active: 'Activa',
  available: 'Disponibil',
  claimed: 'Revendicat',
  locked: 'Blocat',
  sold_out: 'Epuizat',
}

const categoryLabels: Record<string, string> = {
  other: 'alta problema',
  animals: 'animale',
  water_sewer_heating: 'apa, canalizare si termoficare',
  environmental_permits: 'avize si control mediu',
  construction_land: 'constructii si terenuri',
  population_records: 'evidenta persoanelor',
  garages_cemeteries_public_toilets: 'garaje, cimitire si toalete publice',
  public_lighting: 'iluminat public',
  environment_playgrounds_green_spaces:
    'mediu, locuri de joaca si spatii verzi',
  public_order: 'ordine publica',
  owners_associations: 'asociatii de proprietari',
  integrity_issues: 'probleme de integritate',
  employee_integrity_issues: 'integritate referitoare la angajati',
  advertising_commerce: 'publicitate si comert',
  sanitation_pest_snow:
    'salubrizare, dezinsectie, deratizare si deszapezire',
  schools_hospitals: 'scoli si spitale',
  streets_sidewalks: 'strazi si trotuare',
  timpark: 'Timpark',
  road_traffic_signs: 'trafic rutier si semne de circulatie',
  public_transport: 'transport in comun',
  urbanism: 'urbanism',
  website_platform: 'website si platforma de sesizari',
  construction_sites: 'santiere',
  waste: 'deseuri',
  road_damage: 'drum deteriorat',
  broken_lighting: 'iluminat defect',
  lighting: 'iluminat',
  blocked_sidewalk: 'trotuar blocat',
  graffiti: 'graffiti',
  damaged_public_furniture: 'mobilier urban deteriorat',
  green_space_issue: 'spatiu verde',
  green_space: 'spatiu verde',
  accessibility_issue: 'accesibilitate',
  public_safety_concern: 'siguranta publica',
  abandoned_object: 'obiect abandonat',
  water_issue: 'problema cu apa',
  public_transport_issue: 'transport public',
}

const severityLabels: Record<string, string> = {
  low: 'scazuta',
  medium: 'medie',
  high: 'ridicata',
  critical: 'critica',
  urgent: 'urgenta',
}

const actorLabels: Record<string, string> = {
  citizen: 'cetateni',
  community: 'comunitate',
  city_hall: 'primarie',
  private_company: 'companie privata',
  emergency: 'servicii de urgenta',
  unknown: 'neclar',
  community_and_city_hall: 'comunitate si primarie',
}

const rankLabels: Record<string, string> = {
  'New Citizen': 'Cetatean nou',
  'Civic Rookie': 'Incepator civic',
  'Neighborhood Helper': 'Ajutor de cartier',
  'Community Builder': 'Constructor de comunitate',
  'City Guardian': 'Gardianul orasului',
  'Civic Hero': 'Erou civic',
  'Urban Legend': 'Legenda urbana',
}

const badgeLabels: Record<string, string> = {
  'First Reporter': 'Primul raportor',
  'AI Scout': 'Cercetas AI',
  'Clean-up Hero': 'Erou la curatenie',
  'Before/After Hero': 'Erou inainte/dupa',
  'Problem Solver': 'Rezolvator de probleme',
  'Trusted Reporter': 'Raportor de incredere',
  'Zone Champion': 'Campion de zona',
}

const rewardLabels: Record<string, string> = {
  'Civic Points starter boost': 'Bonus de start cu puncte civice',
  'First Reporter achievement card': 'Card de reusita Primul raportor',
  'Neighborhood Helper progress': 'Progres Ajutor de cartier',
  'Zone Champion title preview': 'Preview titlu Campion de zona',
  'Free cappuccino': 'Cappuccino gratuit',
  'Free day pass': 'Abonament gratuit pe o zi',
  '15% bookstore discount': 'Reducere 15% la librarie',
  'Free dessert': 'Desert gratuit',
  'Coworking day ticket': 'Bilet de o zi la coworking',
  'Mission Hero weekend boost': 'Bonus de weekend Erou de misiune',
  'Before/After impact card': 'Card de impact inainte/dupa',
  'Team cleanup coffee tray': 'Tava de cafea pentru echipa',
  'Civic notebook pack': 'Pachet de carnetele civice',
}

const missionTextLabels: Record<string, string> = {
  'Clean-up Mehala park edge': 'Curatenie la marginea parcului Mehala',
  'Community clean-up for the Mehala park edge reported in the live map.':
    'Curatenie comunitara pentru marginea parcului din Mehala, raportata pe harta live.',
  'Safe route Soarelui sidewalk sprint':
    'Sprint pentru trotuarul sigur din Soarelui',
  'Volunteers and the city team clear the blocked sidewalk on a school route.':
    'Voluntarii si echipa orasului elibereaza trotuarul blocat de pe traseul spre scoala.',
  'Fabric lighting safety walk': 'Tur de siguranta pentru iluminatul din Fabric',
  'Evening safety walk to document broken lighting and confirm repair spots.':
    'Tur de siguranta seara pentru documentarea iluminatului defect si confirmarea punctelor care trebuie reparate.',
  'Temporary reward matching verification mission.':
    'Misiune temporara pentru verificarea potrivirii recompensei.',
}

const pointReasonLabels: Record<string, string> = {
  'Valid report': 'Raport valid',
  'AI accepted report': 'Raport acceptat de AI',
}

const agentNameLabels: Record<string, string> = {
  'Vision Agent': 'Verificare foto',
  'Triage Agent': 'Triere',
  'Duplicate Agent': 'Verificare duplicate',
  'Mission Agent': 'Misiune',
  'Reward Agent': 'Puncte si recompense',
  'City Agent': 'Harta live',
}

const humanizedLabels: Record<string, string> = {
  Waste: 'deseuri',
  Other: 'alta problema',
  other: 'alta problema',
  Animals: 'animale',
  animals: 'animale',
  'Water Sewer Heating': 'apa, canalizare si termoficare',
  'water sewer heating': 'apa, canalizare si termoficare',
  'Environmental Permits': 'avize si control mediu',
  'environmental permits': 'avize si control mediu',
  'Construction Land': 'constructii si terenuri',
  'construction land': 'constructii si terenuri',
  'Population Records': 'evidenta persoanelor',
  'population records': 'evidenta persoanelor',
  'Garages Cemeteries Public Toilets': 'garaje, cimitire si toalete publice',
  'garages cemeteries public toilets': 'garaje, cimitire si toalete publice',
  'Public Lighting': 'iluminat public',
  'public lighting': 'iluminat public',
  'Environment Playgrounds Green Spaces':
    'mediu, locuri de joaca si spatii verzi',
  'environment playgrounds green spaces':
    'mediu, locuri de joaca si spatii verzi',
  'Public Order': 'ordine publica',
  'public order': 'ordine publica',
  'Owners Associations': 'asociatii de proprietari',
  'owners associations': 'asociatii de proprietari',
  'Integrity Issues': 'probleme de integritate',
  'integrity issues': 'probleme de integritate',
  'Employee Integrity Issues': 'integritate referitoare la angajati',
  'employee integrity issues': 'integritate referitoare la angajati',
  'Advertising Commerce': 'publicitate si comert',
  'advertising commerce': 'publicitate si comert',
  'Sanitation Pest Snow': 'salubrizare, dezinsectie, deratizare si deszapezire',
  'sanitation pest snow': 'salubrizare, dezinsectie, deratizare si deszapezire',
  'Schools Hospitals': 'scoli si spitale',
  'schools hospitals': 'scoli si spitale',
  'Streets Sidewalks': 'strazi si trotuare',
  'streets sidewalks': 'strazi si trotuare',
  Timpark: 'Timpark',
  timpark: 'Timpark',
  'Road Traffic Signs': 'trafic rutier si semne de circulatie',
  'road traffic signs': 'trafic rutier si semne de circulatie',
  'Public Transport': 'transport in comun',
  'public transport': 'transport in comun',
  Urbanism: 'urbanism',
  urbanism: 'urbanism',
  'Website Platform': 'website si platforma de sesizari',
  'website platform': 'website si platforma de sesizari',
  'Construction Sites': 'santiere',
  'construction sites': 'santiere',
  waste: 'deseuri',
  'Road Damage': 'drum deteriorat',
  'road damage': 'drum deteriorat',
  'Broken Lighting': 'iluminat defect',
  'broken lighting': 'iluminat defect',
  'Blocked Sidewalk': 'trotuar blocat',
  'blocked sidewalk': 'trotuar blocat',
  Graffiti: 'graffiti',
  graffiti: 'graffiti',
  'Damaged Public Furniture': 'mobilier urban deteriorat',
  'damaged public furniture': 'mobilier urban deteriorat',
  'Green Space Issue': 'spatiu verde',
  'green space issue': 'spatiu verde',
  'Accessibility Issue': 'accesibilitate',
  'accessibility issue': 'accesibilitate',
  'Public Safety Concern': 'siguranta publica',
  'public safety concern': 'siguranta publica',
  'Abandoned Object': 'obiect abandonat',
  'abandoned object': 'obiect abandonat',
  'Water Issue': 'problema cu apa',
  'water issue': 'problema cu apa',
  'Public Transport Issue': 'transport public',
  'public transport issue': 'transport public',
  Citizen: 'cetateni',
  citizen: 'cetateni',
  Community: 'comunitate',
  community: 'comunitate',
  'City Hall': 'primarie',
  'city hall': 'primarie',
  'Private Company': 'companie privata',
  'private company': 'companie privata',
  Emergency: 'servicii de urgenta',
  emergency: 'servicii de urgenta',
  Unknown: 'neclar',
  unknown: 'neclar',
  'Community And City Hall': 'comunitate si primarie',
  'community and city hall': 'comunitate si primarie',
}

function fallbackLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function roStatus(value: string | null | undefined, fallback = 'Necunoscut') {
  if (!value) {
    return fallback
  }

  return statusLabels[value] ?? fallbackLabel(value)
}

export function roCategory(value: string | null | undefined, fallback = 'problema') {
  if (!value) {
    return fallback
  }

  return categoryLabels[value] ?? value.replaceAll('_', ' ')
}

export function roSeverity(value: string | null | undefined, fallback = 'medie') {
  if (!value) {
    return fallback
  }

  return severityLabels[value] ?? value.replaceAll('_', ' ')
}

export function roActor(value: string | null | undefined, fallback = 'neclar') {
  if (!value) {
    return fallback
  }

  return actorLabels[value] ?? value.replaceAll('_', ' ')
}

export function roRank(value: string | null | undefined) {
  return value ? rankLabels[value] ?? value : ''
}

export function roBadge(value: string | null | undefined) {
  return value ? badgeLabels[value] ?? value : ''
}

export function roReward(value: string | null | undefined) {
  return value ? rewardLabels[value] ?? value : ''
}

export function roMissionText(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  const translated = (missionTextLabels[value] ?? value)
    .replace(/^Clean-up (.+)$/, 'Curatenie in $1')

  return Object.entries(humanizedLabels)
    .sort(([first], [second]) => second.length - first.length)
    .reduce(
      (message, [english, romanian]) => message.replaceAll(english, romanian),
      translated,
    )
}

export function roPointReason(value: string | null | undefined) {
  return value ? pointReasonLabels[value] ?? value : ''
}

export function roAgentName(value: string | null | undefined) {
  return value ? agentNameLabels[value] ?? value : ''
}

export function roAgentMessage(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  const translated = value
    .replace(/^Fallback spotted a (.+) issue\.$/, 'Fallback-ul a identificat o problema de tip $1.')
    .replace(/^Spotted a (.+) issue from the photo\.$/, 'A identificat din poza o problema de tip $1.')
    .replace(/^Fallback routed this to (.+)\.$/, 'Fallback-ul a directionat cazul catre $1.')
    .replace(/^Found who can help: (.+)\.$/, 'A gasit cine poate ajuta: $1.')
    .replace(/^Checked nearby reports: no duplicate found\.$/, 'A verificat rapoartele din apropiere: nu a gasit duplicat.')
    .replace(/^Possible duplicate detected nearby\.$/, 'A detectat un posibil duplicat in apropiere.')
    .replace(/^Created (.+)\.$/, 'A creat misiunea $1.')
    .replace(/^Matched (.+)\.$/, 'A potrivit recompensa $1.')

  return Object.entries(humanizedLabels)
    .sort(([first], [second]) => second.length - first.length)
    .reduce(
      (message, [english, romanian]) => message.replaceAll(english, romanian),
      translated,
    )
}
