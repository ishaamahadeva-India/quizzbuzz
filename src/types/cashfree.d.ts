declare global {
  interface Window {
    Cashfree?: (config: { mode: 'sandbox' | 'production' }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: '_self' | '_blank' | '_top' | '_modal';
      }) => Promise<{
        error?: {
          message: string;
        };
        redirect?: boolean;
      }>;
    };
  }
}

export {};

