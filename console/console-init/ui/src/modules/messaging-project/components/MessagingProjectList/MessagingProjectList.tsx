/*
 * Copyright 2020, EnMasse authors.
 * License: Apache License 2.0 (see the file LICENSE or http://apache.org/licenses/LICENSE-2.0.html).
 */

import React from "react";
import {
  Table,
  TableVariant,
  TableHeader,
  TableBody,
  IActionsResolver,
  TableProps,
  SortByDirection
} from "@patternfly/react-table";
import { StyleSheet, css } from "aphrodite";

const StyleForTable = StyleSheet.create({
  scroll_overflow: {
    overflowY: "auto",
    paddingBottom: 100
  }
});

export interface IAddressSpace {
  name: string;
  nameSpace: string;
  creationTimestamp: string;
  type: string;
  displayName: string;
  planValue: string;
  isReady: boolean;
  phase: string;
  status?: "creating" | "deleting" | "running";
  selected?: boolean;
  messages: Array<string>;
  authenticationService: string;
}

export interface IMessagingPojectListProps extends TableProps {
  actionResolver?: IActionsResolver;
  onSort?: (_event: any, index: number, direction: SortByDirection) => void;
}

export const MessagingProjectList: React.FunctionComponent<IMessagingPojectListProps> = ({
  onSelect,
  onSort,
  rows,
  cells,
  sortBy,
  actionResolver
}) => {
  return (
    <>
      <div className={css(StyleForTable.scroll_overflow)}>
        <Table
          variant={TableVariant.compact}
          onSelect={onSelect}
          cells={cells}
          rows={rows}
          actionResolver={actionResolver}
          aria-label="messaging project list"
          onSort={onSort}
          sortBy={sortBy}
        >
          <TableHeader id="messaging-project-list-tableheader" />
          <TableBody />
        </Table>
      </div>
    </>
  );
};
