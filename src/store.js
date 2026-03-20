export const MONTHS = [
  { num: 2, name: 'Febrero', short: 'Feb' },
  { num: 3, name: 'Marzo', short: 'Mar' },
  { num: 4, name: 'Abril', short: 'Abr' },
  { num: 5, name: 'Mayo', short: 'May' },
  { num: 6, name: 'Junio', short: 'Jun' },
  { num: 7, name: 'Julio', short: 'Jul' },
  { num: 8, name: 'Agosto', short: 'Ago' },
  { num: 9, name: 'Septiembre', short: 'Sep' },
  { num: 10, name: 'Octubre', short: 'Oct' },
  { num: 11, name: 'Noviembre', short: 'Nov' },
  { num: 12, name: 'Diciembre', short: 'Dic' },
];

export const INITIAL_STATE = {
  isLoggedIn: false,
  currentScreen: 'home',
  showPaymentFlow: false,
  paymentFlowPreselect: null,
  family: null,
  familiaId: null,
  payments: [],
  rates: {},
  toasts: [],
};

export function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, isLoggedIn: true };
    case 'LOGOUT':
      return { ...INITIAL_STATE };
    case 'NAVIGATE':
      return { ...state, currentScreen: action.screen };
    case 'OPEN_PAYMENT_FLOW':
      return { ...state, showPaymentFlow: true, paymentFlowPreselect: action.preselect || null };
    case 'CLOSE_PAYMENT_FLOW':
      return { ...state, showPaymentFlow: false, paymentFlowPreselect: null };
    case 'SET_FAMILY_DATA':
      return { ...state, family: action.family, familiaId: action.familiaId };
    case 'SET_RATES':
      return { ...state, rates: action.rates };
    case 'SET_PAYMENTS':
      return { ...state, payments: action.payments };
    case 'ADD_PAYMENT':
      return { ...state, payments: [action.payment, ...state.payments] };
    case 'ADD_TOAST': {
      const toast = {
        id: Date.now() + Math.random(),
        message: action.message,
        toastType: action.toastType || 'success',
      };
      return { ...state, toasts: [...state.toasts, toast] };
    }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) };
    default:
      return state;
  }
}
