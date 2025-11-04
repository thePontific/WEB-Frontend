import type { Star } from '../types'

export const STARS_MOCK: Star[] = [
  {
    ID: 1,
    Title: "Альфа Андромеды",
    Distance: 97,
    StarType: "Гигант",
    Magnitude: 2.06,
    Description: "Ярчайшая звезда в созвездии Андромеды",
    Mass: 3.8,
    Temperature: 13000,
    DiscoveryDate: "Древность",
    ImageName: "alpha_andromedae.jpg"
  },
  {
    ID: 2,
    Title: "Бета Андромеды", 
    Distance: 199,
    StarType: "Гигант",
    Magnitude: 2.07,
    Description: "Красный гигант в созвездии Андромеды",
    Mass: 4.5,
    Temperature: 3500,
    DiscoveryDate: "Древность",
    ImageName: "beta_andromedae.jpg"
  },
  {
    ID: 3,
    Title: "Гамма Андромеды",
    Distance: 355,
    StarType: "Двойная",
    Magnitude: 2.1,
    Description: "Двойная звездная система",
    Mass: 6.0,
    Temperature: 12000,
    DiscoveryDate: "1778", 
    ImageName: "gamma_andromedae.jpg"
  }
];