/*
 * Copyright 2020, EnMasse authors.
 * License: Apache License 2.0 (see the file LICENSE or http://apache.org/licenses/LICENSE-2.0.html).
 */

package io.enmasse.systemtest.iot;

import io.enmasse.iot.utils.MoreFutures;
import io.enmasse.systemtest.Endpoint;
import io.enmasse.systemtest.iot.MessageSendTester.Type;
import io.enmasse.systemtest.utils.VertxUtils;
import io.vertx.core.Context;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.Vertx;
import io.vertx.core.buffer.Buffer;
import io.vertx.core.net.PfxOptions;
import io.vertx.proton.ProtonClient;
import io.vertx.proton.ProtonClientOptions;
import io.vertx.proton.ProtonConnection;
import io.vertx.proton.ProtonQoS;
import io.vertx.proton.ProtonSender;
import io.vertx.proton.sasl.impl.ProtonSaslExternalImpl;
import io.vertx.proton.sasl.impl.ProtonSaslPlainImpl;
import org.apache.qpid.proton.Proton;
import org.apache.qpid.proton.amqp.Binary;
import org.apache.qpid.proton.amqp.messaging.Data;
import org.apache.qpid.proton.message.Message;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

public class AmqpAdapterClient implements MessageSendTester.Sender, AutoCloseable {

    private static final Logger log = LoggerFactory.getLogger(AmqpAdapterClient.class);

    private final Vertx vertx;

    private final Context context;

    private final Endpoint endpoint;

    private final String username;

    private final String password;

    private final ProtonClientOptions options;

    private ProtonConnection connection;

    private ProtonSender sender;

    public AmqpAdapterClient(final Vertx vertx, final Endpoint endpoint, final PrivateKey key, final X509Certificate certificate,
                             final Set<String> tlsVersions) throws Exception {
        this(vertx, endpoint, key, certificate, null, null, tlsVersions);
    }

    public AmqpAdapterClient(final Vertx vertx, final Endpoint endpoint, final String authId, final String tenantId, final String password,
                             final Set<String> tlsVersions)
            throws Exception {
        this(vertx, endpoint, null, null, authId + "@" + tenantId, password, tlsVersions);
    }

    private AmqpAdapterClient(
            final Vertx vertx,
            final Endpoint endpoint,
            final PrivateKey key,
            final X509Certificate certificate,
            final String username,
            final String password,
            final Set<String> tlsVersions) throws Exception {

        this.vertx = vertx;
        this.context = vertx.getOrCreateContext();
        this.endpoint = endpoint;

        this.username = username;
        this.password = password;

        // create default options

        this.options = createDefaultOptions(tlsVersions);

        if (key != null && certificate != null) {

            // set X509 client cert credentials

            final Buffer keyStoreBuffer = Buffer.buffer(KeyStoreCreator.toByteArray(key, certificate));
            this.options.setKeyCertOptions(
                    new PfxOptions()
                            .setValue(keyStoreBuffer)
                            .setPassword(KeyStoreCreator.KEY_PASSWORD));
            this.options.addEnabledSaslMechanism(ProtonSaslExternalImpl.MECH_NAME);

        }

        if (username != null && password != null) {
            this.options.addEnabledSaslMechanism(ProtonSaslPlainImpl.MECH_NAME);
        }

    }

    private void setConnection(final ProtonConnection connection) {
        this.connection = connection;
    }

    private void setSender(final ProtonSender sender) {
        this.sender = sender;
    }

    public void connect() throws Exception {

        final Promise<ProtonSender> result = Promise.promise();

        this.context.runOnContext(x -> {

            final Future<ProtonConnection> connected = Promise.<ProtonConnection>promise().future();

            final ProtonClient client = ProtonClient.create(this.vertx);

            if (this.username != null && this.password != null) {
                client.connect(this.options, this.endpoint.getHost(), this.endpoint.getPort(), this.username, this.password, connected);
            } else {
                client.connect(this.options, this.endpoint.getHost(), this.endpoint.getPort(), connected);
            }

            // connect links

            connected
                    .flatMap(connection -> {

                        final Promise<ProtonConnection> opened = Promise.promise();
                        connection.openHandler(opened);
                        connection.closeHandler(y -> setConnection(null));
                        connection.open();
                        return opened.future();

                    })
                    .flatMap(connection -> {

                        setConnection(connection);
                        return createSender(connection);

                    })
                    .onComplete(result);

        });

        // await result

        MoreFutures.map(result.future()).get(11 /* connect timeout is 10s */, TimeUnit.SECONDS);

    }

    private Future<ProtonSender> createSender(final ProtonConnection connection) {

        final Promise<ProtonSender> result = Promise.promise();
        connection.createSender(null)
                .setQoS(ProtonQoS.AT_LEAST_ONCE)
                .closeHandler(x -> setSender(null))
                .openHandler(result)
                .open();

        return result.future()
                .onSuccess(this::setSender);

    }

    private static ProtonClientOptions createDefaultOptions(final Set<String> tlsVersions) {

        final ProtonClientOptions options = new ProtonClientOptions()
                .setHostnameVerificationAlgorithm("")
                .setSsl(true)
                .setTrustAll(true) // FIXME: use the proper CA
                .setConnectTimeout(10_000);
        VertxUtils.applyTlsVersions(options, tlsVersions);

        return options;

    }

    @Override
    public boolean send(final Type type, final Buffer payload, final Duration sendTimeout) {

        var outcome = send(type.type().address(), payload);

        // evaluate outcome

        try {
            // await the outcome, fails when it times out
            MoreFutures.await(outcome, sendTimeout);
            return true;
        } catch (final Exception e) {
            log.warn("Failed to send message", e);
            return false;
        }

    }

    public Future<?> send(final String address, final Buffer payload) {

        // prepare message

        final Message message = Proton.message();
        message.setBody(new Data(new Binary(payload.getBytes())));
        message.setAddress(address);

        // send

        return send(message);

    }

    public Future<?> send(final Message message) {

        final Promise<?> promise = Promise.promise();

        // everything we do with the proton connect, we must do on the vertx context

        this.context.runOnContext(x -> {

            // check if we have a sender

            if (this.sender == null || !this.sender.isOpen()) {
                log.warn("No open sender");
                promise.fail("No open sender");
                return;
            }

            // send

            this.sender.send(message, delivery -> {

                log.info("Delivery - remotelySettled: {}, remoteState: {}", delivery.remotelySettled(), delivery.getRemoteState());

                if (delivery.remotelySettled()) {
                    var state = delivery.getRemoteState();
                    switch (state.getType()) {
                        case Accepted:
                            promise.complete();
                            break;
                        default:
                            promise.fail("Failed to send message - outcome: " + state);
                            break;
                    }
                }

            });

        });

        // return future

        return promise.future();

    }

    public Future<?> subscribe(final String address, final Consumer<Message> handler) {

        var promise = Promise.promise();

        this.vertx.getOrCreateContext().runOnContext(x -> {
            this.connection.createReceiver(address)
                    .openHandler(opened -> {
                        if (opened.succeeded()) {
                            promise.complete();
                        } else {
                            promise.fail(opened.cause());
                        }
                    })
                    .closeHandler(closed -> {
                        promise.tryFail("Link closed");
                    })
                    .handler((delivery, message) -> handler.accept(message))
                    .open();
        });

        return promise.future();
    }

    @Override
    public void close() {

        this.context.runOnContext(x -> {
            var connection = this.connection;
            this.connection = null;
            if (connection != null) {
                connection.close();
            }
        });

    }

}
