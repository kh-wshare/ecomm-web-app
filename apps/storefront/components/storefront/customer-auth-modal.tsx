"use client";

import { Button, Modal } from "@heroui/react";
import { Icon } from "@iconify/react";
import { createContext, useContext, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getFirebaseGoogleIdToken,
  getTelegramIdToken,
  isSocialLoginCancelled,
  socialProviderConfig,
} from "@/lib/auth/social-providers";
import { getErrorMessage } from "@/lib/errors/api-error";
import {
  customerSessionQueryKey,
  loginCustomerSession,
} from "@/lib/storefront/customer-session";

type SocialProvider = "firebase-google" | "telegram";

type CustomerAuthModalContextValue = {
  openLogin: () => void;
};

const CustomerAuthModalContext =
  createContext<CustomerAuthModalContextValue | null>(null);

// Any page can call this to trigger the shared sign-in modal (rendered once
// in StorefrontShell) instead of only linking to the bottom-nav avatar.
export function useCustomerAuthModal() {
  const context = useContext(CustomerAuthModalContext);
  if (!context) {
    throw new Error(
      "useCustomerAuthModal must be used within a CustomerAuthModalProvider",
    );
  }
  return context;
}

export function CustomerAuthModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [providerError, setProviderError] = useState<unknown>(null);

  const login = useMutation({
    mutationFn: loginCustomerSession,

    onSuccess: (session) => {
      setProviderError(null);
      queryClient.setQueryData(customerSessionQueryKey, session);
      setIsOpen(false);
    },
  });

  const startSocialLogin = async (provider: SocialProvider) => {
    setProviderError(null);

    try {
      const idToken =
        provider === "firebase-google"
          ? await getFirebaseGoogleIdToken()
          : await getTelegramIdToken();

      await login.mutateAsync({ idToken, provider });
    } catch (error) {
      if (isSocialLoginCancelled(error)) {
        setProviderError(new Error(cancelledMessage(provider)));
        return;
      }

      setProviderError(error);
    }
  };

  const value = useMemo(
    () => ({
      openLogin: () => {
        setProviderError(null);
        setIsOpen(true);
      },
    }),
    [],
  );

  return (
    <CustomerAuthModalContext.Provider value={value}>
      {children}

      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Backdrop>
          <Modal.Container
            placement="bottom"
            className="p-0 sm:items-center sm:p-10"
          >
            <Modal.Dialog className="w-full max-w-full rounded-t-3xl rounded-b-none pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:max-w-sm sm:rounded-3xl sm:pb-6">
              {() => (
                <>
                  <div className="mx-auto -mt-1 mb-3 h-1.5 w-10 shrink-0 rounded-full bg-default-200 sm:hidden" />

                  <Modal.CloseTrigger />

                  <Modal.Header>
                    <div className="flex flex-col items-center gap-1 text-center sm:items-start sm:text-left">
                      <h2 className="text-lg font-semibold">Welcome back</h2>

                      <p className="text-sm text-muted">
                        Sign in to continue shopping
                      </p>
                    </div>
                  </Modal.Header>

                  <Modal.Body>
                    <div className="flex flex-col gap-3">
                      {(providerError || login.isError) && (
                        <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">
                          {getErrorMessage(providerError ?? login.error)}
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
                        onPress={() => void startSocialLogin("firebase-google")}
                      >
                        <Icon
                          icon="flat-color-icons:google"
                          className="size-5 shrink-0"
                        />
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
                        onPress={() => void startSocialLogin("telegram")}
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
                        By continuing, you agree to our terms and privacy
                        policy.
                      </p>
                    </div>
                  </Modal.Body>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </CustomerAuthModalContext.Provider>
  );
}

function cancelledMessage(provider: SocialProvider) {
  return provider === "telegram"
    ? "Telegram login was cancelled."
    : "Google login was cancelled.";
}
