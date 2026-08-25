"use client";

import {
  Avatar,
  Button,
  Dropdown,
  Label,
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
  getCustomerSession,
  loginCustomerSession,
  logoutCustomerSession,
} from "@/lib/storefront/customer-session";

const customerSessionQueryKey = ["storefront", "customer-session"];

type SocialProvider = "firebase-google" | "telegram";

export function StorefrontCustomerAuth() {
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

  const logout = useMutation({
    mutationFn: logoutCustomerSession,

    onSuccess: () => {
      queryClient.setQueryData(customerSessionQueryKey, null);
    },
  });

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
      <Dropdown>
        <Dropdown.Trigger>
          <Button
            isIconOnly
            variant="ghost"
            aria-label="Open profile menu"
            className="rounded-full"
          >
            <Avatar size="sm">
              {/* {customer.user.avatarUrl && (
                <Avatar.Image
                  src={customer.user.avatarUrl}
                  alt={customer.user.fullName}
                />
              )} */}
              <Avatar.Image
                alt="Blue"
                src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg"
              />

              <Avatar.Fallback>
                {initials}
              </Avatar.Fallback>
            </Avatar>
          </Button>
        </Dropdown.Trigger>

        <Dropdown.Popover>
          <Dropdown.Menu
            aria-label="Customer profile"
            onAction={(key) => {
              if (key === "logout") {
                logout.mutate();
              }
            }}
          >
            <Dropdown.Item
              id="profile"
              textValue={customer.user.fullName}
              isDisabled
            >
              <Label>
                <span className="block font-semibold">
                  {customer.user.fullName}
                </span>

                {customer.user.email && (
                  <span className="block text-xs text-muted">
                    {customer.user.email}
                  </span>
                )}
              </Label>
            </Dropdown.Item>

            <Dropdown.Item
              id="logout"
              textValue="Sign out"
              variant="danger"
              isDisabled={logout.isPending}
            >
              <Label>
                {logout.isPending ? "Signing out..." : "Sign out"}
              </Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );
  }

  /**
   * Logged out
   */
  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          setProviderError(null);
          setIsLoginOpen(true);
        }}
      >
        Login
      </Button>

      <Modal
        isOpen={isLoginOpen}
        onOpenChange={setIsLoginOpen}
      >
        <Modal.Backdrop>
          <Modal.Container placement="center">
            <Modal.Dialog className="w-full max-w-sm">
              {({ close }) => (
                <>
                  <Modal.CloseTrigger />

                  <Modal.Header>
                    <div className="flex flex-col gap-1">
                      <h2 className="text-lg font-semibold">
                        Welcome back
                      </h2>

                      <p className="text-sm text-muted">
                        Sign in to continue
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
                        isDisabled={
                          !socialProviderConfig.firebaseConfigured ||
                          login.isPending
                        }
                        onPress={() =>
                          void startSocialLogin("firebase-google")
                        }
                      >
                        Continue with Google
                      </Button>

                      <Button
                        size="lg"
                        variant="secondary"
                        isDisabled={
                          !socialProviderConfig.telegramConfigured ||
                          login.isPending
                        }
                        onPress={() =>
                          void startSocialLogin("telegram")
                        }
                      >
                        Continue with Telegram
                      </Button>

                      {login.isPending && (
                        <p className="text-center text-xs text-muted">
                          Signing you in...
                        </p>
                      )}
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