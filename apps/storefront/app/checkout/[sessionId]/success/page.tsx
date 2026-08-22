import { CheckoutSuccessPage } from "@/components/checkout/checkout-success-page";

export default async function CheckoutSuccessRoute({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  return <CheckoutSuccessPage sessionId={sessionId} />;
}
