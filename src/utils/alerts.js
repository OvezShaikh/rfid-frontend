// src/utils/alerts.js
import Swal from 'sweetalert2';

const base = {
  confirmButtonColor: '#5B5BD6',
  cancelButtonColor:  '#98A2B3',
  customClass: { popup: 'swal-app' },
};

export const toastSuccess = (title, text) =>
  Swal.fire({
    ...base,
    icon: 'success',
    title,
    text,
    timer: 2500,
    timerProgressBar: true,
    showConfirmButton: false,
  });

export const toastError = (title, text) =>
  Swal.fire({
    ...base,
    icon: 'error',
    title,
    text,
    confirmButtonText: 'OK',
  });

export const toastWarning = (title, text) =>
  Swal.fire({
    ...base,
    icon: 'warning',
    title,
    text,
    confirmButtonText: 'Got it',
  });

export const toastInfo = (title, text) =>
  Swal.fire({
    ...base,
    icon: 'info',
    title,
    text,
    confirmButtonText: 'OK',
  });

export const confirmDialog = (title, text, confirmText = 'Confirm') =>
  Swal.fire({
    ...base,
    icon: 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
    reverseButtons: true,
  });

export const dangerConfirm = (title, text, confirmText = 'Delete') =>
  Swal.fire({
    ...base,
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#F04438',
    reverseButtons: true,
  });