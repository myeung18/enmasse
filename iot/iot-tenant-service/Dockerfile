FROM quay.io/enmasse/java-base:11-6

ARG version
ARG maven_version
ARG revision
ENV VERSION=${version} REVISION=${revision} MAVEN_VERSION=${maven_version}

ADD target/iot-tenant-service-${maven_version}.jar /iot-tenant-service.jar

ENV JAVA_LAUNCH_PROFILE=openjdk-11
CMD ["/opt/run-java/launch_java.sh", "-jar", "/iot-tenant-service.jar"]
