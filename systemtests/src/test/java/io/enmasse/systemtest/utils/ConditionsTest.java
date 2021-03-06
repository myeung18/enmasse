/*
 * Copyright 2020, EnMasse authors.
 * License: Apache License 2.0 (see the file LICENSE or http://apache.org/licenses/LICENSE-2.0.html).
 */

package io.enmasse.systemtest.utils;

import java.time.Instant;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import io.enmasse.api.model.MessagingEndpointBuilder;
import io.enmasse.iot.model.v1.ConfigConditionType;
import io.enmasse.iot.model.v1.IoTInfrastructureBuilder;

import static io.enmasse.systemtest.framework.TestTag.FRAMEWORK;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

@Tag(FRAMEWORK)
public class ConditionsTest {

    @Test
    public void testMessagingEndpointExtractConditionStatus() {
        var endpoint = new MessagingEndpointBuilder()
                .withNewStatus()

                .addNewCondition()
                .withType("NotReady")
                .withStatus("False")
                .withLastTransitionTime(Instant.now().toString())
                .withNewMessage("Some message")
                .endCondition()

                .addNewCondition()
                .withType("Ready")
                .withStatus("True")
                .withLastTransitionTime(Instant.now().toString())
                .withNewMessage("Some other message")
                .endCondition()

                .addNewCondition()
                .withType("NotEvenCloseToReady")
                .withStatus("False")
                .withLastTransitionTime(Instant.now().toString())
                .withNewMessage("Some other message")
                .endCondition()

                .endStatus()
                .build();

        assertEquals("True", Conditions.conditionStatus(endpoint, "Ready"));
        assertEquals("False", Conditions.conditionStatus(endpoint, "NotReady"));
        assertNull(Conditions.conditionStatus(endpoint, "NotFound"));
    }

    @Test
    public void testIoTConfigExtractConditionStatus() {
        var config = new IoTInfrastructureBuilder()
                .withNewStatus()

                .addNewCondition()
                .withType(ConfigConditionType.DEGRADED)
                .withStatus("False")
                .withLastTransitionTime(Instant.now().toString())
                .withNewMessage("Some message")
                .endCondition()

                .addNewCondition()
                .withType(ConfigConditionType.READY)
                .withStatus("True")
                .withLastTransitionTime(Instant.now().toString())
                .withNewMessage("Some other message")
                .endCondition()

                .addNewCondition()
                .withType(ConfigConditionType.RECONCILED)
                .withStatus("False")
                .withLastTransitionTime(Instant.now().toString())
                .withNewMessage("Some other message")
                .endCondition()

                .endStatus()
                .build();

        assertEquals("True", Conditions.conditionStatus(config, ConfigConditionType.READY));
        assertEquals("False", Conditions.conditionStatus(config, ConfigConditionType.DEGRADED));
        assertNull(Conditions.conditionStatus(config, ConfigConditionType.TENANT_SERVICE_READY /* not found */));
    }

}
