import { z } from 'zod';

const priceResultSchema = z.object({
  price: z.number(),
  url: z.string().url(),
  seller: z.string(),
  availability: z.string(),
  location: z.string().optional(),
  shippingCost: z.number().optional(),
  totalPrice: z.number(),
  thumbnail: z.string().optional()
});

type PriceResult = z.infer<typeof priceResultSchema>;

async function getUserLocation(): Promise<{ country: string; region: string } | null> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return {
      country: data.country_name,
      region: data.region
    };
  } catch (error) {
    console.error('Error getting user location:', error);
    return null;
  }
}

export async function findBestPrice(query: string): Promise<PriceResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const location = await getUserLocation();

  // Only the 4 main Russian marketplaces
  return [
    {
      price: 0,
      url: `https://market.yandex.ru/search?text=${encodedQuery}`,
      seller: 'Яндекс.Маркет',
      availability: 'Поиск товара',
      totalPrice: 0,
      location: location ? `${location.region}, ${location.country}` : 'Россия'
    },
    {
      price: 0,
      url: `https://www.ozon.ru/search/?text=${encodedQuery}`,
      seller: 'Ozon',
      availability: 'Поиск товара',
      totalPrice: 0,
      location: location ? `${location.region}, ${location.country}` : 'Россия'
    },
    {
      price: 0,
      url: `https://www.wildberries.ru/catalog/0/search.aspx?search=${encodedQuery}`,
      seller: 'Wildberries',
      availability: 'Поиск товара',
      totalPrice: 0,
      location: location ? `${location.region}, ${location.country}` : 'Россия'
    },
    {
      price: 0,
      url: `https://www.avito.ru/all?q=${encodedQuery}`,
      seller: 'Avito',
      availability: 'Поиск товара',
      totalPrice: 0,
      location: location ? `${location.region}, ${location.country}` : 'Россия'
    }
  ];
}