import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { format } from 'date-fns';
import type { Request } from '../types/database.types';
import PriceChart from './PriceChart';

type PurchaseDetailsProps = {
  purchase: Request;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (bought: boolean) => void;
};

export default function PurchaseDetails({ purchase, isOpen, onClose, onStatusChange }: PurchaseDetailsProps) {
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
                  Purchase Details
                </Dialog.Title>

                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Status</h4>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${purchase.bought ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                      >
                        {purchase.bought ? 'Bought' : 'Not Bought'}
                      </span>
                      <button
                        onClick={() => onStatusChange(!purchase.bought)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Mark as {purchase.bought ? 'Not Bought' : 'Bought'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Item</h4>
                    <p className="text-gray-900">{purchase.name}</p>
                  </div>

                  {purchase.description && (
                    <div>
                      <h4 className="font-medium text-gray-700">Description</h4>
                      <p className="text-gray-900">{purchase.description}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-gray-700">Quantity</h4>
                    <p className="text-gray-900">{purchase.quantity}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Price</h4>
                    <p className="text-gray-900">{purchase.best_price?.toLocaleString('ru-RU')} ₽</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Total Cost</h4>
                    <p className="text-gray-900 font-semibold">
                      {((purchase.best_price || 0) * (purchase.quantity || 1)).toLocaleString('ru-RU')} ₽
                    </p>
                  </div>

                  {purchase.seller && (
                    <div>
                      <h4 className="font-medium text-gray-700">Seller</h4>
                      <p className="text-gray-900">{purchase.seller}</p>
                    </div>
                  )}

                  {purchase.purchase_url && (
                    <div>
                      <h4 className="font-medium text-gray-700">Purchase Link</h4>
                      <a
                        href={purchase.purchase_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Item
                      </a>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-gray-700">Price History</h4>
                    <PriceChart requestId={purchase.id} />
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Created</h4>
                    <p className="text-gray-900">
                      {format(new Date(purchase.created_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    onClick={onClose}
                  >
                    Close
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