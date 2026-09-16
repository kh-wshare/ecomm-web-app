'use client';

import { Checkbox, Form, ListBox, Modal, Select, Tooltip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useMemo, useState } from 'react';

import { Button, Chip, ConfirmDialog, Input, Label } from '@repo/ui';

import { Select as FilterSelect } from '@/components/products/product-controls';
import { useBranches } from '@/hooks/api/use-branches';
import {
  useArchiveDeliveryMethod,
  useArchiveDeliveryZone,
  useDeliveryMethods,
  useSaveDeliveryMethod,
  useSaveDeliveryZone,
} from '@/hooks/api/use-delivery-methods';
import { usePermissions } from '@/hooks/use-permissions';
import { formatCurrency } from '@/lib/formatters/currency';
import { notify } from '@/lib/toast/notify';
import type {
  DeliveryMethod,
  DeliveryMethodStatus,
  DeliveryMethodType,
  DeliveryMethodValues,
  DeliveryZone,
  DeliveryZoneValues,
} from '@/types/delivery';

const emptyMethodValues: DeliveryMethodValues = {
  branchId: '',
  code: '',
  description: '',
  isDefault: false,
  name: '',
  sortOrder: 0,
  status: 'ACTIVE',
  type: 'DELIVERY',
};

const emptyZoneValues: DeliveryZoneValues = {
  baseFee: '',
  cities: '',
  countries: '',
  estimatedMaxDays: '',
  estimatedMinDays: '',
  freeOverSubtotal: '',
  isFallback: false,
  maxSubtotal: '',
  minSubtotal: '',
  name: '',
  perItemFee: '',
  postalCodes: '',
  provinces: '',
  sortOrder: '0',
};

const emptyMethods: DeliveryMethod[] = [];

type ZoneEditorTarget = {
  method: DeliveryMethod;
  zone: DeliveryZone | null;
};

export function DeliveryMethodManager() {
  const { can } = usePermissions();
  const canManage = can('delivery.manage');

  const [statusFilter, setStatusFilter] = useState<DeliveryMethodStatus | 'ALL'>(
    'ALL',
  );
  const [typeFilter, setTypeFilter] = useState<DeliveryMethodType | 'ALL'>(
    'ALL',
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [methodValues, setMethodValues] =
    useState<DeliveryMethodValues>(emptyMethodValues);
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [zoneTarget, setZoneTarget] = useState<ZoneEditorTarget | null>(null);
  const [zoneValues, setZoneValues] =
    useState<DeliveryZoneValues>(emptyZoneValues);
  const [pendingArchiveMethod, setPendingArchiveMethod] =
    useState<DeliveryMethod | null>(null);
  const [pendingArchiveZone, setPendingArchiveZone] =
    useState<ZoneEditorTarget | null>(null);

  const filters = useMemo(
    () => ({
      ...(statusFilter === 'ALL' ? {} : { status: statusFilter }),
      ...(typeFilter === 'ALL' ? {} : { type: typeFilter }),
    }),
    [statusFilter, typeFilter],
  );

  const methodsQuery = useDeliveryMethods(filters, canManage);
  const saveMethod = useSaveDeliveryMethod();
  const archiveMethod = useArchiveDeliveryMethod();
  const saveZone = useSaveDeliveryZone();
  const archiveZone = useArchiveDeliveryZone();

  const methods = methodsQuery.data ?? emptyMethods;
  const editingMethod = useMemo(
    () => methods.find((method) => method.id === editingMethodId) ?? null,
    [methods, editingMethodId],
  );

  const openCreateMethod = () => {
    setEditingMethodId(null);
    setMethodValues(emptyMethodValues);
    setIsMethodModalOpen(true);
  };
  const openEditMethod = (method: DeliveryMethod) => {
    setEditingMethodId(method.id);
    setMethodValues(toMethodValues(method));
    setIsMethodModalOpen(true);
  };
  const closeMethodModal = () => {
    if (saveMethod.isPending) return;
    setIsMethodModalOpen(false);
    setEditingMethodId(null);
    setMethodValues(emptyMethodValues);
  };
  const submitMethod = () => {
    if (!methodValues.name.trim() || !methodValues.code.trim()) {
      notify.warning('Method name and code are required');
      return;
    }

    saveMethod.mutate(
      { deliveryMethodId: editingMethod?.id, values: methodValues },
      {
        onError: (error) =>
          notify.error(error, 'Unable to save the delivery method'),
        onSuccess: () => {
          notify.success(
            editingMethod ? 'Delivery method updated' : 'Delivery method created',
          );
          closeMethodModal();
        },
      },
    );
  };

  const openCreateZone = (method: DeliveryMethod) => {
    setZoneTarget({ method, zone: null });
    setZoneValues(emptyZoneValues);
  };
  const openEditZone = (method: DeliveryMethod, zone: DeliveryZone) => {
    setZoneTarget({ method, zone });
    setZoneValues(toZoneValues(zone));
  };
  const closeZoneModal = () => {
    if (saveZone.isPending) return;
    setZoneTarget(null);
    setZoneValues(emptyZoneValues);
  };
  const submitZone = () => {
    if (!zoneTarget) return;
    if (!zoneValues.name.trim()) {
      notify.warning('Zone name is required');
      return;
    }

    saveZone.mutate(
      {
        deliveryMethodId: zoneTarget.method.id,
        values: zoneValues,
        ...(zoneTarget.zone ? { zoneId: zoneTarget.zone.id } : {}),
      },
      {
        onError: (error) => notify.error(error, 'Unable to save the zone'),
        onSuccess: () => {
          notify.success(zoneTarget.zone ? 'Zone updated' : 'Zone added');
          closeZoneModal();
        },
      },
    );
  };

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-warning/30 bg-warning/10 p-6 text-sm">
        You do not have permission to manage delivery methods.
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent">Settings</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Delivery
          </h2>
          <p className="mt-2 text-sm text-muted">
            Set the shipping and pickup options shoppers can choose, and the
            zones that price them.
          </p>
        </div>
        <Button type="button" variant="primary" onPress={openCreateMethod}>
          New delivery method
        </Button>
      </header>

      <div className="grid gap-3 rounded-2xl border border-separator bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as DeliveryMethodStatus | 'ALL')
          }
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </FilterSelect>
        <FilterSelect
          label="Type"
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value as DeliveryMethodType | 'ALL')
          }
        >
          <option value="ALL">All types</option>
          <option value="DELIVERY">Delivery</option>
          <option value="PICKUP">Pickup</option>
        </FilterSelect>
      </div>

      {methodsQuery.isPending ? (
        <PanelState
          icon="gravity-ui:arrows-rotate-right"
          iconClassName="animate-spin text-muted"
          title="Loading delivery methods"
        />
      ) : methodsQuery.isError ? (
        <PanelState
          icon="gravity-ui:circle-xmark"
          iconClassName="text-danger"
          title="Delivery methods are unavailable"
          description={methodsQuery.error.message}
          action={
            <Button
              type="button"
              variant="primary"
              onPress={() => methodsQuery.refetch()}
            >
              Try again
            </Button>
          }
        />
      ) : methods.length === 0 ? (
        <PanelState
          icon="gravity-ui:truck"
          iconClassName="text-muted"
          title="No delivery methods yet"
          description={
            statusFilter === 'ALL' && typeFilter === 'ALL'
              ? 'Shoppers cannot check out until at least one method exists. Create one to get started.'
              : 'No delivery methods match these filters.'
          }
          action={
            statusFilter === 'ALL' && typeFilter === 'ALL' ? (
              <Button type="button" variant="primary" onPress={openCreateMethod}>
                Create delivery method
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-3">
          {methods.map((method) => (
            <MethodCard
              isExpanded={expandedId === method.id}
              key={method.id}
              method={method}
              onAddZone={() => openCreateZone(method)}
              onArchive={() => setPendingArchiveMethod(method)}
              onArchiveZone={(zone) =>
                setPendingArchiveZone({ method, zone })
              }
              onEdit={() => openEditMethod(method)}
              onEditZone={(zone) => openEditZone(method, zone)}
              onToggle={() =>
                setExpandedId((current) =>
                  current === method.id ? null : method.id,
                )
              }
            />
          ))}
        </div>
      )}

      {isMethodModalOpen && (
        <MethodFormModal
          editingMethod={editingMethod}
          isPending={saveMethod.isPending}
          values={methodValues}
          onClose={closeMethodModal}
          onSubmit={submitMethod}
          onUpdate={(field, value) =>
            setMethodValues((current) => ({ ...current, [field]: value }))
          }
        />
      )}

      {zoneTarget && (
        <ZoneFormModal
          isPending={saveZone.isPending}
          target={zoneTarget}
          values={zoneValues}
          onClose={closeZoneModal}
          onSubmit={submitZone}
          onUpdate={(field, value) =>
            setZoneValues((current) => ({ ...current, [field]: value }))
          }
        />
      )}

      <ConfirmDialog
        confirmLabel="Archive method"
        description={
          pendingArchiveMethod
            ? `Archiving "${pendingArchiveMethod.name}" also archives its ${pendingArchiveMethod.zones.length} zone${pendingArchiveMethod.zones.length === 1 ? '' : 's'}. Shoppers will stop seeing it at checkout.`
            : ''
        }
        isPending={archiveMethod.isPending}
        open={Boolean(pendingArchiveMethod)}
        title="Archive delivery method?"
        onCancel={() => setPendingArchiveMethod(null)}
        onConfirm={() => {
          if (!pendingArchiveMethod) return;
          archiveMethod.mutate(pendingArchiveMethod.id, {
            onError: (error) =>
              notify.error(error, 'Unable to archive the delivery method'),
            onSuccess: () => {
              notify.success('Delivery method archived');
              setPendingArchiveMethod(null);
            },
          });
        }}
      />

      <ConfirmDialog
        confirmLabel="Archive zone"
        description={
          pendingArchiveZone
            ? `"${pendingArchiveZone.zone?.name}" will stop pricing deliveries for this method.`
            : ''
        }
        isPending={archiveZone.isPending}
        open={Boolean(pendingArchiveZone)}
        title="Archive delivery zone?"
        onCancel={() => setPendingArchiveZone(null)}
        onConfirm={() => {
          if (!pendingArchiveZone?.zone) return;
          archiveZone.mutate(
            {
              deliveryMethodId: pendingArchiveZone.method.id,
              zoneId: pendingArchiveZone.zone.id,
            },
            {
              onError: (error) =>
                notify.error(error, 'Unable to archive the zone'),
              onSuccess: () => {
                notify.success('Zone archived');
                setPendingArchiveZone(null);
              },
            },
          );
        }}
      />
    </section>
  );
}

function MethodCard({
  isExpanded,
  method,
  onAddZone,
  onArchive,
  onArchiveZone,
  onEdit,
  onEditZone,
  onToggle,
}: {
  isExpanded: boolean;
  method: DeliveryMethod;
  onAddZone: () => void;
  onArchive: () => void;
  onArchiveZone: (zone: DeliveryZone) => void;
  onEdit: () => void;
  onEditZone: (zone: DeliveryZone) => void;
  onToggle: () => void;
}) {
  const fallbackZones = method.zones.filter((zone) => zone.isFallback);
  const warnings = zoneWarnings(method, fallbackZones.length);

  return (
    <div className="overflow-hidden rounded-2xl border border-separator bg-surface">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold">{method.name}</p>
            <Chip color="accent" size="sm" variant="soft">
              {method.type === 'PICKUP' ? 'Pickup' : 'Delivery'}
            </Chip>
            <Chip
              color={method.status === 'ACTIVE' ? 'success' : 'warning'}
              size="sm"
              variant="soft"
            >
              {method.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </Chip>
            {method.isDefault && (
              <Chip color="accent" size="sm" variant="soft">
                Default
              </Chip>
            )}
          </div>
          <p className="mt-1 font-mono text-xs font-semibold text-muted">
            {method.code}
          </p>
          {method.description && (
            <p className="mt-2 max-w-xl text-sm text-muted">
              {method.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="tertiary"
            onPress={onToggle}
          >
            <Icon
              className={`size-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              icon="gravity-ui:chevron-down"
            />
            {method.zones.length} zone{method.zones.length === 1 ? '' : 's'}
          </Button>
          <Tooltip delay={0}>
            <Button
              type="button"
              isIconOnly
              size="sm"
              variant="tertiary"
              onPress={onEdit}
            >
              <Icon className="size-4" icon="gravity-ui:pencil" />
            </Button>
            <Tooltip.Content>
              <p>Edit method</p>
            </Tooltip.Content>
          </Tooltip>
          <Tooltip delay={0}>
            <Button
              type="button"
              isIconOnly
              size="sm"
              variant="danger-soft"
              onPress={onArchive}
            >
              <Icon className="size-4" icon="gravity-ui:trash-bin" />
            </Button>
            <Tooltip.Content>
              <p>Archive method</p>
            </Tooltip.Content>
          </Tooltip>
        </div>
      </div>

      {warnings.map((warning) => (
        <div
          className="flex items-start gap-2 border-t border-warning/30 bg-warning/10 px-5 py-3 text-xs"
          key={warning}
        >
          <Icon
            className="mt-0.5 size-4 shrink-0 text-warning-foreground"
            icon="gravity-ui:triangle-exclamation"
          />
          <p>{warning}</p>
        </div>
      ))}

      {isExpanded && (
        <div className="border-t border-separator bg-surface-secondary/30 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Zones</p>
              <p className="mt-1 text-xs text-muted">
                The first zone that matches a shopper&apos;s address sets the
                fee. Ties are broken by sort order.
              </p>
            </div>
            <Button type="button" size="sm" variant="secondary" onPress={onAddZone}>
              Add zone
            </Button>
          </div>

          {method.zones.length === 0 ? (
            <p className="rounded-xl border border-dashed border-separator px-4 py-6 text-center text-sm text-muted">
              No zones yet. Without one this method can never be priced, so
              shoppers will not see it.
            </p>
          ) : (
            <div className="space-y-2">
              {[...method.zones]
                .sort((left, right) => left.sortOrder - right.sortOrder)
                .map((zone) => (
                  <ZoneRow
                    key={zone.id}
                    zone={zone}
                    onArchive={() => onArchiveZone(zone)}
                    onEdit={() => onEditZone(zone)}
                  />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ZoneRow({
  onArchive,
  onEdit,
  zone,
}: {
  onArchive: () => void;
  onEdit: () => void;
  zone: DeliveryZone;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-separator bg-surface p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold">{zone.name}</p>
          {zone.isFallback && (
            <Chip color="warning" size="sm" variant="soft">
              Fallback
            </Chip>
          )}
        </div>
        <p className="mt-1 text-xs text-muted">{matchSummary(zone)}</p>
        <p className="mt-2 text-xs text-muted">{pricingSummary(zone)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Tooltip delay={0}>
          <Button
            type="button"
            isIconOnly
            size="sm"
            variant="tertiary"
            onPress={onEdit}
          >
            <Icon className="size-4" icon="gravity-ui:pencil" />
          </Button>
          <Tooltip.Content>
            <p>Edit zone</p>
          </Tooltip.Content>
        </Tooltip>
        <Tooltip delay={0}>
          <Button
            type="button"
            isIconOnly
            size="sm"
            variant="danger-soft"
            onPress={onArchive}
          >
            <Icon className="size-4" icon="gravity-ui:trash-bin" />
          </Button>
          <Tooltip.Content>
            <p>Archive zone</p>
          </Tooltip.Content>
        </Tooltip>
      </div>
    </div>
  );
}

function MethodFormModal({
  editingMethod,
  isPending,
  onClose,
  onSubmit,
  onUpdate,
  values,
}: {
  editingMethod: DeliveryMethod | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onUpdate: <Key extends keyof DeliveryMethodValues>(
    field: Key,
    value: DeliveryMethodValues[Key],
  ) => void;
  values: DeliveryMethodValues;
}) {
  const isPickup = values.type === 'PICKUP';
  const branchesQuery = useBranches({ status: 'ACTIVE' });
  const branches = branchesQuery.data ?? [];

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
                onSubmit();
              }}
            >
              <Modal.CloseTrigger className="absolute right-4 top-4 rounded-full border border-separator bg-surface p-2 text-muted transition hover:bg-surface-secondary hover:text-foreground" />
              <Modal.Header className="border-b border-separator px-5 py-5 sm:px-6">
                <div className="min-w-0 pr-10">
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                    Delivery settings
                  </p>
                  <Modal.Heading className="mt-1 text-xl font-semibold tracking-tight">
                    {editingMethod ? 'Edit delivery method' : 'New delivery method'}
                  </Modal.Heading>
                  <p className="mt-2 text-sm leading-5 text-muted">
                    The code identifies this method in orders and reporting, so
                    keep it short and stable.
                  </p>
                </div>
              </Modal.Header>

              <Modal.Body className="max-h-[65dvh] overflow-y-auto px-5 py-5 sm:px-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Method name"
                    required
                    value={values.name}
                    onChange={(value) => onUpdate('name', value)}
                  />
                  <Field
                    label="Code"
                    required
                    value={values.code}
                    onChange={(value) => onUpdate('code', value)}
                    onBlur={() =>
                      onUpdate('code', values.code.trim().toUpperCase())
                    }
                  />
                  <Field
                    className="sm:col-span-2"
                    label="Description"
                    value={values.description}
                    onChange={(value) => onUpdate('description', value)}
                  />
                  <ChoiceSelect
                    label="Type"
                    options={[
                      { label: 'Delivery', value: 'DELIVERY' },
                      { label: 'Pickup', value: 'PICKUP' },
                    ]}
                    value={values.type}
                    onChange={(value) =>
                      onUpdate('type', value as DeliveryMethodType)
                    }
                  />
                  <ChoiceSelect
                    label="Status"
                    options={[
                      { label: 'Active', value: 'ACTIVE' },
                      { label: 'Inactive', value: 'INACTIVE' },
                    ]}
                    value={values.status}
                    onChange={(value) =>
                      onUpdate('status', value as DeliveryMethodStatus)
                    }
                  />
                  {isPickup && (
                    <ChoiceSelect
                      className="sm:col-span-2"
                      label="Collection branch"
                      options={[
                        { label: 'No branch', value: '' },
                        ...branches.map((branch) => ({
                          label: branch.name,
                          value: branch.id,
                        })),
                      ]}
                      value={values.branchId}
                      onChange={(value) => onUpdate('branchId', value)}
                    />
                  )}
                  <Field
                    label="Sort order"
                    inputMode="numeric"
                    value={String(values.sortOrder)}
                    onChange={(value) =>
                      onUpdate('sortOrder', Number(value) || 0)
                    }
                  />
                  <Checkbox
                    className="self-end"
                    isSelected={values.isDefault}
                    variant="secondary"
                    onChange={(isSelected) => onUpdate('isDefault', isSelected)}
                  >
                    <Checkbox.Content className="flex h-11 items-center gap-3 rounded-lg border border-separator bg-background px-3">
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <span className="text-sm">Preselect at checkout</span>
                    </Checkbox.Content>
                  </Checkbox>
                </div>
              </Modal.Body>

              <Modal.Footer className="border-t border-separator bg-surface px-5 py-4 sm:px-6">
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
                    {isPending ? 'Saving...' : 'Save method'}
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

function ZoneFormModal({
  isPending,
  onClose,
  onSubmit,
  onUpdate,
  target,
  values,
}: {
  isPending: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onUpdate: <Key extends keyof DeliveryZoneValues>(
    field: Key,
    value: DeliveryZoneValues[Key],
  ) => void;
  target: ZoneEditorTarget;
  values: DeliveryZoneValues;
}) {
  const preview = previewFee(values, 42, 3);

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
                onSubmit();
              }}
            >
              <Modal.CloseTrigger className="absolute right-4 top-4 rounded-full border border-separator bg-surface p-2 text-muted transition hover:bg-surface-secondary hover:text-foreground" />
              <Modal.Header className="border-b border-separator px-5 py-5 sm:px-6">
                <div className="min-w-0 pr-10">
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                    {target.method.name}
                  </p>
                  <Modal.Heading className="mt-1 text-xl font-semibold tracking-tight">
                    {target.zone ? 'Edit zone' : 'Add zone'}
                  </Modal.Heading>
                  <p className="mt-2 text-sm leading-5 text-muted">
                    A zone decides both where this method is offered and what it
                    costs.
                  </p>
                </div>
              </Modal.Header>

              <Modal.Body className="max-h-[65dvh] space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    className="sm:col-span-2"
                    label="Zone name"
                    required
                    value={values.name}
                    onChange={(value) => onUpdate('name', value)}
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold">Where it applies</p>
                  <p className="mt-1 text-xs text-muted">
                    Comma separated. Leave a field empty to match any value.
                  </p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Countries"
                      hint="ISO codes, e.g. KH, TH"
                      value={values.countries}
                      onChange={(value) => onUpdate('countries', value)}
                    />
                    <Field
                      label="Provinces"
                      value={values.provinces}
                      onChange={(value) => onUpdate('provinces', value)}
                    />
                    <Field
                      label="Cities"
                      value={values.cities}
                      onChange={(value) => onUpdate('cities', value)}
                    />
                    <Field
                      label="Postal codes"
                      value={values.postalCodes}
                      onChange={(value) => onUpdate('postalCodes', value)}
                    />
                  </div>
                  <Checkbox
                    className="mt-4"
                    isSelected={values.isFallback}
                    variant="secondary"
                    onChange={(isSelected) => onUpdate('isFallback', isSelected)}
                  >
                    <Checkbox.Content className="flex items-center gap-3 rounded-lg border border-separator bg-background px-3 py-2.5">
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <span className="text-sm">
                        Use as fallback — applies only when no other zone matched
                      </span>
                    </Checkbox.Content>
                  </Checkbox>
                </div>

                <div>
                  <p className="text-sm font-semibold">What it costs</p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Base fee"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={values.baseFee}
                      onChange={(value) => onUpdate('baseFee', value)}
                    />
                    <Field
                      label="Per item fee"
                      hint="Charged once per unit in the cart"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={values.perItemFee}
                      onChange={(value) => onUpdate('perItemFee', value)}
                    />
                    <Field
                      label="Free over subtotal"
                      hint="Leave empty for no free threshold"
                      inputMode="decimal"
                      value={values.freeOverSubtotal}
                      onChange={(value) => onUpdate('freeOverSubtotal', value)}
                    />
                    <Field
                      label="Sort order"
                      inputMode="numeric"
                      value={values.sortOrder}
                      onChange={(value) => onUpdate('sortOrder', value)}
                    />
                    <Field
                      label="Minimum subtotal"
                      hint="Not offered below this"
                      inputMode="decimal"
                      value={values.minSubtotal}
                      onChange={(value) => onUpdate('minSubtotal', value)}
                    />
                    <Field
                      label="Maximum subtotal"
                      hint="Not offered above this"
                      inputMode="decimal"
                      value={values.maxSubtotal}
                      onChange={(value) => onUpdate('maxSubtotal', value)}
                    />
                    <Field
                      label="Fastest, in days"
                      inputMode="numeric"
                      value={values.estimatedMinDays}
                      onChange={(value) => onUpdate('estimatedMinDays', value)}
                    />
                    <Field
                      label="Slowest, in days"
                      inputMode="numeric"
                      value={values.estimatedMaxDays}
                      onChange={(value) => onUpdate('estimatedMaxDays', value)}
                    />
                  </div>

                  <div className="mt-4 rounded-xl border border-separator bg-surface-secondary/40 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      A 3 item, $42.00 cart
                    </p>
                    <p className="mt-1.5 text-sm font-semibold">
                      {preview.offered
                        ? `${formatCurrency(preview.fee)} shipping`
                        : 'This zone would not be offered'}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {preview.explanation}
                    </p>
                  </div>
                </div>
              </Modal.Body>

              <Modal.Footer className="border-t border-separator bg-surface px-5 py-4 sm:px-6">
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
                    {isPending ? 'Saving...' : 'Save zone'}
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

function Field({
  className,
  hint,
  inputMode,
  label,
  onBlur,
  onChange,
  placeholder,
  required,
  value,
}: {
  className?: string;
  hint?: string;
  inputMode?: 'decimal' | 'numeric';
  label: string;
  onBlur?: () => void;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
}) {
  return (
    <Label className={`grid gap-1.5 ${className ?? ''}`}>
      <span className="text-sm font-medium text-slate-700 dark:text-zinc-200">
        {label}
      </span>
      <Input
        inputMode={inputMode}
        placeholder={placeholder}
        required={required}
        value={value}
        variant="secondary"
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </Label>
  );
}

// HeroUI's Select keys its items, and an empty string is not a usable key, so
// "no selection" travels through a sentinel the same way the shared product
// Select handles it.
const NO_SELECTION = '__none__';

function ChoiceSelect({
  className,
  label,
  onChange,
  options,
  value,
}: {
  className?: string;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <Select
      className={`w-full ${className ?? ''}`}
      value={value === '' ? NO_SELECTION : value}
      variant="secondary"
      onChange={(nextValue) => {
        const next = String(nextValue ?? '');
        onChange(next === NO_SELECTION ? '' : next);
      }}
    >
      <Label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-200">
        {label}
      </Label>
      <Select.Trigger className="h-11 rounded-lg border border-separator bg-background px-3 text-sm shadow-none">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover className="rounded-xl border border-separator bg-surface p-1 shadow-xl">
        <ListBox>
          {options.map((option) => (
            <ListBox.Item
              className="rounded-lg px-3 py-2 text-sm outline-none transition hover:bg-surface-secondary data-[focused=true]:bg-surface-secondary"
              id={option.value === '' ? NO_SELECTION : option.value}
              key={option.value || NO_SELECTION}
              textValue={option.label}
            >
              <span>{option.label}</span>
              <ListBox.ItemIndicator className="text-accent" />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

function PanelState({
  action,
  description,
  icon,
  iconClassName,
  title,
}: {
  action?: React.ReactNode;
  description?: string;
  icon: string;
  iconClassName?: string;
  title: string;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-2xl border border-separator bg-surface p-10 text-center">
      <Icon className={`size-6 ${iconClassName ?? ''}`} icon={icon} />
      <div className="space-y-1">
        <div className="text-sm font-semibold">{title}</div>
        {description && (
          <div className="max-w-sm text-xs text-muted">{description}</div>
        )}
      </div>
      {action}
    </div>
  );
}

function zoneWarnings(method: DeliveryMethod, fallbackCount: number) {
  const warnings: string[] = [];

  if (method.type === 'DELIVERY' && method.zones.length > 0 && fallbackCount === 0) {
    warnings.push(
      'No fallback zone. Shoppers whose address matches none of the zones below will see no delivery option at all, and cannot check out with this method.',
    );
  }
  if (fallbackCount > 1) {
    warnings.push(
      `${fallbackCount} zones are marked as fallback, but only the first one can ever apply. Clear the flag on the others.`,
    );
  }
  if (method.type === 'PICKUP' && !method.branchId) {
    warnings.push(
      'No collection branch is set, so shoppers are not told where to collect their order.',
    );
  }

  return warnings;
}

function matchSummary(zone: DeliveryZone) {
  const parts = [
    describeMatch('Countries', zone.countries),
    describeMatch('Provinces', zone.provinces),
    describeMatch('Cities', zone.cities),
    describeMatch('Postal codes', zone.postalCodes),
  ].filter(Boolean);

  return parts.length ? parts.join(' · ') : 'Matches any address';
}

function describeMatch(label: string, values: string[]) {
  if (values.length === 0) return '';

  return `${label}: ${values.slice(0, 3).join(', ')}${values.length > 3 ? ` +${values.length - 3}` : ''}`;
}

function pricingSummary(zone: DeliveryZone) {
  const parts = [`Base ${formatCurrency(zone.baseFee)}`];

  if (Number(zone.perItemFee) > 0) {
    parts.push(`${formatCurrency(zone.perItemFee)} per item`);
  }
  if (zone.freeOverSubtotal) {
    parts.push(`free over ${formatCurrency(zone.freeOverSubtotal)}`);
  }
  if (zone.minSubtotal) {
    parts.push(`from ${formatCurrency(zone.minSubtotal)}`);
  }
  if (zone.maxSubtotal) {
    parts.push(`up to ${formatCurrency(zone.maxSubtotal)}`);
  }
  if (zone.estimatedMinDays !== null || zone.estimatedMaxDays !== null) {
    parts.push(
      `${zone.estimatedMinDays ?? 0}–${zone.estimatedMaxDays ?? zone.estimatedMinDays ?? 0} days`,
    );
  }

  return parts.join(' · ');
}

// Mirrors the pricing rules the zone fields describe, so the merchant can see
// what a shopper would be charged before saving.
function previewFee(
  values: DeliveryZoneValues,
  subtotal: number,
  itemCount: number,
) {
  const base = Number(values.baseFee) || 0;
  const perItem = Number(values.perItemFee) || 0;
  const freeOver = values.freeOverSubtotal.trim()
    ? Number(values.freeOverSubtotal)
    : null;
  const min = values.minSubtotal.trim() ? Number(values.minSubtotal) : null;
  const max = values.maxSubtotal.trim() ? Number(values.maxSubtotal) : null;

  if (min !== null && subtotal < min) {
    return {
      explanation: `The cart is below the ${formatCurrency(min)} minimum for this zone.`,
      fee: 0,
      offered: false,
    };
  }
  if (max !== null && subtotal > max) {
    return {
      explanation: `The cart is above the ${formatCurrency(max)} maximum for this zone.`,
      fee: 0,
      offered: false,
    };
  }
  if (freeOver !== null && subtotal >= freeOver) {
    return {
      explanation: `Free, because the cart reaches the ${formatCurrency(freeOver)} threshold.`,
      fee: 0,
      offered: true,
    };
  }

  return {
    explanation: `Base ${formatCurrency(base)}${perItem > 0 ? ` + ${itemCount} × ${formatCurrency(perItem)}` : ''}${values.estimatedMinDays || values.estimatedMaxDays ? ` · ${values.estimatedMinDays || 0}–${values.estimatedMaxDays || values.estimatedMinDays || 0} days` : ''}`,
    fee: base + perItem * itemCount,
    offered: true,
  };
}

function toMethodValues(method: DeliveryMethod): DeliveryMethodValues {
  return {
    branchId: method.branchId ?? '',
    code: method.code,
    description: method.description ?? '',
    isDefault: method.isDefault,
    name: method.name,
    sortOrder: method.sortOrder,
    status: method.status,
    type: method.type,
  };
}

function toZoneValues(zone: DeliveryZone): DeliveryZoneValues {
  return {
    baseFee: zone.baseFee,
    cities: zone.cities.join(', '),
    countries: zone.countries.join(', '),
    estimatedMaxDays:
      zone.estimatedMaxDays === null ? '' : String(zone.estimatedMaxDays),
    estimatedMinDays:
      zone.estimatedMinDays === null ? '' : String(zone.estimatedMinDays),
    freeOverSubtotal: zone.freeOverSubtotal ?? '',
    isFallback: zone.isFallback,
    maxSubtotal: zone.maxSubtotal ?? '',
    minSubtotal: zone.minSubtotal ?? '',
    name: zone.name,
    perItemFee: zone.perItemFee,
    postalCodes: zone.postalCodes.join(', '),
    provinces: zone.provinces.join(', '),
    sortOrder: String(zone.sortOrder),
  };
}
