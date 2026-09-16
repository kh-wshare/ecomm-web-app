'use client';

import {
  EmptyState as HeroEmptyState,
  Label,
  Pagination,
  SearchField,
  Table,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { type ReactNode, useDeferredValue, useState } from 'react';

import { Button } from '@repo/ui';

import { ShipmentStatusBadge, statusLabel } from './shipment-shared';

import { Select as FilterControlSelect } from '@/components/products/product-controls';
import { useShipments } from '@/hooks/api/use-shipments';
import { usePermissions } from '@/hooks/use-permissions';
import { formatDate } from '@/lib/formatters/date';
import type { ShipmentFilters, ShipmentStatus } from '@/types/shipment';

const statusOptions: Array<ShipmentStatus | 'ALL'> = [
  'ALL',
  'PENDING',
  'READY_FOR_PICKUP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'FAILED',
  'RETURNED',
  'CANCELLED',
];

const initialFilters: ShipmentFilters = {
  limit: 15,
  orderId: '',
  page: 1,
  search: '',
  status: 'ALL',
};

export function ShipmentList() {
  const { can } = usePermissions();
  const canRead = can('shipments.manage');
  const [filters, setFilters] = useState(initialFilters);
  const deferredSearch = useDeferredValue(filters.search.trim());
  const shipmentsQuery = useShipments(
    { ...filters, search: deferredSearch },
    canRead,
  );

  // The status filter goes to the API rather than being applied to the page
  // here: the list is server-paginated, so filtering after the fetch would
  // leave the page counts describing rows that are no longer shown. That does
  // mean there is no single "in progress" view, because the API takes one
  // status at a time.
  const shipments = shipmentsQuery.data?.items ?? [];
  const meta = shipmentsQuery.data?.meta;

  if (!canRead) {
    return (
      <div className="rounded-2xl border border-warning/30 bg-warning/10 p-6 text-sm">
        You do not have permission to view shipments.
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <header>
        <p className="text-sm font-medium text-accent">Fulfilment</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          Shipments
        </h2>
        <p className="mt-2 text-sm text-muted">
          Every parcel in flight, across all orders.
        </p>
      </header>

      <div className="grid gap-3 rounded-2xl border border-separator bg-surface p-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <SearchField name="search" value={filters.search} variant="secondary">
            <Label>Search</Label>
            <SearchField.Group className="bg-surface-secondary shadow-none">
              <SearchField.SearchIcon />
              <SearchField.Input
                placeholder="Search shipment or tracking number"
                value={filters.search}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    page: 1,
                    search: event.target.value,
                  }))
                }
              />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>
        <FilterControlSelect
          className="text-muted"
          label="Status"
          value={filters.status}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              page: 1,
              status: event.target.value as ShipmentStatus | 'ALL',
            }))
          }
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All statuses' : statusLabel(option)}
            </option>
          ))}
        </FilterControlSelect>
      </div>

      <div className="overflow-hidden rounded-2xl border border-separator bg-surface">
        <Table variant="secondary">
          <Table.ScrollContainer>
            <Table.Content
              aria-label="Shipments"
              className="h-full min-w-[820px] table-fixed text-left text-sm"
              selectionMode="none"
            >
              <Table.Header className="text-xs font-semibold text-muted">
                <Table.Column
                  className="w-[180px] rounded-b-none px-4 py-3 font-medium"
                  id="shipment"
                  isRowHeader
                >
                  Shipment
                </Table.Column>
                <Table.Column className="w-[160px] px-4 py-3 font-medium" id="status">
                  Status
                </Table.Column>
                <Table.Column className="w-[170px] px-4 py-3 font-medium" id="carrier">
                  Carrier
                </Table.Column>
                <Table.Column className="w-[180px] px-4 py-3 font-medium" id="tracking">
                  Tracking
                </Table.Column>
                <Table.Column className="w-[110px] px-4 py-3 text-right font-medium" id="units">
                  Units
                </Table.Column>
                <Table.Column
                  className="w-[170px] rounded-b-none px-4 py-3 font-medium"
                  id="updated"
                >
                  Last event
                </Table.Column>
              </Table.Header>
              <Table.Body
                renderEmptyState={() => {
                  if (shipmentsQuery.isPending) {
                    return <TableState label="Loading shipments" spinning />;
                  }
                  if (shipmentsQuery.isError) {
                    return (
                      <TableState
                        label="Shipments are unavailable"
                        description={shipmentsQuery.error.message}
                        tone="danger"
                        action={
                          <Button
                            type="button"
                            variant="primary"
                            onPress={() => shipmentsQuery.refetch()}
                          >
                            Try again
                          </Button>
                        }
                      />
                    );
                  }
                  return (
                    <TableState
                      label="No shipments found"
                      description={
                        filters.status === 'ALL' && !deferredSearch
                          ? 'Nothing has shipped yet. Ship an order from its detail page.'
                          : 'Try changing the filters.'
                      }
                    />
                  );
                }}
              >
                {shipments.map((shipment) => {
                  const latest = [...shipment.events].sort(
                    (left, right) =>
                      new Date(right.occurredAt).getTime() -
                      new Date(left.occurredAt).getTime(),
                  )[0];
                  const units = shipment.items.reduce(
                    (total, item) => total + item.quantity,
                    0,
                  );

                  return (
                    <Table.Row
                      className="border-t border-separator hover:bg-surface-secondary/60"
                      id={shipment.id}
                      key={shipment.id}
                    >
                      <Table.Cell className="px-4 py-4">
                        <Link
                          className="font-mono text-xs font-semibold hover:text-accent"
                          href={`/orders/${shipment.orderId}`}
                        >
                          {shipment.shipmentNumber}
                        </Link>
                        <p className="mt-1 text-xs text-muted">
                          {shipment.shippedAt
                            ? `Shipped ${formatDate(shipment.shippedAt, { dateStyle: 'medium' })}`
                            : 'Not shipped yet'}
                        </p>
                      </Table.Cell>
                      <Table.Cell className="px-4 py-4">
                        <ShipmentStatusBadge status={shipment.status} />
                      </Table.Cell>
                      <Table.Cell className="px-4 py-4 text-sm text-muted">
                        {shipment.carrierName || 'Not recorded'}
                      </Table.Cell>
                      <Table.Cell className="px-4 py-4 font-mono text-xs">
                        {shipment.trackingNumber ? (
                          shipment.trackingUrl ? (
                            <a
                              className="text-accent hover:underline"
                              href={shipment.trackingUrl}
                              rel="noreferrer noopener"
                              target="_blank"
                            >
                              {shipment.trackingNumber}
                            </a>
                          ) : (
                            shipment.trackingNumber
                          )
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </Table.Cell>
                      <Table.Cell className="px-4 py-4 text-right font-semibold">
                        {units}
                      </Table.Cell>
                      <Table.Cell className="px-4 py-4 text-xs text-muted">
                        {latest
                          ? `${statusLabel(latest.status)} · ${formatDate(latest.occurredAt, { dateStyle: 'medium', timeStyle: 'short' })}`
                          : 'No events'}
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
          {meta && shipments.length ? (
            <Table.Footer>
              <Pagination size="sm">
                <Pagination.Summary className="text-xs text-muted">
                  {meta.total} total shipments
                </Pagination.Summary>
                <Pagination.Content>
                  <Pagination.Item>
                    <Pagination.Previous
                      isDisabled={!meta.hasPrev}
                      onPress={() =>
                        setFilters((current) => ({
                          ...current,
                          page: current.page - 1,
                        }))
                      }
                    >
                      <Pagination.PreviousIcon />
                      Prev
                    </Pagination.Previous>
                  </Pagination.Item>
                  <Pagination.Item>
                    <span className="px-2 text-xs text-muted">
                      Page {meta.page} of {Math.max(meta.totalPages, 1)}
                    </span>
                  </Pagination.Item>
                  <Pagination.Item>
                    <Pagination.Next
                      isDisabled={!meta.hasNext}
                      onPress={() =>
                        setFilters((current) => ({
                          ...current,
                          page: current.page + 1,
                        }))
                      }
                    >
                      Next
                      <Pagination.NextIcon />
                    </Pagination.Next>
                  </Pagination.Item>
                </Pagination.Content>
              </Pagination>
            </Table.Footer>
          ) : null}
        </Table>
      </div>
    </section>
  );
}

function TableState({
  action,
  description,
  label,
  spinning = false,
  tone = 'muted',
}: {
  action?: ReactNode;
  description?: string;
  label: string;
  spinning?: boolean;
  tone?: 'danger' | 'muted';
}) {
  return (
    <HeroEmptyState className="flex h-full min-h-64 w-full flex-col items-center justify-center gap-4 text-center md:min-h-[calc(100dvh-30rem)]">
      <Icon
        className={`size-6 ${tone === 'danger' ? 'text-danger' : 'text-muted'} ${spinning ? 'animate-spin' : ''}`}
        icon={
          spinning
            ? 'gravity-ui:arrows-rotate-right'
            : tone === 'danger'
              ? 'gravity-ui:circle-xmark'
              : 'gravity-ui:tray'
        }
      />
      <div className="space-y-1">
        <div className="text-sm font-semibold">{label}</div>
        {description && (
          <div className="max-w-sm text-xs text-muted">{description}</div>
        )}
      </div>
      {action}
    </HeroEmptyState>
  );
}
