declare global {
  interface Window {
    Cashfree?: {
      Checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: string;
        onSuccess?: () => void;
        onFailure?: () => void;
      }) => void;
    };
  }
}

export {};

