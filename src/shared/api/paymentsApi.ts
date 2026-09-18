import { apiClient } from './client'

export interface CheckoutResult {
  status: 'paid' | 'redirect' | 'pending'
  provider?: string | null
  checkout_url?: string | null
  invoice: Record<string, unknown>
}

/** Start paying an invoice. Demo servers settle at once; Chapa returns a checkout URL. */
export async function checkoutInvoice(invoiceId: string, returnPath: string) {
  const { data } = await apiClient.post<CheckoutResult>(
    `/payments/invoices/${encodeURIComponent(invoiceId)}/checkout`,
    { return_path: returnPath },
  )
  return data
}

/** After returning from the payment provider, confirm the payment on the server. */
export async function verifyCheckout(txRef: string) {
  const { data } = await apiClient.post<CheckoutResult>(
    `/payments/checkout/${encodeURIComponent(txRef)}/verify`,
  )
  return data
}
