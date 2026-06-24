import { Alert } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { apiGetWithQuery, apiJson } from '@/api';
import { showError, showSuccess } from '@/toast';

export function useCrudList<T>(path: string, query?: Record<string, string | number | boolean | undefined>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data: any = await apiGetWithQuery(path, query);
      setItems(data.data ?? data ?? []);
    } catch (error: any) {
      showError(error.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [path, JSON.stringify(query)]);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return { items, setItems, loading, refreshing, refresh, load };
}

export async function createItem(path: string, payload: unknown) {
  try {
    await apiJson(path, 'POST', payload);
    showSuccess('Created successfully');
  } catch (error: any) {
    showError(error.message ?? 'Create failed');
    throw error;
  }
}

export async function updateItem(path: string, payload: unknown) {
  try {
    await apiJson(path, 'PATCH', payload);
    showSuccess('Updated successfully');
  } catch (error: any) {
    showError(error.message ?? 'Update failed');
    throw error;
  }
}

export async function deleteItem(path: string) {
  return new Promise<void>((resolve, reject) => {
    Alert.alert('Delete item?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiJson(path, 'DELETE');
            showSuccess('Deleted successfully');
            resolve();
          } catch (error: any) {
            showError(error.message ?? 'Delete failed');
            reject(error);
          }
        },
      },
    ]);
  });
}
