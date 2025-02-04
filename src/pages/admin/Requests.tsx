import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Request, Equipment } from '../../types/database.types';
import RequestDetails from '../../components/RequestDetails';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function AdminRequests() {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: async () => {
      if (!user || !isAdmin) {
        throw new Error('Unauthorized');
      }

      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          category:category_id (
            name
          ),
          equipment:equipment_id (
            name,
            quantity,
            status,
            category_id
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5); // Only get the 5 most recent requests

      if (error) throw error;
      return data as (Request & { 
        category?: { name: string },
        equipment?: Equipment
      })[];
    },
    enabled: !!user && isAdmin
  });

  const handleRequest = useMutation({
    mutationFn: async ({ id, status, request }: { id: string; status: 'approved' | 'rejected'; request: Request & { equipment?: Equipment } }) => {
      // First update the request status
      const { error: updateError } = await supabase
        .from('requests')
        .update({ status })
        .eq('id', id);

      if (updateError) throw updateError;

      // If approved, handle the request based on its type
      if (status === 'approved') {
        if (request.type === 'repair' && request.equipment_id && request.quantity) {
          // Get the current equipment details to ensure we have the latest data
          const { data: currentEquipment, error: equipmentError } = await supabase
            .from('equipment')
            .select('*')
            .eq('id', request.equipment_id)
            .single();

          if (equipmentError) throw equipmentError;

          // First, decrease the quantity of working items
          const { error: decreaseError } = await supabase
            .from('equipment')
            .update({ 
              quantity: currentEquipment.quantity - request.quantity 
            })
            .eq('id', request.equipment_id)
            .eq('status', 'in_use')
            .gt('quantity', request.quantity - 1);

          if (decreaseError) throw decreaseError;

          // Then create new broken items with the same category
          const { error: createError } = await supabase
            .from('equipment')
            .insert([{
              name: currentEquipment.name,
              description: request.description || `Broken items from ${currentEquipment.name}`,
              quantity: request.quantity,
              category_id: currentEquipment.category_id,
              status: 'broken'
            }]);

          if (createError) throw createError;
        } else if (request.type === 'item') {
          const { error: itemError } = await supabase
            .from('equipment')
            .insert([{
              name: request.name,
              description: request.description,
              quantity: request.quantity,
              category_id: request.category_id,
              status: 'new'
            }]);

          if (itemError) throw itemError;
        } else if (request.type === 'category') {
          const { error: categoryError } = await supabase
            .from('equipment_categories')
            .insert([{
              name: request.name
            }]);

          if (categoryError) throw categoryError;
        } else if (request.type === 'purchase' && request.best_price) {
          // Record the initial price in price history
          const { error: priceHistoryError } = await supabase
            .from('price_history')
            .insert([{
              request_id: request.id,
              price: request.best_price,
              seller: request.seller || 'Unknown'
            }]);

          if (priceHistoryError) throw priceHistoryError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-categories'] });
      queryClient.invalidateQueries({ queryKey: ['approved-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['price-history'] });
    }
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
    setTimeout(() => setIsRefreshing(false), 500); // Show spinner for at least 500ms
  };

  if (!user || !isAdmin) {
    return (
      <div className="text-center text-gray-500 mt-8">
        You don't have permission to view this page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Управление заявками</h1>
        <button
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Обновить
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : requests?.length === 0 ? (
        <p className="text-center text-gray-500">No pending requests</p>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Запрос
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Тип
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Детали
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests?.map((request) => (
                <tr 
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{request.name}</div>
                      {request.description && (
                        <div className="text-gray-500">{request.description}</div>
                      )}
                      {request.quantity && (
                        <div className="text-gray-500">Quantity: {request.quantity}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.type === 'item' ? 'New Item' : 
                     request.type === 'repair' ? 'Repair/Replace' :
                     request.type === 'purchase' ? 'Purchase' :
                     'New Category'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {request.type === 'repair' ? (
                      <div>
                        <p>Item: {request.equipment?.name}</p>
                        <p>Current Quantity: {request.equipment?.quantity}</p>
                        {request.quantity && request.equipment && request.equipment.quantity < request.quantity && (
                          <p className="text-red-500">
                            Not enough items available
                          </p>
                        )}
                      </div>
                    ) : request.type === 'purchase' ? (
                      <div>
                        <p>Price: {request.best_price?.toLocaleString('ru-RU')} ₽</p>
                        <p>Seller: {request.seller}</p>
                      </div>
                    ) : request.category?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.user_id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                        'bg-red-100 text-red-800'}`}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequest.mutate({ 
                              id: request.id, 
                              status: 'approved',
                              request 
                            });
                          }}
                          disabled={
                            request.type === 'repair' && 
                            request.equipment && 
                            request.quantity && 
                            request.equipment.quantity < request.quantity
                          }
                          className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Принять
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequest.mutate({ 
                              id: request.id, 
                              status: 'rejected',
                              request
                            });
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Отклонить
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Request Details Dialog */}
      {selectedRequest && (
        <RequestDetails
          request={selectedRequest}
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}