'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface PaymentQrProps {
  payload: string
}

export function PaymentQr({ payload }: PaymentQrProps) {
  const [qrImage, setQrImage] = useState<string>('')

  useEffect(() => {
    if (!payload) return

    QRCode.toDataURL(payload, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
    })
      .then(setQrImage)
      .catch(console.error)
  }, [payload])

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