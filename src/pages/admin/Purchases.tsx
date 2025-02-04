import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import type { Request } from '../../types/database.types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import PurchaseDetails from '../../components/PurchaseDetails';

export default function AdminPurchases() {
  const [showAll, setShowAll] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Request | null>(null);
  const queryClient = useQueryClient();

  const { data: approvedPurchases, isLoading } = useQuery({
    queryKey: ['approved-purchases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('type', 'purchase')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Request[];
    }
  });

  // Add mutation for updating purchase status
  const updatePurchaseStatus = useMutation({
    mutationFn: async ({ requestId, bought }: { requestId: string; bought: boolean }) => {
      const { error } = await supabase
        .from('requests')
        .update({ bought })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approved-purchases'] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Calculate total cost
  const totalCost = approvedPurchases?.reduce((sum, purchase) => {
    return sum + (purchase.best_price || 0) * (purchase.quantity || 1);
  }, 0);

  // Prepare data for the chart
  const chartData = approvedPurchases?.map(purchase => ({
    name: purchase.name,
    total: (purchase.best_price || 0) * (purchase.quantity || 1),
    unitPrice: purchase.best_price || 0,
    quantity: purchase.quantity || 1
  })) || [];

  // Get displayed purchases
  const displayedPurchases = showAll ? approvedPurchases : approvedPurchases?.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Approved Purchases</h1>
        {totalCost !== undefined && (
          <div className="text-lg font-semibold text-gray-700">
            Total Cost: {totalCost.toLocaleString('ru-RU')} ₽
          </div>
        )}
      </div>

      {/* Cost Visualization */}
      {chartData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Purchase Costs Overview</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `${value.toLocaleString('ru-RU')} ₽`}
                />
                <Legend />
                <Bar 
                  dataKey="total" 
                  fill="#3b82f6" 
                  name="Общая сумма"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {approvedPurchases?.length === 0 ? (
        <p className="text-center text-gray-500">No approved purchase requests</p>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seller
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Link
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedPurchases?.map((purchase) => (
                <tr 
                  key={purchase.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedPurchase(purchase)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {purchase.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.best_price?.toLocaleString('ru-RU')} ₽
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {((purchase.best_price || 0) * (purchase.quantity || 1)).toLocaleString('ru-RU')} ₽
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.seller || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    {purchase.purchase_url ? (
                      <a
                        href={purchase.purchase_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Item
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${purchase.bought ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                    >
                      {purchase.bought ? 'Bought' : 'Not Bought'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(purchase.created_at), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {approvedPurchases && approvedPurchases.length > 3 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showAll ? 'Show Less' : `Show ${approvedPurchases.length - 3} More`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Purchase Details Dialog */}
      {selectedPurchase && (
        <PurchaseDetails
          purchase={selectedPurchase}
          isOpen={!!selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
          onStatusChange={(bought) => {
            updatePurchaseStatus.mutate({ 
              requestId: selectedPurchase.id, 
              bought 
            });
            setSelectedPurchase(prev => prev ? { ...prev, bought } : null);
          }}
        />
      )}
    </div>
  );
}