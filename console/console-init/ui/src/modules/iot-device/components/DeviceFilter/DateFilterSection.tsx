import React from "react";
import { TextInput, InputGroup, InputGroupText } from "@patternfly/react-core";
import { CalendarAltIcon } from "@patternfly/react-icons";
import { IDeviceFilter } from "./DeviceFilter";
import { StyleSheet, css } from "aphrodite";

interface IDateFilterSectionProps {
  filter: IDeviceFilter;
  setFilter: (filter: IDeviceFilter) => void;
}

const styles = StyleSheet.create({
  input_size: { width: 85 }
});

const DateFilterSection: React.FunctionComponent<IDateFilterSectionProps> = ({
  filter,
  setFilter
}) => {
  const onChangeStartDate = (value: string) => {
    const filterObj = { ...filter };
    filterObj.addedDate.startDate = value;
    setFilter(filterObj);
  };
  const onChangeEndDate = (value: string) => {
    const filterObj = { ...filter };
    filterObj.addedDate.endDate = value;
    setFilter(filterObj);
  };
  const { addedDate } = filter;
  return (
    <InputGroup>
      <InputGroupText component="label" htmlFor="added-date">
        <CalendarAltIcon />
      </InputGroupText>
      <TextInput
        name="added-start-date"
        id="device-filter-section-added-start-date"
        type="date"
        aria-label="Added Start Date"
        className={css(styles.input_size)}
        value={addedDate.startDate}
        onChange={onChangeStartDate}
      />
      <TextInput
        name="added-end-date"
        id="device-filter-section-added-end-date-input"
        type="date"
        aria-label="Added End Date"
        className={css(styles.input_size)}
        value={addedDate.endDate}
        onChange={onChangeEndDate}
      />
    </InputGroup>
  );
};

export { DateFilterSection };
