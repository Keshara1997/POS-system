import Swal from 'sweetalert2';

// Custom SweetAlert2 configurations that match the system design
export const swalConfig = {
  // Success toast
  success: (message: string) => {
    return Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: '#ffffff',
      color: '#059669',
      iconColor: '#10b981',
      customClass: {
        popup: 'rounded-2xl shadow-lg border border-green-100 backdrop-blur-sm',
        title: 'text-green-800 font-semibold text-base',
        htmlContainer: 'text-green-700 text-sm',
        timerProgressBar: 'bg-gradient-to-r from-green-400 to-green-600'
      },
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  },

  // Error toast
  error: (message: string) => {
    return Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
      background: '#ffffff',
      color: '#dc2626',
      iconColor: '#ef4444',
      customClass: {
        popup: 'rounded-2xl shadow-lg border border-red-100 backdrop-blur-sm',
        title: 'text-red-800 font-semibold text-base',
        htmlContainer: 'text-red-700 text-sm',
        timerProgressBar: 'bg-gradient-to-r from-red-400 to-red-600'
      },
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  },

  // Warning toast
  warning: (message: string) => {
    return Swal.fire({
      icon: 'warning',
      title: 'Warning!',
      text: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3500,
      timerProgressBar: true,
      background: '#ffffff',
      color: '#d97706',
      iconColor: '#f59e0b',
      customClass: {
        popup: 'rounded-2xl shadow-lg border border-yellow-100 backdrop-blur-sm',
        title: 'text-yellow-800 font-semibold text-base',
        htmlContainer: 'text-yellow-700 text-sm',
        timerProgressBar: 'bg-gradient-to-r from-yellow-400 to-yellow-600'
      },
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  },

  // Info toast
  info: (message: string) => {
    return Swal.fire({
      icon: 'info',
      title: 'Info',
      text: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: '#ffffff',
      color: '#2563eb',
      iconColor: '#3b82f6',
      customClass: {
        popup: 'rounded-2xl shadow-lg border border-blue-100 backdrop-blur-sm',
        title: 'text-blue-800 font-semibold text-base',
        htmlContainer: 'text-blue-700 text-sm',
        timerProgressBar: 'bg-gradient-to-r from-blue-400 to-blue-600'
      },
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  },

  // Confirmation dialog
  confirm: (title: string, text: string, confirmText: string = 'Yes, delete it!') => {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: confirmText,
      cancelButtonText: 'Cancel',
      background: '#ffffff',
      color: '#374151',
      iconColor: '#f59e0b',
      customClass: {
        popup: 'rounded-3xl shadow-2xl border border-gray-100',
        title: 'text-gray-900 font-bold text-xl mb-2',
        htmlContainer: 'text-gray-600 text-base',
        confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 mr-3',
        cancelButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all duration-200',
        actions: 'gap-3 mt-6'
      },
      buttonsStyling: false
    });
  },

  // Delete confirmation
  deleteConfirm: (itemName: string) => {
    return Swal.fire({
      title: 'Are you sure?',
      text: `You won't be able to revert this! The ${itemName} will be permanently deleted.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      background: '#ffffff',
      color: '#374151',
      iconColor: '#f59e0b',
      customClass: {
        popup: 'rounded-3xl shadow-2xl border border-gray-100',
        title: 'text-gray-900 font-bold text-xl mb-2',
        htmlContainer: 'text-gray-600 text-base',
        confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 mr-3',
        cancelButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all duration-200',
        actions: 'gap-3 mt-6'
      },
      buttonsStyling: false
    });
  },

  // Loading modal
  loading: (title: string = 'Processing...') => {
    return Swal.fire({
      title,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      background: '#ffffff',
      color: '#374151',
      customClass: {
        popup: 'rounded-3xl shadow-2xl border border-gray-100',
        title: 'text-gray-900 font-semibold text-lg',
        loader: 'border-blue-500'
      },
      didOpen: () => {
        Swal.showLoading();
      }
    });
  },

  // Close loading
  close: () => {
    Swal.close();
  },

  // Input dialog
  input: (title: string, placeholder: string, inputType: 'text' | 'email' | 'password' | 'number' = 'text') => {
    return Swal.fire({
      title,
      input: inputType,
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      background: '#ffffff',
      color: '#374151',
      customClass: {
        popup: 'rounded-3xl shadow-2xl border border-gray-100',
        title: 'text-gray-900 font-bold text-xl mb-4',
        input: 'w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white',
        confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 mr-3',
        cancelButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all duration-200',
        actions: 'gap-3 mt-6'
      },
      buttonsStyling: false,
      inputValidator: (value) => {
        if (!value) {
          return 'Please enter a value!';
        }
      }
    });
  }
};

export default swalConfig;
