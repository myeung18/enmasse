/*
 * Copyright 2020, EnMasse authors.
 * License: Apache License 2.0 (see the file LICENSE or http://apache.org/licenses/LICENSE-2.0.html).
 */

import React, { useState } from "react";
import { UploadFile } from "components";
import { Form, FormGroup } from "@patternfly/react-core";

interface IEndpointCertificateConfigurationProps {
  certificate?: string;
  setCertificate: (cert: string) => void;
  privateKey?: string;
  setPrivateKey: (key: string) => void;
}
const EndpointCertificateConfiguration: React.FunctionComponent<IEndpointCertificateConfigurationProps> = ({
  certificate,
  setCertificate,
  privateKey,
  setPrivateKey
}) => {
  const [isCertRejected, setIsCertRejected] = useState<boolean>(false);
  const [isKeyRejected, setIsKeyRejected] = useState<boolean>(false);
  return (
    <Form>
      <FormGroup
        label="Certificate"
        fieldId="endpoint-certificate-config-pem-upload"
        helperText="The PEM format certificate. Upload file by dragging & dropping, selecting it, or pasting from the clipboard"
        helperTextInvalid="Must be a PEM file"
        isRequired={true}
        validated={isCertRejected ? "error" : "default"}
      >
        <UploadFile
          id={"endpoint-certificate-config-pem-upload"}
          value={certificate}
          setValue={setCertificate}
          isRejected={isCertRejected}
          setIsRejected={setIsCertRejected}
          fileRestriction={".pem"}
        />
      </FormGroup>
      <br />
      <FormGroup
        label="Private key"
        fieldId="endpoint-certificate-config-pem-key-upload"
        helperText="The PEM format key. Upload file by dragging & dropping, selecting it, or pasting from the clipboard"
        helperTextInvalid="Must be a PEM file"
        isRequired={true}
        validated={isKeyRejected ? "error" : "default"}
      >
        <UploadFile
          id={"endpoint-certificate-config-pem-key-upload"}
          value={privateKey}
          setValue={setPrivateKey}
          isRejected={isKeyRejected}
          setIsRejected={setIsKeyRejected}
        />
      </FormGroup>
    </Form>
  );
};

export { EndpointCertificateConfiguration };
