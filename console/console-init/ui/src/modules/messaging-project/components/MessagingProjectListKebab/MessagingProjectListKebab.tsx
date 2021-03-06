/*
 * Copyright 2020, EnMasse authors.
 * License: Apache License 2.0 (see the file LICENSE or http://apache.org/licenses/LICENSE-2.0.html).
 */

import React from "react";
import {
  OverflowMenu,
  OverflowMenuContent,
  OverflowMenuGroup,
  OverflowMenuItem,
  OverflowMenuControl
} from "@patternfly/react-core";
import { DropdownItem, Button, ButtonVariant } from "@patternfly/react-core";
import { DropdownWithKebabToggle } from "components";

export interface IMessagingProjectListKebabProps {
  onCreateAddressSpace: () => void;
  isDeleteAllDisabled: boolean;
  onSelectDeleteAll: (event: any) => void;
}

export const MessagingProjectListKebab: React.FC<IMessagingProjectListKebabProps> = ({
  isDeleteAllDisabled,
  onCreateAddressSpace,
  onSelectDeleteAll
}) => {
  const dropdownItems = [
    <DropdownItem
      id="messaging-project-list-kebab-delete-dropdownitem"
      key="delete-all"
      component="button"
      value="deleteAll"
      isDisabled={isDeleteAllDisabled}
    >
      Delete Selected
    </DropdownItem>
  ];

  return (
    <>
      <OverflowMenu breakpoint="lg">
        <OverflowMenuContent isPersistent>
          <OverflowMenuGroup groupType="button" isPersistent>
            {/* Remove is Persistent after fixing dropdown items for overflow menu */}
            <OverflowMenuItem isPersistent>
              <Button
                id="messaging-project-list-kebab-create-button"
                variant={ButtonVariant.primary}
                onClick={onCreateAddressSpace}
              >
                Create Messaging Project
              </Button>
            </OverflowMenuItem>
          </OverflowMenuGroup>
        </OverflowMenuContent>
        <OverflowMenuControl hasAdditionalOptions>
          <DropdownWithKebabToggle
            id="messaging-project-list-kebab-dropdown"
            toggleId="messaging-project-list-kebab-dropdowntoggle"
            onSelect={onSelectDeleteAll}
            dropdownItems={dropdownItems}
            isPlain
          />
        </OverflowMenuControl>
      </OverflowMenu>
    </>
  );
};
