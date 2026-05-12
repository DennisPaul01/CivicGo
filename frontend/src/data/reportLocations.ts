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
    address: 'Student area near Bulevardul Eroilor',
    latitude: 45.7531,
    longitude: 21.2325,
  },
  {
    id: 'girocului',
    name: 'Girocului',
    address: 'Residential streets near Strada Martirilor',
    latitude: 45.7339,
    longitude: 21.2114,
  },
  {
    id: 'fabric',
    name: 'Fabric',
    address: 'Historic neighborhood near Piata Traian',
    latitude: 45.7603,
    longitude: 21.2422,
  },
  {
    id: 'soarelui',
    name: 'Soarelui',
    address: 'Green spaces near Calea Martirilor',
    latitude: 45.7366,
    longitude: 21.2468,
  },
  {
    id: 'mehala',
    name: 'Mehala',
    address: 'Historic west-side area near Piata Avram Iancu',
    latitude: 45.772,
    longitude: 21.2022,
  },
  {
    id: 'iosefin',
    name: 'Iosefin',
    address: 'Historic neighborhood near Gara de Nord and Bega',
    latitude: 45.7458,
    longitude: 21.2079,
  },
  {
    id: 'elisabetin',
    name: 'Elisabetin',
    address: 'Heritage streets near Piata Balcescu',
    latitude: 45.7438,
    longitude: 21.2223,
  },
  {
    id: 'cetate',
    name: 'Cetate',
    address: 'Central district around Piata Unirii and Piata Victoriei',
    latitude: 45.7568,
    longitude: 21.2287,
  },
  {
    id: 'aradului',
    name: 'Aradului',
    address: 'North-side corridor near Calea Aradului',
    latitude: 45.7774,
    longitude: 21.222,
  },
  {
    id: 'circumvalatiunii',
    name: 'Circumvalatiunii',
    address: 'Dense residential area west of the city center',
    latitude: 45.7595,
    longitude: 21.2095,
  },
  {
    id: 'torontalului',
    name: 'Torontalului',
    address: 'Northern residential area near Calea Torontalului',
    latitude: 45.7818,
    longitude: 21.2068,
  },
  {
    id: 'buziasului',
    name: 'Buziasului',
    address: 'Southeast area near Calea Buziasului',
    latitude: 45.7418,
    longitude: 21.2686,
  },
  {
    id: 'fratelia',
    name: 'Fratelia',
    address: 'Southern neighborhood near Calea Sagului',
    latitude: 45.7248,
    longitude: 21.2024,
  },
  {
    id: 'steaua',
    name: 'Steaua',
    address: 'Southwest residential area near Calea Sagului',
    latitude: 45.7364,
    longitude: 21.1887,
  },
  {
    id: 'bucovina',
    name: 'Bucovina',
    address: 'Northwest residential area near Strada Bucovinei',
    latitude: 45.7711,
    longitude: 21.2142,
  },
  {
    id: 'lipovei',
    name: 'Lipovei',
    address: 'Northeast area near Calea Lipovei',
    latitude: 45.7734,
    longitude: 21.2424,
  },
  {
    id: 'umt',
    name: 'UMT',
    address: 'Eastern area near industrial and residential streets',
    latitude: 45.7637,
    longitude: 21.2681,
  },
  {
    id: 'dambovita',
    name: 'Dambovita',
    address: 'Southwest area near Bulevardul Dambovita',
    latitude: 45.7372,
    longitude: 21.201,
  },
]
