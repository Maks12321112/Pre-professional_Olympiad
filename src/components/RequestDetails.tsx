import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { format } from 'date-fns';
import type { Request } from '../types/database.types';
import PriceChart from './PriceChart';

type RequestDetailsProps = {
  request: Request & {
    category?: { name: string };
    equipment?: { name: string; quantity: number };
  };
  isOpen: boolean;
  onClose: () => void;
};

export default function RequestDetails({ request, isOpen, onClose }: RequestDetailsProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  Детали заявки
                </Dialog.Title>

                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Статус</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                        'bg-red-100 text-red-800'}`}
                    >
                      {request.status === 'pending' ? 'На рассмотрении' :
                       request.status === 'approved' ? 'Одобрено' :
                       'Отклонено'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Тип</h4>
                    <p className="text-gray-900">
                      {request.type === 'item' ? 'Новое оборудование' :
                       request.type === 'repair' ? 'Ремонт/Замена' :
                       request.type === 'purchase' ? 'Закупка' :
                       'Новая категория'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Наименование</h4>
                    <p className="text-gray-900">{request.name}</p>
                  </div>

                  {request.description && (
                    <div>
                      <h4 className="font-medium text-gray-700">Описание</h4>
                      <p className="text-gray-900">{request.description}</p>
                    </div>
                  )}

                  {request.quantity && (
                    <div>
                      <h4 className="font-medium text-gray-700">Количество</h4>
                      <p className="text-gray-900">{request.quantity}</p>
                    </div>
                  )}

                  {request.category?.name && (
                    <div>
                      <h4 className="font-medium text-gray-700">Категория</h4>
                      <p className="text-gray-900">{request.category.name}</p>
                    </div>
                  )}

                  {request.equipment && (
                    <div>
                      <h4 className="font-medium text-gray-700">Оборудование</h4>
                      <p className="text-gray-900">
                        {request.equipment.name} ({request.equipment.quantity} в наличии)
                      </p>
                    </div>
                  )}

                  {request.type === 'purchase' && (
                    <>
                      {request.best_price && (
                        <div>
                          <h4 className="font-medium text-gray-700">Цена</h4>
                          <p className="text-gray-900">{request.best_price.toLocaleString('ru-RU')} ₽</p>
                        </div>
                      )}

                      {request.seller && (
                        <div>
                          <h4 className="font-medium text-gray-700">Продавец</h4>
                          <p className="text-gray-900">{request.seller}</p>
                        </div>
                      )}

                      {request.purchase_url && (
                        <div>
                          <h4 className="font-medium text-gray-700">Ссылка на товар</h4>
                          <a
                            href={request.purchase_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Посмотреть товар
                          </a>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium text-gray-700">История цен</h4>
                        <PriceChart requestId={request.id} />
                      </div>
                    </>
                  )}

                  <div>
                    <h4 className="font-medium text-gray-700">Создано</h4>
                    <p className="text-gray-900">
                      {format(new Date(request.created_at), 'dd.MM.yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    onClick={onClose}
                  >
                    Закрыть
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}