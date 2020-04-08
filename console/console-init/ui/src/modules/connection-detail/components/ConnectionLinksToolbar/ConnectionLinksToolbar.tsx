import React from "react";
import {
  DataToolbarItem,
  DataToolbar,
  DataToolbarContent,
  DataToolbarContentProps
} from "@patternfly/react-core";
import { ISortBy } from "@patternfly/react-table";
import {
  ConnectionLinksToggleGroup,
  IConnectionLinksToggleGroupProps
} from "modules/connection-detail/components";
import { SortForMobileView, useWindowDimensions } from "components";

export interface IConnectionLinksToolbarProps
  extends IConnectionLinksToggleGroupProps {
  sortValue?: ISortBy;
  setSortValue: (value: ISortBy) => void;
  onClearAllFilters: () => void;
}
const ConnectionLinksToolbar: React.FunctionComponent<IConnectionLinksToolbarProps &
  DataToolbarContentProps> = ({
  totalRecords,
  filterSelected,
  nameSelected,
  nameInput,
  addressSelected,
  addressInput,
  roleIsExpanded,
  roleSelected,
  selectedNames,
  selectedAddresses,
  onFilterSelect,
  onNameSelect,
  onNameClear,
  onAddressSelect,
  onAddressClear,
  onRoleToggle,
  onRoleSelect,
  onSearch,
  onDelete,
  sortValue,
  setSortValue,
  onClearAllFilters,
  onChangeNameInput,
  onChangeAddressInput,
  setNameInput,
  setAddressInput
}) => {
  const { width } = useWindowDimensions();
  const sortMenuItems = [
    { key: "name", value: "Name", index: 1 },
    { key: "address", value: "Address", index: 2 },
    { key: "deliveries", value: "Deliveries", index: 3 },
    { key: "accepted", value: "Accepted", index: 4 },
    { key: "rejected", value: "Rejected", index: 5 },
    { key: "released", value: "Released", index: 6 },
    { key: "modified", value: "Modified", index: 7 },
    { key: "presettled", value: "Presettled", index: 8 },
    { key: "undelievered", value: "Undelievered", index: 9 }
  ];
  const toolbarItems = (
    <>
      <ConnectionLinksToggleGroup
        totalRecords={totalRecords}
        filterSelected={filterSelected}
        nameSelected={nameSelected}
        nameInput={nameInput}
        addressSelected={addressSelected}
        addressInput={addressInput}
        roleIsExpanded={roleIsExpanded}
        roleSelected={roleSelected}
        selectedNames={selectedNames}
        selectedAddresses={selectedAddresses}
        onFilterSelect={onFilterSelect}
        onNameSelect={onNameSelect}
        onNameClear={onNameClear}
        onAddressSelect={onAddressSelect}
        onAddressClear={onAddressClear}
        onRoleToggle={onRoleToggle}
        onRoleSelect={onRoleSelect}
        onSearch={onSearch}
        onDelete={onDelete}
        onChangeNameInput={onChangeNameInput}
        onChangeAddressInput={onChangeAddressInput}
        setNameInput={setNameInput}
        setAddressInput={setAddressInput}
      />
      <DataToolbarItem>
        {width < 769 && (
          <SortForMobileView
            sortMenu={sortMenuItems}
            sortValue={sortValue}
            setSortValue={setSortValue}
          />
        )}
      </DataToolbarItem>
    </>
  );

  return (
    <DataToolbar
      id="data-toolbar-with-filter"
      className="pf-m-toggle-group-container"
      collapseListedFiltersBreakpoint="xl"
      clearAllFilters={onClearAllFilters}
    >
      <DataToolbarContent>{toolbarItems}</DataToolbarContent>
    </DataToolbar>
  );
};
export { ConnectionLinksToolbar };
