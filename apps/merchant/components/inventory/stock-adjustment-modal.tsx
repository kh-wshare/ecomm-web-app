"use client";

import {
  Button,
  Description,
  FieldError,
  Input,
  Label,
  Modal,
  TextArea,
  TextField,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type {
  AdjustableStock,
  InventoryAdjustmentValues,
} from "@/types/inventory";
import { adjustInventory } from "@/lib/inventory/inventory-data";
import { queryKeys } from "@repo/query-client";
import { notify } from "@/lib/toast/notify";
import { validateForm } from "@/lib/validation/form";
import { inventoryAdjustmentSchema } from "@/lib/validation/inventory";

const inputClassName =
  "rounded-xl border border-separator bg-background px-3 text-sm outline-none transition shadow-none";
const textAreaClassName =
  "min-h-24 w-full rounded-xl border border-separator bg-background p-3 text-sm outline-none transition shadow-none";

const ADJUSTMENT_TYPES: {
  value: InventoryAdjustmentValues["type"];
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "STOCK_IN",
    label: "Stock in",
    description: "Add received or returned units.",
    icon: "gravity-ui:arrow-down-to-line",
  },
  {
    value: "STOCK_OUT",
    label: "Stock out",
    description: "Remove damaged, lost, or misplaced units.",
    icon: "gravity-ui:arrow-up-from-line",
  },
];

export function StockAdjustmentModal({
  stock,
  onClose,
}: {
  stock: AdjustableStock;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<InventoryAdjustmentValues>({
    type: "STOCK_IN",
    quantity: "",
    safetyBuffer: String(stock.safetyBuffer),
    reason: "",
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [confirming, setConfirming] = useState(false);

  const mutation = useMutation({
    mutationFn: () => adjustInventory(stock, values),
    onSuccess: async () => {
      notify.success(
        "Inventory updated",
        `${stock.product.name} stock is current.`,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.merchant.dashboard(),
        }),
      ]);
      onClose();
    },
    onError: (error) => {
      setConfirming(false);
      notify.error(error, "Unable to adjust stock");
    },
  });

  const setField = <K extends keyof InventoryAdjustmentValues>(
    field: K,
    value: InventoryAdjustmentValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];

      return next;
    });
  };

  const validate = () => {
    const result = validateForm(inventoryAdjustmentSchema, values);

    if (!result.success) {
      setErrors(result.errors);
      notify.warning("Check the highlighted fields");

      return;
    }

    if (
      result.data.type === "STOCK_OUT" &&
      Number(result.data.quantity) > stock.availableStock
    ) {
      setErrors({
        quantity: [
          `Only ${stock.availableStock} unreserved unit${
            stock.availableStock === 1 ? " is" : "s are"
          } available`,
        ],
      });

      return;
    }

    setErrors({});
    setConfirming(true);
  };

  const closeUnlessSaving = () => {
    if (!mutation.isPending) onClose();
  };

  return (
    <Modal>
      <Modal.Backdrop
        isOpen
        className="bg-black/55 backdrop-blur-sm"
        variant="blur"
        onOpenChange={(isOpen) => {
          if (!isOpen) closeUnlessSaving();
        }}
      >
        <Modal.Container
          className="items-end p-0 sm:items-center sm:p-4"
          scroll="inside"
          size="lg"
        >
          <Modal.Dialog className="max-h-[92dvh] w-full overflow-hidden rounded-t-3xl border border-separator bg-surface shadow-2xl sm:rounded-2xl">
            <Modal.CloseTrigger
              className="absolute right-4 top-4 rounded-full border border-separator bg-surface p-2 text-muted transition hover:bg-surface-secondary hover:text-foreground"
              onPress={closeUnlessSaving}
            />
            <Modal.Header className="border-b border-separator px-5 py-5 sm:px-6">
              <div className="min-w-0 pr-10">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                  Inventory
                </p>
                <Modal.Heading className="mt-1 text-xl font-semibold tracking-tight">
                  Adjust stock
                </Modal.Heading>
                <p className="mt-2 truncate text-sm leading-5 text-muted">
                  {stock.product.name}
                  {stock.variant ? ` · ${stock.variant.name}` : ""} (
                  {stock.variant?.sku ?? stock.product.sku})
                </p>
              </div>
            </Modal.Header>

            <Modal.Body className="max-h-[65dvh] overflow-y-auto px-5 py-5 sm:px-6">
              {!confirming ? (
                <div className="grid gap-5">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MiniMetricCard label="Total" value={stock.totalStock} />
                    <MiniMetricCard
                      label="Reserved"
                      value={stock.reservedStock}
                    />
                    <MiniMetricCard label="Sold" value={stock.soldStock} />
                    <MiniMetricCard
                      label="Sellable"
                      value={stock.onlineSellableStock}
                    />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {ADJUSTMENT_TYPES.map((option) => {
                      const isSelected = values.type === option.value;

                      return (
                        <button
                          className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                            isSelected
                              ? "border-accent bg-accent/10"
                              : "border-separator bg-surface hover:bg-surface-secondary"
                          }`}
                          key={option.value}
                          type="button"
                          onClick={() => setField("type", option.value)}
                        >
                          <Icon
                            className={`mt-0.5 size-4 shrink-0 ${
                              isSelected ? "text-accent" : "text-muted"
                            }`}
                            icon={option.icon}
                          />
                          <span>
                            <span
                              className={`block text-sm font-semibold ${
                                isSelected ? "text-accent" : "text-foreground"
                              }`}
                            >
                              {option.label}
                            </span>
                            <span className="mt-1 block text-xs text-muted">
                              {option.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <HeroTextInput
                      error={errors.quantity?.[0]}
                      inputMode="numeric"
                      label="Quantity"
                      placeholder="10"
                      value={values.quantity}
                      onChange={(value) => setField("quantity", value)}
                    />
                    <HeroTextInput
                      description="Reserve stock not available online."
                      error={errors.safetyBuffer?.[0]}
                      inputMode="numeric"
                      label="Safety buffer"
                      placeholder="0"
                      value={values.safetyBuffer}
                      onChange={(value) => setField("safetyBuffer", value)}
                    />
                  </div>

                  <HeroTextAreaInput
                    error={errors.reason?.[0]}
                    label="Reason"
                    maxLength={120}
                    placeholder="New shipment received"
                    value={values.reason}
                    onChange={(value) => setField("reason", value)}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4">
                  <div className="flex items-start gap-3">
                    <Icon
                      className="mt-0.5 size-5 shrink-0 text-warning"
                      icon="gravity-ui:sliders"
                    />
                    <div>
                      <p className="font-semibold">Confirm inventory change</p>
                      <p className="mt-2 text-sm text-muted">
                        {values.type === "STOCK_IN" ? "Add" : "Remove"}{" "}
                        <strong>{values.quantity}</strong> unit
                        {Number(values.quantity) === 1 ? "" : "s"} and set the
                        safety buffer to <strong>{values.safetyBuffer}</strong>
                        .
                      </p>
                      <p className="mt-2 text-xs text-muted">
                        Reason: {values.reason}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Modal.Body>

            <Modal.Footer className="border-t border-separator bg-surface px-5 py-4 sm:px-6">
              <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {!confirming ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      onPress={closeUnlessSaving}
                    >
                      Cancel
                    </Button>
                    <Button type="button" variant="primary" onPress={validate}>
                      Review adjustment
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      isDisabled={mutation.isPending}
                      type="button"
                      variant="secondary"
                      onPress={() => setConfirming(false)}
                    >
                      Back
                    </Button>
                    <Button
                      isDisabled={mutation.isPending}
                      type="button"
                      variant="primary"
                      onPress={() => mutation.mutate()}
                    >
                      {mutation.isPending ? "Updating…" : "Confirm adjustment"}
                    </Button>
                  </>
                )}
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function MiniMetricCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-separator bg-background p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function HeroTextInput({
  className,
  description,
  error,
  label,
  onChange,
  value,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  className?: string;
  description?: string;
  error?: string;
  label: string;
  onChange: (value: string) => void;
}) {
  return (
    <TextField
      className={`w-full ${className ?? ""}`}
      isInvalid={Boolean(error)}
      value={String(value ?? "")}
      onChange={onChange}
    >
      <Label className="mb-1.5 block text-sm font-medium">{label}</Label>
      <Input {...props} className={inputClassName} />
      {description && (
        <Description className="mt-1 block text-xs text-muted">
          {description}
        </Description>
      )}
      {error && (
        <FieldError className="mt-1 text-xs text-danger">{error}</FieldError>
      )}
    </TextField>
  );
}

function HeroTextAreaInput({
  className,
  description,
  error,
  label,
  onChange,
  value,
  ...props
}: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> & {
  className?: string;
  description?: string;
  error?: string;
  label: string;
  onChange: (value: string) => void;
}) {
  return (
    <TextField
      className={`w-full ${className ?? ""}`}
      isInvalid={Boolean(error)}
      value={String(value ?? "")}
      onChange={onChange}
    >
      <Label className="mb-1.5 block text-sm font-medium">{label}</Label>
      <TextArea
        {...props}
        className={textAreaClassName}
        value={String(value ?? "")}
      />
      {description && (
        <Description className="mt-1 block text-xs text-muted">
          {description}
        </Description>
      )}
      {error && (
        <FieldError className="mt-1 text-xs text-danger">{error}</FieldError>
      )}
    </TextField>
  );
}
