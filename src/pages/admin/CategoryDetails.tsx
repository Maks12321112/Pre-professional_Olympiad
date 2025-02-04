import { useState, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowLeftIcon, PencilSquareIcon, TrashIcon, ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import type { EquipmentCategory, Equipment } from '../../types/database.types';

type CategoryDetailsProps = {
  category: EquipmentCategory;
  onBack: () => void;
};

export default function CategoryDetails({ category, onBack }: CategoryDetailsProps) {
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemStatus, setNewItemStatus] = useState<Equipment['status']>('new');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemOwner, setNewItemOwner] = useState('');
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Equipment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch equipment items for this category
  const { data: items, isLoading } = useQuery({
    queryKey: ['equipment', category.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('category_id', category.id)
        .order('name');
      
      if (error) throw error;
      return data as Equipment[];
    }
  });

  // Add item mutation
  const addItem = useMutation({
    mutationFn: async (newItem: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('equipment')
        .insert([newItem]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment', category.id] });
      setNewItemName('');
      setNewItemQuantity(1);
      setNewItemStatus('new');
      setNewItemDescription('');
      setNewItemOwner('');
    }
  });

  // Update item mutation
  const updateItem = useMutation({
    mutationFn: async (item: Partial<Equipment> & { id: string }) => {
      const { error } = await supabase
        .from('equipment')
        .update(item)
        .eq('id', item.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment', category.id] });
      setEditingItem(null);
    }
  });

  // Delete item mutation
  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment', category.id] });
      setItemToDelete(null);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim()) {
      addItem.mutate({
        name: newItemName.trim(),
        quantity: newItemQuantity,
        status: newItemStatus,
        description: newItemDescription.trim(),
        owner: newItemOwner.trim(),
        category_id: category.id
      });
    }
  };

  const handleUpdateItem = (item: Equipment) => {
    updateItem.mutate(item);
  };

  const handleDeleteClick = (item: Equipment) => {
    setItemToDelete(item);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteItem.mutate(itemToDelete.id);
    }
  };

  // Filter items based on search query
  const filteredItems = items?.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.owner?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">{category.name}</h1>
      </div>

      {/* Add Item Form */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Add Equipment Item</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Название
            </label>
            <input
              type="text"
              id="name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Описание
            </label>
            <textarea
              id="description"
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300"
            />
          </div>

          <div>
            <label htmlFor="owner" className="block text-sm font-medium text-gray-700">
              Владелец
            </label>
            <input
              type="text"
              id="owner"
              value={newItemOwner}
              onChange={(e) => setNewItemOwner(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300"
              placeholder="Enter owner name"
            />
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
              Кол-во
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300"
              required
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Статус
            </label>
            <select
              id="status"
              value={newItemStatus}
              onChange={(e) => setNewItemStatus(e.target.value as Equipment['status'])}
              className="mt-1 block w-full rounded-md border-gray-300"
            >
              <option value="new">New</option>
              <option value="in_use">In Usage</option>
              <option value="broken">Broken</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={addItem.isPending}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {addItem.isPending ? 'Adding...' : 'Add Item'}
          </button>
        </form>
      </div>

      {/* Items List */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Equipment Items</h2>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <p>Loading items...</p>
        ) : filteredItems?.length === 0 ? (
          <p className="text-gray-500">No items found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingItem?.id === item.id ? (
                        <input
                          type="text"
                          value={editingItem.name}
                          onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                          className="rounded-md border-gray-300 text-sm"
                        />
                      ) : (
                        item.name
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {editingItem?.id === item.id ? (
                        <input
                          type="text"
                          value={editingItem.description || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                          className="rounded-md border-gray-300 text-sm"
                        />
                      ) : (
                        item.description || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {editingItem?.id === item.id ? (
                        <input
                          type="text"
                          value={editingItem.owner || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, owner: e.target.value })}
                          className="rounded-md border-gray-300 text-sm"
                        />
                      ) : (
                        item.owner || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingItem?.id === item.id ? (
                        <input
                          type="number"
                          min="1"
                          value={editingItem.quantity}
                          onChange={(e) => setEditingItem({ ...editingItem, quantity: parseInt(e.target.value) })}
                          className="rounded-md border-gray-300 text-sm w-20"
                        />
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {editingItem?.id === item.id ? (
                        <select
                          value={editingItem.status}
                          onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as Equipment['status'] })}
                          className="rounded-md border-gray-300 text-sm"
                        >
                          <option value="new">New</option>
                          <option value="in_use">In Usage</option>
                          <option value="broken">Broken</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${item.status === 'new' ? 'bg-green-100 text-green-800' : 
                            item.status === 'in_use' ? 'bg-blue-100 text-blue-800' : 
                            'bg-red-100 text-red-800'}`}
                        >
                          {item.status === 'new' ? 'New' : 
                           item.status === 'in_use' ? 'In Usage' : 
                           'Broken'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        {editingItem?.id === item.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateItem(editingItem)}
                              disabled={updateItem.isPending}
                              className="text-green-600 hover:text-green-800"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingItem(item)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Transition.Root show={!!itemToDelete} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setItemToDelete(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        Delete Item
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                      onClick={confirmDelete}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={() => setItemToDelete(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
}