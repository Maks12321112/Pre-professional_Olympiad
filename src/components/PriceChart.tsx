import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

type PriceHistory = {
  id: string;
  request_id: string;
  price: number;
  seller: string;
  recorded_at: string;
};

export default function PriceChart({ requestId }: { requestId: string }) {
  const { data: priceHistory, isLoading } = useQuery({
    queryKey: ['price-history', requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('request_id', requestId)
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      return data as PriceHistory[];
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!priceHistory?.length) {
    return (
      <div className="text-center text-gray-500">
        No price history available
      </div>
    );
  }

  const chartData = priceHistory.map(record => ({
    date: format(new Date(record.recorded_at), 'dd.MM.yy'),
    price: record.price,
    seller: record.seller
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            name="Цена"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}