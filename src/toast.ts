import Toast from 'react-native-toast-message';

export function showError(message: string) {
  Toast.show({ type: 'error', text1: 'Something went wrong', text2: message });
}

export function showSuccess(message: string) {
  Toast.show({ type: 'success', text1: message });
}

export { Toast };
