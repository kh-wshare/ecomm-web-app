"use client";

import {
  Avatar,
  Button,
  Modal,
} from "@heroui/react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getFirebaseGoogleIdToken,
  getTelegramIdToken,
  isSocialLoginCancelled,
  socialProviderConfig,
} from "@/lib/auth/social-providers";
import { getErrorMessage } from "@/lib/errors/api-error";
import {
  customerSessionQueryKey,
  getCustomerSession,
  loginCustomerSession,
  logoutCustomerSession,
} from "@/lib/storefront/customer-session";
import { Icon } from "@iconify/react";
import Link from "next/link";

type SocialProvider = "firebase-google" | "telegram";

export function StorefrontCustomerAuth({ slug }: { slug: string }) {
  const queryClient = useQueryClient();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [providerError, setProviderError] = useState<unknown>(null);

  const customerQuery = useQuery({
    queryKey: customerSessionQueryKey,
    queryFn: getCustomerSession,
  });

  const login = useMutation({
    mutationFn: loginCustomerSession,

    onSuccess: (session) => {
      setProviderError(null);

      queryClient.setQueryData(customerSessionQueryKey, session);

      // Close login modal after successful login
      setIsLoginOpen(false);
    },
  });

  // const logout = useMutation({
  //   mutationFn: logoutCustomerSession,

  //   onSuccess: () => {
  //     queryClient.setQueryData(customerSessionQueryKey, null);
  //   },
  // });

  const startSocialLogin = async (provider: SocialProvider) => {
    setProviderError(null);

    try {
      const idToken =
        provider === "firebase-google"
          ? await getFirebaseGoogleIdToken()
          : await getTelegramIdToken();

      await login.mutateAsync({
        idToken,
        provider,
      });
    } catch (error) {
      if (isSocialLoginCancelled(error)) {
        setProviderError(new Error(cancelledMessage(provider)));
        return;
      }

      setProviderError(error);
    }
  };

  const customer = customerQuery.data;

  /**
   * Logged in
   */
  if (customer) {
    const initials = getInitials(customer.user.fullName);

    return (
      <Link href={`/${slug}/profile`}>
        <Avatar size="md">
          <Avatar.Image
            alt="Blue"
            src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg"
          />

          <Avatar.Fallback>
            {initials}
          </Avatar.Fallback>
        </Avatar>
      </Link>
    );
  }

  /**
   * Logged out
   */
  return (
    <>
      <Avatar size="md" onClick={() => {
        setProviderError(null);
        setIsLoginOpen(true);
      }}>
        <Avatar.Fallback>
          <Icon icon="solar:user-broken" className="size-6 transition-transform duration-200 group-hover:scale-110" />
        </Avatar.Fallback>
      </Avatar>

      <Modal
        isOpen={isLoginOpen}
        onOpenChange={setIsLoginOpen}
      >
        <Modal.Backdrop>
          <Modal.Container placement="bottom" className="p-0 sm:items-center sm:p-10">
            <Modal.Dialog className="w-full max-w-full rounded-t-3xl rounded-b-none pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:max-w-sm sm:rounded-3xl sm:pb-6">
              {({ close }) => (
                <>
                  <div className="mx-auto -mt-1 mb-3 h-1.5 w-10 shrink-0 rounded-full bg-default-200 sm:hidden" />

                  <Modal.CloseTrigger />

                  <Modal.Header>
                    <div className="flex flex-col items-center gap-1 text-center sm:items-start sm:text-left">
                      <h2 className="text-lg font-semibold">
                        Welcome back
                      </h2>

                      <p className="text-sm text-muted">
                        Sign in to continue shopping
                      </p>
                    </div>
                  </Modal.Header>

                  <Modal.Body>
                    <div className="flex flex-col gap-3">
                      {(providerError || login.isError) && (
                        <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">
                          {getErrorMessage(
                            providerError ?? login.error,
                          )}
                        </div>
                      )}

                      <Button
                        size="lg"
                        variant="secondary"
                        fullWidth
                        className="h-13 justify-center gap-3 border border-default-200 bg-white text-base font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 active:scale-[0.98] dark:bg-white dark:text-zinc-900"
                        isDisabled={
                          !socialProviderConfig.firebaseConfigured ||
                          login.isPending
                        }
                        onPress={() =>
                          void startSocialLogin("firebase-google")
                        }
                      >
                        <Icon icon="flat-color-icons:google" className="size-5 shrink-0" />
                        Continue with Google
                      </Button>

                      <Button
                        size="lg"
                        fullWidth
                        className="h-13 justify-center gap-3 bg-[#229ED9] text-base font-medium text-white shadow-sm hover:bg-[#1d8bc0] active:scale-[0.98]"
                        isDisabled={
                          !socialProviderConfig.telegramConfigured ||
                          login.isPending
                        }
                        onPress={() =>
                          void startSocialLogin("telegram")
                        }
                      >
                        <Icon icon="mdi:telegram" className="size-5 shrink-0" />
                        Continue with Telegram
                      </Button>

                      {login.isPending && (
                        <p className="text-center text-xs text-muted">
                          Signing you in...
                        </p>
                      )}

                      <p className="mt-1 text-center text-[11px] leading-4 text-muted">
                        By continuing, you agree to our terms and privacy policy.
                      </p>
                    </div>
                  </Modal.Body>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}

function getInitials(name?: string) {
  if (!name) {
    return "?";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function cancelledMessage(provider: SocialProvider) {
  return provider === "telegram"
    ? "Telegram login was cancelled."
    : "Google login was cancelled.";
}