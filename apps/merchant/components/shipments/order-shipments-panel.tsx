'use client';

import { Form, Modal } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useMemo, useState } from 'react';

import { Button, Input, Label } from '@repo/ui';

import {
  ShipmentStatusBadge,
  forwardStatuses,
  haltStatuses,
  isLive,
  shippedQuantity,
  statusLabel,
} from './shipment-shared';

import {
  useCreateShipment,
  useOrderShipments,
  useUpdateShipmentStatus,
} from '@/hooks/api/use-shipments';
import { usePermissions } from '@/hooks/use-permissions';
import { formatDate } from '@/lib/formatters/date';
import { notify } from '@/lib/toast/notify';
import type { Order } from '@/types/order';
import type { Shipment, ShipmentStatus } from '@/types/shipment';

const emptyShipments: Shipment[] = [];

type StatusTarget = {
  shipment: Shipment;
  status: ShipmentStatus;
};

export function OrderShipmentsPanel({ order }: { order: Order }) {
  const { can } = usePermissions();
  const canManage = can('shipments.manage');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<StatusTarget | null>(null);

  const shipmentsQuery = useOrderShipments(order.id, canManage);
  const createShipment = useCreateShipment(order.id);
  const updateStatus = useUpdateShipmentStatus(order.id);

  const shipments = shipmentsQuery.data ?? emptyShipments;
  const remaining = useMemo(
    () =>
      order.items.map((item) => ({
        item,
        remaining: Math.max(
          0,
          item.quantity - shippedQuantity(shipments, item.id),
        ),
      })),
    [order.items, shipments],
  );
  const totalRemaining = remaining.reduce(
    (total, line) => total + line.remaining,
    0,
  );

  if (!canManage) return null;

  return (
    <section className="rounded-2xl border border-separator bg-surface p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">Shipments</h3>
        {totalRemaining > 0 && (
          <Button
            type="button"
            size="sm"
            variant="primary"
            onPress={() => setIsCreateOpen(true)}
          >
            Create shipment
          </Button>
        )}
      </div>

      {shipmentsQuery.isPending ? (
        <p className="text-sm text-muted">Loading shipments...</p>
      ) : shipmentsQuery.isError ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">{shipmentsQuery.error.message}</p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onPress={() => shipmentsQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : shipments.length === 0 ? (
        <p className="text-sm text-muted">
          Nothing has shipped yet.{' '}
          {totalRemaining > 0
            ? `${totalRemaining} unit${totalRemaining === 1 ? '' : 's'} are ready to go.`
            : ''}
        </p>
      ) : (
        <div className="space-y-4">
          {totalRemaining > 0 && (
            <p className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-xs">
              {totalRemaining} unit{totalRemaining === 1 ? '' : 's'} on this
              order {totalRemaining === 1 ? 'has' : 'have'} not shipped yet.
            </p>
          )}
          {shipments.map((shipment) => (
            <ShipmentCard
              isPending={updateStatus.isPending}
              key={shipment.id}
              order={order}
              shipment={shipment}
              onAdvance={(status) => setStatusTarget({ shipment, status })}
            />
          ))}
        </div>
      )}

      {isCreateOpen && (
        <CreateShipmentModal
          isPending={createShipment.isPending}
          lines={remaining}
          onClose={() => {
            if (!createShipment.isPending) setIsCreateOpen(false);
          }}
          onSubmit={(values) =>
            createShipment.mutate(values, {
              onError: (error) =>
                notify.error(error, 'Unable to create the shipment'),
              onSuccess: () => {
                notify.success('Shipment created');
                setIsCreateOpen(false);
              },
            })
          }
        />
      )}

      {statusTarget && (
        <AdvanceStatusModal
          isPending={updateStatus.isPending}
          target={statusTarget}
          onClose={() => {
            if (!updateStatus.isPending) setStatusTarget(null);
          }}
          onSubmit={(values) =>
            updateStatus.mutate(
              { shipmentId: statusTarget.shipment.id, values },
              {
                onError: (error) =>
                  notify.error(error, 'Unable to update the shipment'),
                onSuccess: () => {
                  notify.success(
                    `Shipment marked ${statusLabel(statusTarget.status).toLowerCase()}`,
                  );
                  setStatusTarget(null);
                },
              },
            )
          }
        />
      )}
    </section>
  );
}

function ShipmentCard({
  isPending,
  onAdvance,
  order,
  shipment,
}: {
  isPending: boolean;
  onAdvance: (status: ShipmentStatus) => void;
  order: Order;
  shipment: Shipment;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const forward = forwardStatuses(shipment.status);
  const halt = haltStatuses(shipment.status);
  const itemNames = new Map(order.items.map((item) => [item.id, item.name]));

  return (
    <div className="rounded-xl border border-separator p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm font-semibold">
              {shipment.shipmentNumber}
            </p>
            <ShipmentStatusBadge status={shipment.status} />
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {shipment.carrierName || 'No carrier recorded'}
            {shipment.trackingNumber ? ' · ' : ''}
            {shipment.trackingNumber &&
              (shipment.trackingUrl ? (
                <a
                  className="font-medium text-accent hover:underline"
                  href={shipment.trackingUrl}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  {shipment.trackingNumber}
                </a>
              ) : (
                shipment.trackingNumber
              ))}
          </p>
        </div>

        {isLive(shipment) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {forward.map((status) => (
              <Button
                isDisabled={isPending}
                key={status}
                type="button"
                size="sm"
                variant="secondary"
                onPress={() => onAdvance(status)}
              >
                Mark {statusLabel(status).toLowerCase()}
              </Button>
            ))}
            {halt.map((status) => (
              <Button
                isDisabled={isPending}
                key={status}
                type="button"
                size="sm"
                variant="danger-soft"
                onPress={() => onAdvance(status)}
              >
                {statusLabel(status).toLowerCase()}
              </Button>
            ))}
          </div>
        )}
      </div>

      <ul className="mt-3 space-y-1 text-xs text-muted">
        {shipment.items.map((item) => (
          <li key={item.id}>
            {item.quantity} × {itemNames.get(item.orderItemId) ?? 'Order line'}
          </li>
        ))}
      </ul>

      {shipment.events.length > 0 && (
        <div className="mt-3 border-t border-separator pt-3">
          <button
            className="flex items-center gap-1.5 text-xs font-semibold text-accent"
            type="button"
            onClick={() => setShowHistory((current) => !current)}
          >
            <Icon
              className={`size-3.5 transition-transform ${showHistory ? 'rotate-180' : ''}`}
              icon="gravity-ui:chevron-down"
            />
            {showHistory ? 'Hide' : 'Show'} tracking history (
            {shipment.events.length})
          </button>

          {showHistory && (
            <ol className="mt-3 space-y-3">
              {[...shipment.events]
                .sort(
                  (left, right) =>
                    new Date(right.occurredAt).getTime() -
                    new Date(left.occurredAt).getTime(),
                )
                .map((event) => (
                  <li
                    className="flex gap-3"
                    key={`${event.status}-${event.occurredAt}`}
                  >
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold">
                        {statusLabel(event.status)}
                        {event.location ? ` · ${event.location}` : ''}
                      </p>
                      {event.message && (
                        <p className="mt-0.5 text-xs text-muted">
                          {event.message}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-muted">
                        {formatDate(event.occurredAt)}
                      </p>
                    </div>
                  </li>
                ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

function CreateShipmentModal({
  isPending,
  lines,
  onClose,
  onSubmit,
}: {
  isPending: boolean;
  lines: Array<{ item: Order['items'][number]; remaining: number }>;
  onClose: () => void;
  onSubmit: (values: {
    carrierName: string;
    items?: Array<{ orderItemId: string; quantity: number }>;
    note: string;
    trackingNumber: string;
    trackingUrl: string;
  }) => void;
}) {
  const shippable = lines.filter((line) => line.remaining > 0);
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      shippable.map((line) => [line.item.id, line.remaining]),
    ),
  );
  const [carrierName, setCarrierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [note, setNote] = useState('');

  const isEverythingRemaining = shippable.every(
    (line) => quantities[line.item.id] === line.remaining,
  );
  const total = shippable.reduce(
    (sum, line) => sum + (quantities[line.item.id] ?? 0),
    0,
  );

  const submit = () => {
    if (total < 1) {
      notify.warning('Choose at least one unit to ship');
      return;
    }

    onSubmit({
      carrierName,
      note,
      trackingNumber,
      trackingUrl,
      // Omitting items is the documented way to ship every remaining unit, so
      // the default selection sends no array at all.
      ...(isEverythingRemaining
        ? {}
        : {
            items: shippable
              .filter((line) => (quantities[line.item.id] ?? 0) > 0)
              .map((line) => ({
                orderItemId: line.item.id,
                quantity: quantities[line.item.id] ?? 0,
              })),
          }),
    });
  };

  return (
    <Modal>
      <Modal.Backdrop
        isOpen
        className="bg-black/55 backdrop-blur-sm"
        variant="blur"
        onOpenChange={(isOpen) => {
          if (!isOpen) onClose();
        }}
      >
        <Modal.Container
          className="items-end p-0 sm:items-center sm:p-4"
          scroll="inside"
          size="lg"
        >
          <Modal.Dialog className="max-h-[92dvh] w-full overflow-hidden rounded-t-3xl border border-separator bg-surface shadow-2xl sm:rounded-2xl">
            <Form
              className="contents"
              validationBehavior="native"
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <Modal.CloseTrigger className="absolute right-4 top-4 rounded-full border border-separator bg-surface p-2 text-muted transition hover:bg-surface-secondary hover:text-foreground" />
              <Modal.Header className="border-b border-separator px-5 py-5 sm:px-6">
                <div className="min-w-0 pr-10">
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                    Fulfilment
                  </p>
                  <Modal.Heading className="mt-1 text-xl font-semibold tracking-tight">
                    Create shipment
                  </Modal.Heading>
                  <p className="mt-2 text-sm leading-5 text-muted">
                    Ship everything that is left, or lower a quantity to send a
                    partial shipment.
                  </p>
                </div>
              </Modal.Header>

              <Modal.Body className="max-h-[65dvh] space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                <div className="space-y-2">
                  {shippable.map((line) => (
                    <div
                      className="flex items-center justify-between gap-4 rounded-xl border border-separator px-4 py-3"
                      key={line.item.id}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {line.item.name}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-muted">
                          {line.item.sku} · {line.remaining} of{' '}
                          {line.item.quantity} left to ship
                        </p>
                      </div>
                      <Input
                        className="w-20 shrink-0"
                        inputMode="numeric"
                        value={String(quantities[line.item.id] ?? 0)}
                        variant="secondary"
                        onChange={(event) => {
                          const next = Number(event.target.value);
                          setQuantities((current) => ({
                            ...current,
                            [line.item.id]: Number.isInteger(next)
                              ? Math.min(Math.max(next, 0), line.remaining)
                              : 0,
                          }));
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <LabelledInput
                    label="Carrier"
                    value={carrierName}
                    onChange={setCarrierName}
                  />
                  <LabelledInput
                    label="Tracking number"
                    value={trackingNumber}
                    onChange={setTrackingNumber}
                  />
                  <LabelledInput
                    className="sm:col-span-2"
                    label="Tracking URL"
                    value={trackingUrl}
                    onChange={setTrackingUrl}
                  />
                  <LabelledInput
                    className="sm:col-span-2"
                    label="Internal note"
                    value={note}
                    onChange={setNote}
                  />
                </div>
              </Modal.Body>

              <Modal.Footer className="border-t border-separator bg-surface px-5 py-4 sm:px-6">
                <div className="flex w-full flex-col-reverse items-center gap-2 sm:flex-row sm:justify-between">
                  <p className="text-xs text-muted">
                    Shipping {total} unit{total === 1 ? '' : 's'}
                  </p>
                  <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
                    <Button
                      isDisabled={isPending}
                      type="button"
                      variant="secondary"
                      onPress={onClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      isDisabled={isPending}
                      type="submit"
                      variant="primary"
                    >
                      {isPending ? 'Creating...' : 'Create shipment'}
                    </Button>
                  </div>
                </div>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function AdvanceStatusModal({
  isPending,
  onClose,
  onSubmit,
  target,
}: {
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: {
    location: string;
    message: string;
    status: ShipmentStatus;
  }) => void;
  target: StatusTarget;
}) {
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState('');

  return (
    <Modal>
      <Modal.Backdrop
        isOpen
        className="bg-black/55 backdrop-blur-sm"
        variant="blur"
        onOpenChange={(isOpen) => {
          if (!isOpen) onClose();
        }}
      >
        <Modal.Container className="p-4" scroll="inside" size="sm">
          <Modal.Dialog className="w-full overflow-hidden rounded-2xl border border-separator bg-surface shadow-2xl">
            <Form
              className="contents"
              validationBehavior="native"
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit({ location, message, status: target.status });
              }}
            >
              <Modal.Header className="border-b border-separator px-5 py-5">
                <Modal.Heading className="text-lg font-semibold tracking-tight">
                  Mark {statusLabel(target.status).toLowerCase()}
                </Modal.Heading>
                <p className="mt-2 text-sm leading-5 text-muted">
                  This is added to {target.shipment.shipmentNumber}&apos;s
                  tracking history, which the shopper can see.
                </p>
              </Modal.Header>

              <Modal.Body className="space-y-4 px-5 py-5">
                <LabelledInput
                  label="Message"
                  placeholder="Left the warehouse"
                  value={message}
                  onChange={setMessage}
                />
                <LabelledInput
                  label="Location"
                  placeholder="Phnom Penh"
                  value={location}
                  onChange={setLocation}
                />
              </Modal.Body>

              <Modal.Footer className="border-t border-separator bg-surface px-5 py-4">
                <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    isDisabled={isPending}
                    type="button"
                    variant="secondary"
                    onPress={onClose}
                  >
                    Cancel
                  </Button>
                  <Button isDisabled={isPending} type="submit" variant="primary">
                    {isPending ? 'Updating...' : 'Update shipment'}
                  </Button>
                </div>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function LabelledInput({
  className,
  label,
  onChange,
  placeholder,
  value,
}: {
  className?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <Label className={`grid gap-1.5 ${className ?? ''}`}>
      <span className="text-sm font-medium text-slate-700 dark:text-zinc-200">
        {label}
      </span>
      <Input
        placeholder={placeholder}
        value={value}
        variant="secondary"
        onChange={(event) => onChange(event.target.value)}
      />
    </Label>
  );
}
