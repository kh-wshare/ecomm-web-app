import type { InventoryType } from "@/types/product";
import { Chip } from "@heroui/react/chip";

export function ProductInventoryTypeBadge({
  inventoryType,
}: {
  inventoryType: InventoryType;
}) {
  const isStocked = inventoryType === "STOCKED";

  return (
    <Chip color={isStocked ? "success" : "default"} size="sm" variant="soft">
      {isStocked ? "Stock" : "No stock"}
    </Chip>
  );
}
