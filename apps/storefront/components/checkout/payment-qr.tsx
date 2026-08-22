'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useQuery } from '@tanstack/react-query'
import { getCheckoutPaymentStatus } from '@/lib/checkout/checkout-data'
import { CheckoutContext, PaymentAction } from '@repo/types'

interface PaymentQrProps {
  action: PaymentAction | null
  context: CheckoutContext
  onDone: () => void
}

export function PaymentQr({ action, context, onDone }: PaymentQrProps) {
  const [qrImage, setQrImage] = useState<string>('')

  const paymentStatusQuery = useQuery({
    queryKey: ["checkout-payment-status", context.payment?.id],
    queryFn: () => getCheckoutPaymentStatus(context.payment?.id!, context!.token),
    enabled: Boolean(context.payment?.id && context?.token),
    refetchInterval: (query) => query.state.data?.status === "PENDING" ? 10_000 : false,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!action) return

    QRCode.toDataURL(action.qrPayload, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
    })
      .then(setQrImage)
      .catch(console.error)
  }, [action])

  useEffect(() => {
    const status = paymentStatusQuery.data?.status    
    if (String(status) === "CONFIRMED") {      
      onDone()
    }
  }, [paymentStatusQuery.data?.status, onDone])

  if (!qrImage) {
    return <div>Generating QR...</div>
  }

  return (
    <img
      src={qrImage}
      alt="Payment QR"
      width={320}
      height={320}
    />
  )
}