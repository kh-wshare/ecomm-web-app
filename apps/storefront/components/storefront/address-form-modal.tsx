"use client";

import { useState } from "react";
import { Alert, Button, Checkbox, Input, Modal } from "@heroui/react";

import { getErrorMessage } from "@/lib/errors/api-error";
import {
  emptyAddressValues,
  type AddressValues,
  type StorefrontAddress,
  toAddressValues,
} from "@/types/cart";

export function AddressFormModal({
  address,
  error,
  isOpen,
  isPending,
  onClose,
  onSubmit,
}: {
  address?: StorefrontAddress | null;
  error?: unknown;
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: AddressValues) => void;
}) {
  const [values, setValues] = useState<AddressValues>(() =>
    address ? toAddressValues(address) : emptyAddressValues,
  );

  const update = <Key extends keyof AddressValues>(
    field: Key,
    value: AddressValues[Key],
  ) => setValues((current) => ({ ...current, [field]: value }));

  // recipientName, line1 and country are the only fields the API requires.
  const canSubmit =
    values.recipientName.trim().length > 0 &&
    values.line1.trim().length > 0 &&
    values.country.trim().length > 0;

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop>
        <Modal.Container
          placement="bottom"
          className="p-0 sm:items-center sm:p-10"
        >
          <Modal.Dialog className="w-full max-w-full rounded-t-3xl rounded-b-none pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:max-w-md sm:rounded-3xl sm:pb-6">
            <div className="mx-auto -mt-1 mb-3 h-1.5 w-10 shrink-0 rounded-full bg-default-200 sm:hidden" />

            <Modal.CloseTrigger />

            <Modal.Header>
              <h2 className="text-lg font-semibold">
                {address ? "Edit address" : "Add an address"}
              </h2>
            </Modal.Header>

            <Modal.Body>
              <form
                className="flex flex-col gap-3"
                id="address-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (canSubmit) onSubmit(values);
                }}
              >
                <Field
                  id="address-label"
                  label="Label"
                  placeholder="Home, Office"
                  value={values.label}
                  onChange={(value) => update("label", value)}
                />
                <Field
                  id="address-recipient"
                  label="Recipient name"
                  required
                  value={values.recipientName}
                  onChange={(value) => update("recipientName", value)}
                />
                <Field
                  id="address-phone"
                  label="Phone"
                  type="tel"
                  value={values.phone}
                  onChange={(value) => update("phone", value)}
                />
                <Field
                  id="address-email"
                  label="Email"
                  type="email"
                  value={values.email}
                  onChange={(value) => update("email", value)}
                />
                <p className="-mt-1 text-xs text-default-500">
                  Add a phone number or an email so the store can reach you
                  about the order.
                </p>
                <Field
                  id="address-line1"
                  label="Address"
                  required
                  value={values.line1}
                  onChange={(value) => update("line1", value)}
                />
                <Field
                  id="address-line2"
                  label="Apartment, floor (optional)"
                  value={values.line2}
                  onChange={(value) => update("line2", value)}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Field
                    id="address-city"
                    label="City"
                    value={values.city}
                    onChange={(value) => update("city", value)}
                  />
                  <Field
                    id="address-province"
                    label="Province"
                    value={values.province}
                    onChange={(value) => update("province", value)}
                  />
                  <Field
                    id="address-postal"
                    label="Postal code"
                    value={values.postalCode}
                    onChange={(value) => update("postalCode", value)}
                  />
                  <Field
                    id="address-country"
                    label="Country"
                    placeholder="KH"
                    required
                    value={values.country}
                    onChange={(value) => update("country", value.toUpperCase())}
                  />
                </div>

                <Field
                  id="address-note"
                  label="Delivery note (optional)"
                  placeholder="Leave at the door"
                  value={values.note}
                  onChange={(value) => update("note", value)}
                />

                <Checkbox
                  className="mt-1"
                  id="address-default"
                  isSelected={values.isDefaultShipping}
                  onChange={(isSelected) =>
                    update("isDefaultShipping", isSelected)
                  }
                >
                  <Checkbox.Content className="flex items-center gap-2">
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <span className="text-sm">Use as my default address</span>
                  </Checkbox.Content>
                </Checkbox>

                {Boolean(error) && (
                  <Alert status="danger">
                    <Alert.Content>
                      <Alert.Title>We could not save this address</Alert.Title>
                      <Alert.Description>
                        {getErrorMessage(error)}
                      </Alert.Description>
                    </Alert.Content>
                  </Alert>
                )}
              </form>
            </Modal.Body>

            <Modal.Footer>
              <Button
                className="h-12 w-full text-sm font-bold"
                form="address-form"
                isDisabled={!canSubmit || isPending}
                type="submit"
                variant="primary"
              >
                {isPending ? "Saving..." : "Save address"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function Field({
  id,
  label,
  onChange,
  placeholder,
  required,
  type = "text",
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="flex flex-col gap-1" htmlFor={id}>
      <span className="text-xs font-medium text-default-500">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      <Input
        id={id}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
