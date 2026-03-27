declare module "midtrans-client" {
  interface SnapOptions {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  interface CoreApiOptions {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  interface TransactionDetails {
    transaction_details: {
      order_id: string;
      gross_amount: number;
    };
    customer_details?: Record<string, any>;
    item_details?: Array<{
      id: string;
      price: number;
      quantity: number;
      name: string;
    }>;
    [key: string]: any;
  }

  class Snap {
    constructor(options: SnapOptions);
    createTransaction(params: TransactionDetails): Promise<{ token: string; redirect_url: string }>;
    createTransactionToken(params: TransactionDetails): Promise<string>;
  }

  class CoreApi {
    constructor(options: CoreApiOptions);
    charge(params: any): Promise<any>;
    transaction: {
      status(orderId: string): Promise<any>;
      cancel(orderId: string): Promise<any>;
    };
  }

  export { Snap, CoreApi };
}
