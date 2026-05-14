export type ReportLocation = {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  precision?: 'area' | 'exact'
  zoneName?: string
}

export const reportLocations: ReportLocation[] = [
  {
    id: 'complex',
    name: 'Complex',
    address: 'Zona studenteasca langa Bulevardul Eroilor',
    latitude: 45.7531,
    longitude: 21.2325,
  },
  {
    id: 'girocului',
    name: 'Girocului',
    address: 'Strazi rezidentiale langa Strada Martirilor',
    latitude: 45.7339,
    longitude: 21.2114,
  },
  {
    id: 'fabric',
    name: 'Fabric',
    address: 'Cartier istoric langa Piata Traian',
    latitude: 45.7603,
    longitude: 21.2422,
  },
  {
    id: 'soarelui',
    name: 'Soarelui',
    address: 'Spatii verzi langa Calea Martirilor',
    latitude: 45.7366,
    longitude: 21.2468,
  },
  {
    id: 'mehala',
    name: 'Mehala',
    address: 'Zona istorica de vest langa Piata Avram Iancu',
    latitude: 45.772,
    longitude: 21.2022,
  },
  {
    id: 'iosefin',
    name: 'Iosefin',
    address: 'Cartier istoric langa Gara de Nord si Bega',
    latitude: 45.7458,
    longitude: 21.2079,
  },
  {
    id: 'elisabetin',
    name: 'Elisabetin',
    address: 'Strazi istorice langa Piata Balcescu',
    latitude: 45.7438,
    longitude: 21.2223,
  },
  {
    id: 'cetate',
    name: 'Cetate',
    address: 'Cartier central intre Piata Unirii si Piata Victoriei',
    latitude: 45.7568,
    longitude: 21.2287,
  },
  {
    id: 'aradului',
    name: 'Aradului',
    address: 'Coridor nordic langa Calea Aradului',
    latitude: 45.7774,
    longitude: 21.222,
  },
  {
    id: 'circumvalatiunii',
    name: 'Circumvalatiunii',
    address: 'Zona rezidentiala densa la vest de centru',
    latitude: 45.7595,
    longitude: 21.2095,
  },
  {
    id: 'torontalului',
    name: 'Torontalului',
    address: 'Zona rezidentiala nordica langa Calea Torontalului',
    latitude: 45.7818,
    longitude: 21.2068,
  },
  {
    id: 'buziasului',
    name: 'Buziasului',
    address: 'Zona sud-estica langa Calea Buziasului',
    latitude: 45.7418,
    longitude: 21.2686,
  },
  {
    id: 'fratelia',
    name: 'Fratelia',
    address: 'Cartier sudic langa Calea Sagului',
    latitude: 45.7248,
    longitude: 21.2024,
  },
  {
    id: 'steaua',
    name: 'Steaua',
    address: 'Zona rezidentiala sud-vestica langa Calea Sagului',
    latitude: 45.7364,
    longitude: 21.1887,
  },
  {
    id: 'bucovina',
    name: 'Bucovina',
    address: 'Zona rezidentiala nord-vestica langa Strada Bucovinei',
    latitude: 45.7711,
    longitude: 21.2142,
  },
  {
    id: 'lipovei',
    name: 'Lipovei',
    address: 'Zona nord-estica langa Calea Lipovei',
    latitude: 45.7734,
    longitude: 21.2424,
  },
  {
    id: 'umt',
    name: 'UMT',
    address: 'Zona estica langa strazi industriale si rezidentiale',
    latitude: 45.7637,
    longitude: 21.2681,
  },
  {
    id: 'dambovita',
    name: 'Dambovita',
    address: 'Zona sud-vestica langa Bulevardul Dambovita',
    latitude: 45.7372,
    longitude: 21.201,
  },
]
