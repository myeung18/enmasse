/*
 * Copyright 2020, EnMasse authors.
 * License: Apache License 2.0 (see the file LICENSE or http://apache.org/licenses/LICENSE-2.0.html).
 */

import React, { useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@apollo/react-hooks";
import { Flex, FlexItem, Button, ButtonVariant } from "@patternfly/react-core";
import { StyleSheet, css } from "aphrodite";
import { AddGateways } from "modules/iot-device/components";
import { RETURN_IOT_DEVICE_DETAIL } from "graphql-module";
import { IDeviceDetailResponse } from "schema";
import { useStoreContext, types } from "context-state-reducer";

const styles = StyleSheet.create({
  button_padding: {
    paddingTop: 100
  }
});

export const EditGatewaysContainer = () => {
  const { deviceid, projectname, namespace } = useParams();
  const { dispatch } = useStoreContext();
  const [gatewayDevices, addGatewayDevices] = useState<string[]>([]);
  const [gatewayGroups, setGatewayGroups] = useState<string[]>([]);

  const { data } = useQuery<IDeviceDetailResponse>(
    RETURN_IOT_DEVICE_DETAIL(projectname, namespace, deviceid)
  );

  const { devices } = data || {
    devices: { total: 0, devices: [] }
  };

  const { via: gatewayList, viaGroups: gatewayGroupList } =
    devices?.devices[0] || {};

  const getGatewayDevices = (gateway: string[]) => {
    addGatewayDevices(gateway);
  };

  const getGatewayGroups = (groups: string[]) => {
    setGatewayGroups(groups);
  };

  const resetActionType = () => {
    dispatch({ type: types.RESET_DEVICE_ACTION_TYPE });
  };

  const onGatewaysSave = () => {
    // TODO: Call the `update iot project` mutation
  };

  const onCancel = () => {
    resetActionType();
  };

  return (
    <>
      <AddGateways
        gatewayDevices={gatewayList}
        gatewayGroups={gatewayGroupList}
        header={`Edit gateways of device ${deviceid}`}
        returnGatewayDevices={getGatewayDevices}
        returnGatewayGroups={getGatewayGroups}
      />
      <Flex className={css(styles.button_padding)}>
        <FlexItem>
          <Button
            id="edit-gateways-container-save-button"
            variant={ButtonVariant.primary}
            onClick={onGatewaysSave}
          >
            Save
          </Button>
        </FlexItem>
        <FlexItem>
          <Button
            id="edit-gateways-container-cancel-button"
            variant={ButtonVariant.link}
            onClick={onCancel}
          >
            Cancel
          </Button>
        </FlexItem>
      </Flex>
    </>
  );
};
