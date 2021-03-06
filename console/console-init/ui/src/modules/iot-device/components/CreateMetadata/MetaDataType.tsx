/*
 * Copyright 2020, EnMasse authors.
 * License: Apache License 2.0 (see the file LICENSE or http://apache.org/licenses/LICENSE-2.0.html).
 */

import React from "react";
import { DropdownWithToggle } from "components";
import { DropdownPosition } from "@patternfly/react-core";
import { deviceRegistrationTypeOptions } from "modules/iot-device";
import { isObjectOrArray } from "utils";
import { ValidationStatusType } from "modules/iot-device/utils";

interface IMetaDataTypeProps {
  metadataList: any;
  rowIndex: number;
  updateMetadataList: (property: string, value: string) => void;
  getValidationStatus: (type: string, value: string) => ValidationStatusType;
  setValidationStatus: (value: ValidationStatusType) => void;
}

export const MetaDataType: React.FC<IMetaDataTypeProps> = ({
  metadataList,
  rowIndex,
  updateMetadataList,
  getValidationStatus,
  setValidationStatus,
}) => {
  const currentRow = metadataList[rowIndex];

  const handleTypeChange = (type: string) => {
    const validationStatus = getValidationStatus(type, currentRow.value);
    setValidationStatus(validationStatus);
    updateMetadataList("type", type);
  };

  return (
    <DropdownWithToggle
      id="metadata-row-type-dropdowntoggle"
      toggleId="metadata-row-type-dropdown-toggle"
      position={DropdownPosition.left}
      onSelectItem={handleTypeChange}
      dropdownItems={deviceRegistrationTypeOptions}
      value={currentRow.type}
      isLabelAndValueNotSame={true}
      isDisabled={isObjectOrArray(currentRow.type)}
    />
  );
};
