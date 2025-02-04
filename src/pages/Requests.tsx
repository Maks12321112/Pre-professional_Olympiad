import { useState, useEffect, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Dialog, Transition } from '@headlessui/react';
import { format, differenceInMinutes } from 'date-fns';
import type { RequestType, Equipment } from '../types/database.types';

type MarketplaceLink = {
  url: string;
  seller: string;
};

export default function Requests() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [requestType, setRequestType] = useState<RequestType>('item');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [categoryId, setCategoryId] = useState<string>('');
  const [equipmentId, setEquipmentId] = useState<string>('');
  const [bestPrice, setBestPrice] = useState<number | null>(null);
  const [seller, setSeller] = useState('');
  const [purchaseUrl, setPurchaseUrl] = useState('');
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);
  const queryClient = useQueryClient();

  const marketplaceLinks: MarketplaceLink[] = [
    {
      url: `https://market.yandex.ru/search?text=${encodeURIComponent(name)}`,
      seller: 'Яндекс.Маркет'
    },
    {
      url: `https://www.ozon.ru/search/?text=${encodeURIComponent(name)}`,
      seller: 'Ozon'
    },
    {
      url: `https://www.wildberries.ru/catalog/0/search.aspx?search=${encodeURIComponent(name)}`,
      seller: 'Wildberries'
    },
    {
      url: `https://www.avito.ru/all?q=${encodeURIComponent(name)}`,
      seller: 'Avito'
    }
  ];

  const { data: requests, isLoading } = useQuery({
    queryKey: ['requests', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          category:category_id (
            name
          ),
          equipment:equipment_id (
            name,
            quantity
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    refetchInterval: 5000
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: equipment } = useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('status', 'in_use')
        .order('name');
      
      if (error) throw error;
      return data as Equipment[];
    }
  });

  // Cleanup processed requests
  useEffect(() => {
    const cleanupRequests = async () => {
      if (!requests) return;

      const processedRequests = requests.filter(
        request => 
          (request.status === 'approved' || request.status === 'rejected') &&
          differenceInMinutes(new Date(), new Date(request.updated_at)) >= 5
      );

      if (processedRequests.length > 0) {
        const { error } = await supabase
          .from('requests')
          .delete()
          .in('id', processedRequests.map(r => r.id));

        if (!error) {
          queryClient.invalidateQueries({ queryKey: ['requests', user?.id] });
        }
      }
    };

    cleanupRequests();
  }, [requests, user?.id, queryClient]);

  // Show notifications for newly processed requests
  useEffect(() => {
    if (!requests) return;

    const processedRequests = requests.filter(
      request => 
        (request.status === 'approved' || request.status === 'rejected') &&
        differenceInMinutes(new Date(), new Date(request.updated_at)) < 5
    );

    processedRequests.forEach(request => {
      const notificationId = `${request.id}-${request.status}`;
      const existingNotification = notifications.find(n => n.id === notificationId);

      if (!existingNotification) {
        const message = request.status === 'approved'
          ? `Ваша заявка "${request.name}" была одобрена!`
          : `Ваша заявка "${request.name}" была отклонена.`;

        setNotifications(prev => [
          ...prev,
          {
            id: notificationId,
            message,
            type: request.status === 'approved' ? 'success' : 'error'
          }
        ]);

        // Remove notification after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notificationId));
        }, 5000);
      }
    });
  }, [requests]);

  const createRequest = useMutation({
    mutationFn: async (request: {
      type: RequestType;
      name: string;
      description?: string;
      quantity?: number;
      category_id?: string;
      equipment_id?: string;
      user_id: string;
      best_price?: number;
      seller?: string;
      purchase_url?: string;
    }) => {
      const { error } = await supabase
        .from('requests')
        .insert([{ ...request, status: 'pending' }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests', user?.id] });
      setIsOpen(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setQuantity(1);
    setRequestType('item');
    setCategoryId('');
    setEquipmentId('');
    setBestPrice(null);
    setSeller('');
    setPurchaseUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if ((requestType === 'item' || requestType === 'purchase') && !categoryId) {
      alert('Пожалуйста, выберите категорию');
      return;
    }

    if (requestType === 'repair' && !equipmentId) {
      alert('Пожалуйста, выберите оборудование для ремонта/замены');
      return;
    }

    const selectedEquipment = equipment?.find(e => e.id === equipmentId);
    if (requestType === 'repair' && selectedEquipment && quantity > selectedEquipment.quantity) {
      alert(`Нельзя запросить больше единиц, чем имеется в наличии (${selectedEquipment.quantity})`);
      return;
    }

    createRequest.mutate({
      type: requestType,
      name: requestType === 'repair' ? selectedEquipment?.name || '' : name,
      description,
      quantity: requestType !== 'category' ? quantity : undefined,
      category_id: (requestType === 'item' || requestType === 'purchase') ? categoryId : undefined,
      equipment_id: requestType === 'repair' ? equipmentId : undefined,
      user_id: user.id,
      best_price: bestPrice || undefined,
      seller: seller || undefined,
      purchase_url: purchaseUrl || undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`p-4 rounded-md shadow-lg ${
              notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Мои заявки</h1>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Новая заявка
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : !user ? (
        <p className="text-center text-gray-500">Пожалуйста, войдите в систему для просмотра заявок</p>
      ) : requests?.length === 0 ? (
        <p className="text-center text-gray-500">Нет заявок</p>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {requests?.map((request) => {
              const isProcessed = request.status === 'approved' || request.status === 'rejected';
              const processedTime = isProcessed ? differenceInMinutes(new Date(), new Date(request.updated_at)) : null;
              const timeLeft = processedTime !== null ? 5 - processedTime : null;

              return (
                <li key={request.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-gray-900">
                          {request.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {request.type === 'item' ? (
                            <>
                              Новое оборудование
                              {request.category && (
                                <span className="ml-2 text-gray-400">
                                  в категории {request.category.name}
                                </span>
                              )}
                            </>
                          ) : request.type === 'repair' ? (
                            <>
                              Заявка на ремонт/замену
                              {request.equipment && (
                                <span className="ml-2 text-gray-400">
                                  для {request.equipment.name}
                                </span>
                              )}
                            </>
                          ) : request.type === 'purchase' ? (
                            <>
                              Заявка на закупку
                              {request.best_price && (
                                <span className="ml-2 text-gray-400">
                                  {request.best_price.toLocaleString('ru-RU')} ₽
                                </span>
                              )}
                              {request.category && (
                                <span className="ml-2 text-gray-400">
                                  в категории {request.category.name}
                                </span>
                              )}
                            </>
                          ) : (
                            'Новая категория'
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                            'bg-red-100 text-red-800'}`}
                        >
                          {request.status === 'pending' ? 'На рассмотрении' :
                           request.status === 'approved' ? 'Одобрено' :
                           'Отклонено'}
                        </span>
                        {timeLeft !== null && timeLeft > 0 && (
                          <span className="text-xs text-gray-500">
                            Удаление через {timeLeft} мин
                          </span>
                        )}
                      </div>
                    </div>
                    {request.description && (
                      <p className="mt-2 text-sm text-gray-500">{request.description}</p>
                    )}
                    {request.quantity && (
                      <p className="mt-1 text-sm text-gray-500">Количество: {request.quantity}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      {format(new Date(request.created_at), 'dd.MM.yyyy HH:mm')}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Request Form Dialog */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Новая заявка
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Тип заявки
                      </label>
                      <select
                        value={requestType}
                        onChange={(e) => {
                          setRequestType(e.target.value as RequestType);
                          setCategoryId('');
                          setEquipmentId('');
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300"
                      >
                        <option value="item">Новое оборудование</option>
                        <option value="category">Новая категория</option>
                        <option value="repair">Ремонт/Замена</option>
                        <option value="purchase">Закупка</option>
                      </select>
                    </div>

                    {requestType === 'repair' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Выберите оборудование для ремонта/замены
                        </label>
                        <select
                          value={equipmentId}
                          onChange={(e) => {
                            setEquipmentId(e.target.value);
                            const selectedEquipment = equipment?.find(eq => eq.id === e.target.value);
                            if (selectedEquipment) {
                              setQuantity(Math.min(quantity, selectedEquipment.quantity));
                            }
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300"
                          required
                        >
                          <option value="">Выберите оборудование</option>
                          {equipment?.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.quantity} в наличии)
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (requestType === 'item' || requestType === 'purchase') ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Категория
                        </label>
                        <select
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300"
                          required
                        >
                          <option value="">Выберите категорию</option>
                          {categories?.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}

                    {requestType !== 'repair' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Наименование
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Описание
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300"
                      />
                    </div>

                    {requestType !== 'category' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Количество
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={requestType === 'repair' && equipmentId ? 
                            equipment?.find(e => e.id === equipmentId)?.quantity : 
                            undefined}
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value))}
                          className="mt-1 block w-full rounded-md border-gray-300"
                          required
                        />
                        {requestType === 'repair' && equipmentId && (
                          <p className="mt-1 text-sm text-gray-500">
                            Максимум: {equipment?.find(e => e.id === equipmentId)?.quantity} шт.
                          </p>
                        )}
                      </div>
                    )}

                    {requestType === 'purchase' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Лучшая найденная цена (₽)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={bestPrice || ''}
                            onChange={(e) => setBestPrice(parseFloat(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Продавец
                          </label>
                          <input
                            type="text"
                            value={seller}
                            onChange={(e) => setSeller(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Ссылка на товар
                          </label>
                          <input
                            type="url"
                            value={purchaseUrl}
                            onChange={(e) => setPurchaseUrl(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300"
                            placeholder="https://"
                          />
                        </div>

                        {name && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Поиск на популярных маркетплейсах
                            </label>
                            <div className="space-y-2">
                              {marketplaceLinks.map((link, index) => (
                                <a
                                  key={index}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md border border-blue-200"
                                >
                                  Искать на {link.seller}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Отмена
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                      >
                        Отправить
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}