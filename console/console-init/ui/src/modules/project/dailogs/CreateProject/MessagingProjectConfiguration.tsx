/*
 * Copyright 2020, EnMasse authors.
 * License: Apache License 2.0 (see the file LICENSE or http://apache.org/licenses/LICENSE-2.0.html).
 */

import React from "react";
import { IMessagingProject } from "./CreateProject";
import {
  IAuthenticationServiceOptions,
  MessagingConfiguration
} from "modules/project/components";
import { IOptionForKeyValueLabel } from "modules/project/utils";
import { useQuery } from "@apollo/react-hooks";
import { RETURN_ADDRESS_SPACE_PLANS } from "graphql-module/queries";
import { IAddressSpaceSchema } from "schema/ResponseTypes";
import { dnsSubDomainRfc1123NameRegexp } from "utils";

export interface IMessagingProjectConfigurationProps {
  projectDetail: IMessagingProject;
  setProjectDetail: (project: IMessagingProject) => void;
  addressSpaceSchema?: IAddressSpaceSchema;
  namespaces: IOptionForKeyValueLabel[];
}

export interface IAddressSpacePlans {
  addressSpacePlans: Array<{
    metadata: {
      name: string;
      uid: string;
      creationTimestamp: Date;
    };
    spec: {
      addressSpaceType: string;
      displayName: string;
      longDescription: string;
      shortDescription: string;
    };
  }>;
}

export interface IAddressSpaceAuthService {
  metadata: {
    name: string;
  };
  spec: {
    authenticationServices: string[];
  };
}

export interface INamespaces {
  namespaces: Array<{
    metadata: {
      name: string;
    };
    status: {
      phase: string;
    };
  }>;
}

const MessagingProjectConfiguration: React.FunctionComponent<IMessagingProjectConfigurationProps> = ({
  projectDetail,
  setProjectDetail,
  addressSpaceSchema,
  namespaces
}) => {
  const {
    name,
    namespace,
    type,
    plan,
    authService,
    isNameValid,
    customizeEndpoint
  } = projectDetail && projectDetail;

  const { addressSpacePlans } = useQuery<IAddressSpacePlans>(
    RETURN_ADDRESS_SPACE_PLANS
  ).data || {
    addressSpacePlans: []
  };

  const onNameSpaceSelect = (value: string) => {
    setProjectDetail({ ...projectDetail, namespace: value });
  };
  const handleNameChange = (value: string) => {
    setProjectDetail({
      ...projectDetail,
      isNameValid: dnsSubDomainRfc1123NameRegexp.test(value),
      name: value
    });
  };
  const handleTypeChange = (_: boolean, event: any) => {
    setProjectDetail({
      ...projectDetail,
      type: event?.target.value,
      protocols: undefined,
      tlsCertificate: undefined,
      routesConf: undefined,
      plan: undefined,
      authService: undefined
    });
  };
  const onPlanSelect = (value: string) => {
    setProjectDetail({ ...projectDetail, plan: value });
  };
  const onAuthenticationServiceSelect = (value: string) => {
    setProjectDetail({ ...projectDetail, authService: value });
  };

  const handleCustomEndpointChange = (customizeSwitchCheckedValue: boolean) => {
    setProjectDetail({
      ...projectDetail,
      customizeEndpoint: customizeSwitchCheckedValue,
      addRoutes: customizeSwitchCheckedValue
    });
  };

  const getPlanOptions = () => {
    let planOptions: any[] = [];
    if (type) {
      planOptions =
        addressSpacePlans
          .filter(plan => plan.spec.addressSpaceType === type)
          .map(plan => {
            return {
              value: plan.metadata.name,
              label: plan.spec.displayName || plan.metadata.name,
              description:
                plan.spec.shortDescription || plan.spec.longDescription
            };
          })
          .filter(plan => plan !== undefined) || [];
    }
    return planOptions;
  };

  const getAuthenticationServiceOptions = () => {
    let authenticationServiceOptions: IAuthenticationServiceOptions[] = [];
    if (addressSpaceSchema?.addressSpaceSchema) {
      addressSpaceSchema.addressSpaceSchema.forEach(as => {
        if (as.metadata.name === type && as.spec.authenticationServices) {
          authenticationServiceOptions = as.spec.authenticationServices.map(
            service => ({
              value: service,
              label: service,
              key: service
            })
          );
        }
      });
    }
    return authenticationServiceOptions;
  };

  return (
    <MessagingConfiguration
      onNameSpaceSelect={onNameSpaceSelect}
      handleNameChange={handleNameChange}
      handleTypeChange={handleTypeChange}
      onPlanSelect={onPlanSelect}
      onAuthenticationServiceSelect={onAuthenticationServiceSelect}
      namespace={namespace || ""}
      namespaceOptions={namespaces}
      name={name || ""}
      isNameValid={isNameValid || false}
      type={type || ""}
      plan={plan || ""}
      planOptions={getPlanOptions()}
      authenticationService={authService || ""}
      authenticationServiceOptions={getAuthenticationServiceOptions()}
      customizeEndpoint={customizeEndpoint}
      handleCustomEndpointChange={handleCustomEndpointChange}
    />
  );
};

export { MessagingProjectConfiguration };
