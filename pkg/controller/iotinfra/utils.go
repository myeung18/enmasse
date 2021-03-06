/*
 * Copyright 2019-2020, EnMasse authors.
 * License: Apache License 2.0 (see the file LICENSE or http://apache.org/licenses/LICENSE-2.0.html).
 */

package iotinfra

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"k8s.io/apimachinery/pkg/util/intstr"

	"github.com/enmasseproject/enmasse/pkg/util/cchange"

	"sigs.k8s.io/controller-runtime/pkg/client"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"

	iotv1 "github.com/enmasseproject/enmasse/pkg/apis/iot/v1"
	"github.com/enmasseproject/enmasse/pkg/util/install"
	routev1 "github.com/openshift/api/route/v1"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
)

// This sets the default Hono probes
func SetHonoProbes(container *corev1.Container) {

	container.ReadinessProbe = install.ApplyHttpProbe(container.ReadinessProbe, 10, "/readiness", 8088)
	container.LivenessProbe = install.ApplyHttpProbe(container.LivenessProbe, 10, "/liveness", 8088)
	container.LivenessProbe.FailureThreshold = 10

}

func FullHostNameForEnvVar(serviceName string) string {
	return serviceName + ".$(KUBERNETES_NAMESPACE).svc"
}

// block injection of sidecar variables, for containers not using jaeger
func BlockTracingSidecarConfig(infra *iotv1.IoTInfrastructure, container *corev1.Container) {

	if infra.Spec.Tracing.Strategy.Sidecar != nil || infra.Spec.Tracing.Strategy.DaemonSet != nil {

		install.ApplyEnvSimple(container, "JAEGER_SERVICE_NAME", "")
		install.ApplyEnvSimple(container, "JAEGER_PROPAGATION", "")

	} else {

		install.RemoveEnv(container, "JAEGER_SERVICE_NAME")
		install.RemoveEnv(container, "JAEGER_PROPAGATION")

	}

}

// setup tracing for a container
func SetupTracing(infra *iotv1.IoTInfrastructure, deployment *appsv1.Deployment, container *corev1.Container) {

	if infra.Spec.Tracing.Strategy.Sidecar != nil {

		// sidecar

		install.ApplyEnvSimple(container, "JAEGER_SERVICE_NAME", deployment.Name)
		install.ApplyEnvSimple(container, "JAEGER_PROPAGATION", "jaeger,b3")
		install.ApplyEnvSimple(container, "JAEGER_AGENT_HOST", "localhost")

	} else if infra.Spec.Tracing.Strategy.DaemonSet != nil {

		// daemon set

		install.ApplyEnvSimple(container, "JAEGER_SERVICE_NAME", deployment.Name)
		install.ApplyEnvSimple(container, "JAEGER_PROPAGATION", "jaeger,b3")
		install.ApplyEnv(container, "JAEGER_AGENT_HOST", func(envvar *corev1.EnvVar) {
			envvar.Value = ""
			envvar.ValueFrom = &corev1.EnvVarSource{
				FieldRef: &corev1.ObjectFieldSelector{
					FieldPath: "status.hostIP",
				},
			}
		})

	} else {

		// disabled

		install.RemoveEnv(container, "JAEGER_AGENT_HOST")
		install.RemoveEnv(container, "JAEGER_SERVICE_NAME")
		install.RemoveEnv(container, "JAEGER_PROPAGATION")

	}

	if infra.Spec.Tracing.Strategy.Sidecar != nil {

		if deployment.Annotations["sidecar.jaegertracing.io/inject"] == "" {
			// we only set this to true when unset, because the tracing operator
			// will replace this with the actual tracing instance
			deployment.Annotations["sidecar.jaegertracing.io/inject"] = "true"
		}

	} else {

		delete(deployment.Labels, "sidecar.jaegertracing.io/injected")
		delete(deployment.Annotations, "sidecar.jaegertracing.io/inject")

		for i, c := range deployment.Spec.Template.Spec.Containers {
			if c.Name == "jaeger-agent" {
				log.Info(fmt.Sprintf("Removing jaeger tracing sidecar from deployment: %s", deployment.Name))
				deployment.Spec.Template.Spec.Containers = append(deployment.Spec.Template.Spec.Containers[:i], deployment.Spec.Template.Spec.Containers[i+1:]...)
				break
			}
		}

	}

}

func AppendStandardHonoJavaOptions(container *corev1.Container) {

	install.AppendEnvVarValue(
		container,
		install.JavaOptsEnvVarName,
		"-Djava.net.preferIPv4Stack=true -Dvertx.logger-delegate-factory-class-name=io.vertx.core.logging.SLF4JLogDelegateFactory",
	)

}

func applyDefaultStatefulSetConfig(statefulSet *appsv1.StatefulSet, serviceConfig iotv1.ServiceConfig, config *cchange.ConfigChangeRecorder) {

	statefulSet.Spec.Replicas = serviceConfig.Replicas
	statefulSet.Spec.UpdateStrategy.Type = appsv1.RollingUpdateStatefulSetStrategyType

	applyDefaultPodSpecConfig(&statefulSet.Spec.Template, serviceConfig, config)

}

func applyDefaultDeploymentConfig(deployment *appsv1.Deployment, serviceConfig iotv1.ServiceConfig, config *cchange.ConfigChangeRecorder) {

	deployment.Spec.Replicas = serviceConfig.Replicas
	deployment.Spec.Strategy.Type = appsv1.RollingUpdateDeploymentStrategyType

	applyDefaultPodSpecConfig(&deployment.Spec.Template, serviceConfig, config)

}

func applyDefaultPodSpecConfig(template *corev1.PodTemplateSpec, serviceConfig iotv1.ServiceConfig, config *cchange.ConfigChangeRecorder) {
	cchange.ApplyTo(config, "iot.enmasse.io/config-hash", &template.Annotations)

	template.Spec.Affinity = serviceConfig.Affinity
}

func applyContainerConfig(container *corev1.Container, config iotv1.ContainerConfig) {

	if config.Resources != nil {
		container.Resources = *config.Resources
	}

}

func (r *ReconcileIoTInfrastructure) cleanupSecrets(ctx context.Context, infra *iotv1.IoTInfrastructure, adapterName string) error {

	// we need to use an unstructured list, as "SecretList" doesn't work
	// due to kubernetes-sigs/controller-runtime#362

	ul := unstructured.UnstructuredList{}
	ul.SetKind("SecretList")
	ul.SetAPIVersion("")

	ls, err := install.LabelSelectorFromMap(install.CreateDefaultLabels(nil, "iot", adapterName+"-tls"))
	if err != nil {
		return err
	}

	n, err := install.BulkRemoveOwner(ctx, r.client, infra, true, &ul, client.ListOptions{
		Namespace:     infra.GetNamespace(),
		LabelSelector: ls,
	})

	if err == nil {
		log.Info("cleaned up adapter secrets", "adapter", adapterName, "secretsDeleted", n)
	}

	return err
}

func updateEndpointStatus(protocol string, forcePort bool, service *routev1.Route, status *iotv1.EndpointStatus) {

	status.URI = ""

	if service.Spec.Host == "" {
		return
	}

	status.URI = protocol + "://" + service.Spec.Host

	if forcePort {
		status.URI += ":443"
	}

}

// Append the standard Hono ports
func appendHonoStandardPorts(ports []corev1.ContainerPort) []corev1.ContainerPort {
	if ports == nil {
		ports = make([]corev1.ContainerPort, 0)
	}
	ports = append(ports, corev1.ContainerPort{
		ContainerPort: 8088,
		Name:          "health",
	})
	return ports
}

func (r *ReconcileIoTInfrastructure) reconcileMetricsService(serviceName string) func(infra *iotv1.IoTInfrastructure, service *corev1.Service) error {
	return func(infra *iotv1.IoTInfrastructure, service *corev1.Service) error {
		return processReconcileMetricsService(infra, serviceName, service)
	}
}

// Configure a metrics service for hono standard components.
// Hono exposes metrics on /prometheus on the health endpoint. We create a "<component>-metrics" service and map
// the "prometheus" port from the service to the "health" port of the container. So we can define a "prometheus"
// port on the ServiceMonitor on EnMasse with a custom path of "/prometheus".
func processReconcileMetricsService(_ *iotv1.IoTInfrastructure, serviceName string, service *corev1.Service) error {

	install.ApplyMetricsServiceDefaults(service, "iot", serviceName)

	service.Spec.Type = corev1.ServiceTypeClusterIP

	service.Spec.Ports = []corev1.ServicePort{
		{
			Name:       "prometheus",
			Port:       8088,
			TargetPort: intstr.FromString("health"),
			Protocol:   corev1.ProtocolTCP,
		},
	}

	return nil
}

func appendCommonHonoJavaEnv(container *corev1.Container, envVarPrefix string, infra *iotv1.IoTInfrastructure, commonJavaService iotv1.CommonJavaContainerOptions) {

	// add native tls flag

	install.ApplyOrRemoveEnvSimple(container, envVarPrefix+"NATIVETLSREQUIRED", strconv.FormatBool(commonJavaService.IsNativeTlsRequired(infra)))

	// configure tls versions

	install.ApplyOrRemoveEnvSimple(container, envVarPrefix+"SECUREPROTOCOLS", strings.Join(commonJavaService.TlsVersions(infra), ","))

}

// apply TLS versions to a connection factory
func applyServiceConnectionOptions(container *corev1.Container, prefix string, tlsVersions []string) {
	install.ApplyOrRemoveEnvSimple(container, prefix+"_SECUREPROTOCOLS", strings.Join(tlsVersions, ","))
}
