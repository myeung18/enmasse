# mock-console-server

EnMasse mock console server that serves a static data-set comprising two namespaces, three address spaces, and many
addresses of different types. Address spaces and address can be created, patched or deleted.
Addresses can be purged. Connections can be closed.

TODO:

- How do we signal to the console, in a data driven way, if the user is able to purge an address?
  This may be due to restrictions on the type of object itself (ie. cast address can't be purged), or
  this user does not have permission.

# Running

`node mock-console-server.js`

Navigate to http://localhost:4000/ to use the GraphQL playground. This lets you explore the schema and run queries
dynamically.

# Filters

Most queries accept a `filter` argument. This allows filtering of the results. The filter is specified by a
SQL-92 style `where` clause. JSON-path operands are supported thus allowing filtering of any leaf node of the result
object. A JSON-path operand in the expression are enclosed in backticks.

e.g.

```
 `$.metadata.name` = 'jupiter_as1' AND `$.ObjectMeta.Namespace` = 'app1_ns'
```

# Sorting

Most queries accept a `orderBy` argument. This allows the sorting of the results by one or more fields.
The sort clause is specified by a SQL-92 like `order by` clause with JSON-paths identifying the leaf node in the
result that is to be subjected to the sort. Sort order can be `ASC` (ascending - default) or `DESC` (descending).

An ascending sort:

```
"`$.metadata.name`"
```

Multiple sort clauses are supported. Separate each clause with a comma.

A two clause sort:

```
"`$.spec.type` ,`$.metadata.name` desc"
```

# Paging

The queries that may return a large result accept pagination. The pagination
arguments are `first` which specifies the number of rows to be returned and `offset`
the starting index within the result set. The object return provides a count
of the number of rows in the result set in total.

# Environment

The following environment variables are understood:

STATE_CHANGE_TIMEOUT - length of time in ms between state transitions of new address space and addres objects

# Example Queries

## all address space types

```
query addressSpaceTypes {
  addressSpaceTypes_v2 {
    metadata {
      name
    }
    spec {
      displayName
      longDescription
      shortDescription
    }
  }
}


```

## all address types

```
query addressTypes {
  addressTypes_v2(addressSpaceType: standard) {
    metadata {
      name
    }
    spec {
      displayName
      longDescription
      shortDescription
    }
  }
}
```

## all_address_spaces

```
query all_address_spaces {
  addressSpaces {
    total
    addressSpaces {
      metadata {
        namespace
        name
        creationTimestamp
      }
      spec {
        type
        plan {
          spec {
            displayName
          }
        }
      }
      status {
        phase
        isReady
        messages
      }
    }
  }
}
```

# all_messagingendpoints_for_addressspace_view

```
query all_messagingendpoints_for_addressspace_view {
  messagingEndpoints( filter: "`$.metadata.name` LIKE 'jupiter_as1.%' AND `$.metadata.namespace` = 'app1_ns'") {
    total
    messagingEndpoints {
      metadata {
        name
        namespace
        uid
      }
      spec {
        protocols
      }
      status {
        type
        host
        ports {
          name
          protocol
          port
        }
      }
    }
  }
}

```

## all_addresses_for_addressspace_view

```
query all_addresses_for_addressspace_view {
  addresses(
    filter: "`$.metadata.name` LIKE 'jupiter_as1.%' AND `$.metadata.namespace` = 'app1_ns'"
  ) {
    total
    addresses {
      metadata {
        namespace
        name
      }
      spec {
        address
        plan {
          spec {
            displayName
          }
        }
      }
      status {
        isReady
        messages
        phase
        planStatus {
          partitions
        }
      }
      metrics {
        name
        type
        value
        units
      }
    }
  }
}
```

## addresses with ordering

Illustrates order on a metric (note the uses a JSON path filter to identify the metric of interest by name):

```
query addr {
 addresses(orderBy: "`$.metrics[?(@.Name=='enmasse_messages_stored')].Value` ASC"){
    total
    addresses
    {
      metadata {
        name
      }
      metrics {
        name
        value
      }
    }
  }
}
```

And a two-column order:

```
query addr {
 addresses(orderBy: "`$.status.phase` DESC, `$.metadata.name` ASC"){
    total
    addresses
    {
      metadata {
        name
      }
      status {
        phase
      }
    }
  }
}
```

## all_connections_for_addressspace_view

```
query all_connections_for_addressspace_view {
  connections(
    filter: "`$.spec.addressSpace` = 'jupiter_as1' AND `$.metadata.namespace` = 'app1_ns'"
  ) {
    total
    connections {
      metadata {
        name
      }
      spec {
        hostname
        containerId
        protocol
        encrypted
      }
    }
  }
}
```

## all_address_plans

```
query all_address_plans {
  addressPlans (
    addressSpacePlan:"standard-small"
  ) {
    spec {
      addressType
      displayName
      longDescription
      shortDescription
      displayOrder
    }
  }
}
```

## filtered_address_plans

address plans can be filtered by address space plan and/or address type.

```
query filtered_address_plans {
  addressPlans(addressSpacePlan: "standard-medium", addressType: queue) {
    metadata {
      name
    }
    spec {
      addressType
      displayName
      longDescription
      shortDescription
    }
  }
}
```

## all_authentication_services (from the address space schema)

```
query addressspace_schema {
  addressSpaceSchema_v2  {
    metadata {
      name
    }
    spec {
      authenticationServices
    }
  }
}
```

## filtered_authentication_services

schema authentication services can be filtered by address space type (from the address space schema)

```
query filtered_addressspace_schema($t:AddressSpaceType = standard){
  addressSpaceSchema_v2(addressSpaceType:$t)  {
    metadata {
      name
    }
    spec {
      authenticationServices
    }
  }
}
```

## all_authentication_services

all authentication services, including those that have no yet been validated

```
query authentication_services {
  authenticationServices {
    spec {
      type
    }
    metadata {
      name
    }
  }
}


```

## all_link_names_for_connection

```
query all_link_names_for_connection {
  connections(
    filter: "`$.metadata.name` LIKE 'juno:%' AND `$.spec.addressSpace` = 'jupiter_as1' AND `$.metadata.namespace` = 'app1_ns' "
  ) {
    connections {
      links {
        total
        links {
          metadata {
            name
          }
        }
      }
    }
  }
}
```

# single_address_with_links_and_metrics

```
query single_address_with_links_and_metrics {
  addresses(
    filter: "`$.metadata.name` = 'jupiter_as1.ganymede' AND `$.metadata.namespace` = 'app1_ns'"
  ) {
    total
    addresses {
      metadata {
        name
      }
      spec {
        addressSpace
      }
      links {
        total
        links {
          metadata {
            name
          }
          spec {
            role
            connection {
              spec {
                containerId
              }
            }
          }
          metrics {
            name
            type
            value
            units
          }
        }
      }
    }
  }
}
```

## Retrieve list of Iot tenants and messaging projects

```
query {
  allProjects {
    total
    objects {
      ... on AddressSpace_consoleapi_enmasse_io_v1beta1 {
        kind
        metadata {
          name
          namespace
        }
      }
      ... on IoTProject_iot_enmasse_io_v1alpha1 {
        kind
        metadata {
          name
          namespace
        }
        enabled
      }
    }
  }
}

```

## Retrieve a list of iot project

```
query {
  allProjects (
     filter: "`$.kind`='IoTProject'"
  ) {
    total
    objects {
      ... on AddressSpace_consoleapi_enmasse_io_v1beta1 {
        kind
        metadata {
          name
          namespace
        }
      }
      ... on IoTProject_iot_enmasse_io_v1alpha1 {
        kind
        metadata {
          name
          namespace
        }
        enabled
      }
    }
  }
}
```

## Retrieve a list of iot project and filter by state

```
query {
  allProjects (
     filter: "`$.kind`='IoTProject' AND `$.enabled` = true"
  ) {
    total
    objects {
      ... on AddressSpace_consoleapi_enmasse_io_v1beta1 {
        kind
        metadata {
          name
          namespace
        }
      }
      ... on IoTProject_iot_enmasse_io_v1alpha1 {
        kind
        metadata {
          name
          namespace
        }
        enabled
      }
    }
  }
}
```

## Retrieve a list of AddressSpace

```
query {
  allProjects (
     filter: "`$.kind`='AddressSpace'"
  ) {
    total
    objects {
      ... on AddressSpace_consoleapi_enmasse_io_v1beta1 {
        kind
        metadata {
          name
          namespace
        }
      }
      ... on IoTProject_iot_enmasse_io_v1alpha1 {
        kind
        metadata {
          name
          namespace
        }
        enabled
      }
    }
  }
}
```

## Retrieve Iot devices for an iot project

```
query {
  devices(
    iotproject: { name: "iotProjectFrance", namespace: "app1_ns" }
    filter: "`$.enabled` = FALSE"
  ) {
    total
    devices {
      deviceId
      enabled
      status {
        created
        updated
      }
    }
  }
}

```

## Retrieve Iot devices for an iot project ordered by creation date

```
query {
  devices(
    iotproject: { name: "iotProjectFrance", namespace:"app1_ns" },
    orderBy: "`$.status.created` asc"
  ) {
    total
    devices {
      deviceId
      enabled
      via
      status{
        created
        lastUser
      }
    }
  }
}
```

## Retrieve Iot device filtered by device ID

```
query {
  devices(
    iotproject: { name: "iotProjectFrance", namespace:"app1_ns" },
    filter: "`$.deviceId`='10'"
  ) {
    total
    devices {
      deviceId
      enabled
      status {
        created
        updated
      }
    }
  }
}
```

## Retrieve enabled Iot devices

```
query {
  devices(
    iotproject: { name: "iotProjectFrance",namespace: "app1_ns" },
    filter: "`$.enabled` = TRUE"
  ) {
    total
    devices {
      deviceId
      enabled
      status {
        created
        updated
      }
    }
  }
}
```

## Retrieve credentials for device

```
query {
  credentials(
    iotproject: { name: "iotProjectIndia", namespace:"app1_ns" },
    deviceId: "20"
  ) {
    total
    credentials
  }
}
```

## Retrieve credentials for device filtering with auth-id

```
query {
  credentials(
    filter: "`$['auth-id']` = 'user-1'"
    iotproject: { name: "iotProjectIndia", namespace:"app1_ns" },
    deviceId: "20"
  ) {
    total
    credentials
  }
}
```

# Example Mutations

## Create address space

To create an address space, pass an input object describing the address space
to be created. The return value is the new address space's metadata.

```
mutation create_as($as: AddressSpace_enmasse_io_v1beta1_Input!) {
  createAddressSpace(input: $as) {
    name
    uid
    creationTimestamp
  }
}
```

args:

```
{
  "as": { "metadata": {"name": "wibx", "namespace": "app1_ns" },
    "spec": {"type": "standard", "plan": "standard-small"}}
}
```

### cluster service only with self signed certificate

```json
{
  "as": {
    "metadata": { "name": "venus", "namespace": "app1_ns" },
    "spec": {
      "type": "standard",
      "plan": "standard-small",
      "endpoints": [
        {
          "name": "messaging",
          "service": "messaging",
          "certificate": {
            "provider": "selfsigned"
          }
        }
      ]
    }
  }
}
```

### openshift route and cluster service with self signed certificate

```json
{
  "as": {
    "metadata": { "name": "venus", "namespace": "app1_ns" },
    "spec": {
      "type": "standard",
      "plan": "standard-small",
      "endpoints": [
        {
          "name": "messaging",
          "service": "messaging",
          "certificate": {
            "provider": "selfsigned"
          },
          "expose": {
            "type": "route",
            "routeServicePort": "amqps",
            "routeTlsTermination": "passthrough"
          }
        }
      ]
    }
  }
}
```

### openshift route and cluster service with cert bundle cert

```json
{
  "as": {
    "metadata": { "name": "venus", "namespace": "enmasse-infra" },
    "spec": {
      "type": "standard",
      "plan": "standard-small",
      "endpoints": [
        {
          "name": "messaging",
          "service": "messaging",
          "certificate": {
            "provider": "certBundle",
            "tlsKey": "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2Z0lCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktnd2dnU2tBZ0VBQW9JQkFRREJTakI0UUlUZURTbVcKd3puREdMaVB3N1BnNWxDNi8zTWhPQmFFTTF3NE50V3B6WWxjaGs4anA2ZGlOUzQxTS9uUGFiS2pyNWtsVjAwdwo1UXlpSVdweDQ1LzZEaDBGMW5ocnJNZ1RueC9VYzlVaHovZmVFdkc3dmJZY3ZYY2pjM3dzN3dhbUh6RjZObGJCCkVjZ29zc1ZWWXlmTVFrYjZwbnNESjFrTTZEZ0wyQ1BoMk8yZUxVN2trZzh2aHlTQlFHUXZTbFA3R0pCRjBpWkkKbFpFaWxhM3JQM0RMakd0Tk1iTXpWdWlYU1NEMTJNOG9XQUV2dTlGbDdZSG00MUQxWGsrMmRXTTEveGxldmxBcworUTZsWC96ZU9DMzk5cnN5bFA1WHlYOGFGNHROMWRnTXRlbG1CeUZ2N1Q0SS9mZVh6ektYb29ENXhSaExQM1ExClpuTXRheWc5QWdNQkFBRUNnZ0VBQkJ2QWxmM0JGVHN3WkJ6NE1GWnBMZDBhQ0xDOGpJejdkSHhOdGplbFFTaWgKTi8rL2FMRU9JNUxmc3Uyd2NyOE5FMFNLNElITi9vWXhoTldKaERTem40SVlGMmVQWkYxZnArSS9Tbk42YUxpaApraHRxaUZUY3dJSFN5aCtZMWE4UnQ1N0pCR1RyVjA2cVgyWXlXL01ZMEt6UDNyNlY1YVArUDEzcHZhVjk4M3AyCklISFlMaUFEaVVpNnRiRGNXdnNRZnNHbVNwZkFPOWlhR3BsQXNOTStVSm1xd04vSnQ2UjlrdHpoY0w0ZHNoSGcKSnBKWDBRT1NkRndRdWZpQVJYc2FZOW5zRUdVM3lITFRDdmZxYzRMbVNZRGtPVVpHMHd0dzArRlZqMkFlWTZCbwpDNloyNDR5anJzNTgxcWZwRThTY2VHOUppcFA3ZGZOUUF6OGU4NTB0M1FLQmdRRDFONXNtakV0UnlCSGI1ZnBoClZ3QUR4UWRFRmUxOGl1dWI3eUxXcHdMUjZiRGgzeURJT0V2UU41Mk90YVBKZWN6djBtYStCOHVTUVlaYm5mQzMKU1pPeHhBR2IxM1o0L2pNNHFPSDBXdWhyY2xTNHZ1MVZ0ejlDM3FiajdDTGlOWGVmQ3MvNXkwdXB6YUdOa2pwWQpWQmJIS21mL2UyNzJ2YXpaR1BxU1kyQTlod0tCZ1FESnlnbzBteUMzOVBDc0lud0h2aDB3SFdxL3VXdjdYS2RVCnBtS0F3MEluN3k2KytTOXUvbkJwL21XdFlvM3I4UUc1WlVuMGJ5d1NVRHJYL1YrMy8xYzZ0MmNkSW1NYWR6aE4KWm9LSTJIWWloOG9scEFXRTJUSWFiU2oxR1c2TUd2cCtHTWJIV3Qxc1YzZXRVRGVpUTVnSC90TGNUYmt0NE4xbwoxbURRcW1pOUd3S0JnUUROVTg1YUxNYzBwMjRzenhra1FKRUdsd2hLZm9Ibzh2bnVEQU1EOGJ4dXdGc1lCcG1RCmpYTU4ya1BYcDBpSi82OFdjUHNPeThBdHF5Z3h0c0pFOXhyd2tzczJEdWhvejVGY05DMWZTbStxNklVQVhQNmwKODFiSlMxNDdJeExpanhxbTFZcm9BczVNVko2ZHlIK0tUbjcwTGhIKzN3QS9JdnVFbldIVENkc2dLUUtCZ0hsZApqRC9Sb1o4aXNmSkdGMlVzd2k5ak1nWTRScXI3TWlVbW9ZNGlZbExVZDhBaTdaV0xjUjgvQS9hQmxTeDRXdm9mCjRwZ2ltVlkyYlAzbGhjR0wwUElleHVUdC9yODNQMlRHSi9LWWhvMEVNTi9zdytrQUhUTnB2ajJVV3pubkxBdlYKYVJFVUpLTDZCSi8zNUU0eTYyaTdxaVVZbGl6eTF4Z3NBRFRnbVhoTEFvR0JBS0pWVnl3czJua0hEdzRnVXNKeApieEZJSXppNVhnTUFxMTFLY0NaWXNYUytOZGhHSnk3KytOUjF6MVpienNidGZDS2RwRlltd3BEenJhdWdGdE9uCnoxeklvSUZWUE85MW1ubFQ1U0lTcHBmTjZlTEpLU3FnSEZkNGlQakZWNDRPcEtnVitsYk1NWnZleDk1aDdWOTIKZDJPd3hsRzd6bUZ4SUMwN1ZuV2tWSFRTCi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K",
            "tlsCert": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUN0VENDQVowQ0ZBYkFHaDZMMlJWTDhpR3ZuTnZDczMxRCt0bUVNQTBHQ1NxR1NJYjNEUUVCQ3dVQU1Cd3gKQ3pBSkJnTlZCQVlUQWxWTE1RMHdDd1lEVlFRS0RBUk5lVU5CTUNBWERUSXdNRFV4TURFM05ESXpPVm9ZRHpJdwpOVEF3TmpJeU1UYzBNak01V2pBUU1RNHdEQVlEVlFRRERBVm5kV1Z6ZERDQ0FTSXdEUVlKS29aSWh2Y05BUUVCCkJRQURnZ0VQQURDQ0FRb0NnZ0VCQU1GS01IaEFoTjROS1piRE9jTVl1SS9EcytEbVVMci9jeUU0Rm9RelhEZzIKMWFuTmlWeUdUeU9ucDJJMUxqVXorYzlwc3FPdm1TVlhUVERsREtJaGFuSGpuL29PSFFYV2VHdXN5Qk9mSDlSegoxU0hQOTk0UzhidTl0aHk5ZHlOemZDenZCcVlmTVhvMlZzRVJ5Q2l5eFZWako4eENSdnFtZXdNbldRem9PQXZZCkkrSFk3WjR0VHVTU0R5K0hKSUZBWkM5S1Uvc1lrRVhTSmtpVmtTS1ZyZXMvY011TWEwMHhzek5XNkpkSklQWFkKenloWUFTKzcwV1h0Z2VialVQVmVUN1oxWXpYL0dWNitVQ3o1RHFWZi9ONDRMZjMydXpLVS9sZkpmeG9YaTAzVgoyQXkxNldZSElXL3RQZ2o5OTVmUE1wZWlnUG5GR0VzL2REVm1jeTFyS0QwQ0F3RUFBVEFOQmdrcWhraUc5dzBCCkFRc0ZBQU9DQVFFQU9lUjBGSk8zcElpeTJScG5SRUlYNzFkMi9RVzlWL1gwUjJOVGNaN2F1MFAyNVY5ZUgvdFEKdktwY1NHc1U4by9mekxSdDZtSG9jaDQvdFJTa25CWTAwaUZ1dFZMdDBOUk9KQi9KYXZlRkYrY2FtdDF6LzBjaQpQK0hQMmk4d1hSQnhybnU0c3lXOG00bXMvRDFveGE3TnMwdkdyNG1xa0RhbFh4amhwVlBsczBwTkZsZVJkc2h1CkJZM0FPLzV4RHJ5MXk1TG54R0NWVGdiektIQU02ejJzcGZiVS9EN0Zhd3ZTSmYraHhRaGVLQ0ZXU2tFRmJKNjYKREFNZGJhdVpld08vNE4wTi9LTmNnYTg0UXJBSVF2RnYrVmMxaVJvZEEzUzh2SVBGSkczdnBIbmRQajJ0QUhoRgo5dnJ5US9zSStYMWYxaklQV3htQjc4MlFCRm9nNDJsR1R3PT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo="
          },
          "expose": {
            "type": "route",
            "routeServicePort": "amqps",
            "routeTlsTermination": "passthrough"
          }
        }
      ]
    }
  }
}
```

## Patch address space

To patch an address space, pass the input object corresponding to the address space's
metadata and a JSON patch of the resource's spec describing the update
to be made.

The mock server currently implements RFC 6902 application/json-patch+json.

```

mutation patch_as(
$a: ObjectMeta_v1_Input!
  $jsonPatch: String!
$patchType: String!
) {
  patchAddressSpace(input: $a, jsonPatch: $jsonPatch, patchType: $patchType)
}

```

args:

(patching a plan)

```

{
"a": {"name": "jupiter_as1", "namespace": "app1_ns" },
"jsonPatch": "[{\"op\":\"replace\",\"path\":\"/spec/plan\",\"value\":\"standard-medium\"}]",
"patchType": "application/json-patch+json"
}

```

(patching a authentication service name)

```

{
"a": {"name": "jupiter_as1", "namespace" : "app1_ns" },
"jsonPatch": "[{\"op\":\"replace\",\"path\":\"/spec/authenticationService/name\",\"value\":\"foo\"}]",
"patchType": "application/json-patch+json"
}

```

## Delete address spaces

To delete address spaces, call `deleteAddressSpaces` passing the ObjectMeta
objects associated with the address space(s) to delete.

```
mutation delete_as($as:[ObjectMeta_v1_Input!]!) {
  deleteAddressSpaces(input:$as)
}

```

args:

```

{
  "as": [{"name": "jupiter_as1", "namespace": "app1_ns" }]
}

```

## Create address

```

mutation create_addr($a:Address_enmasse_io_v1beta1_Input!) {
  createAddress(input: $a) {
Name
Namespace
Uid
}
}

```

args:

```

{
"a": { "metadata": {"name": "jupiter_as1.wiby1", "namespace": "app1_ns" },
"spec": {"type": "queue", "plan": "standard-small-queue", "address": "wiby1", "addressSpace": "jupiter_as1"}}
}

```

It is also possible to create an address without an ObjectMeta.name. In this case the ObjectMeta.Name is defaulted
from the Spec.Address:

```

mutation create_addr($a:Address_enmasse_io_v1beta1_Input!, $as:String) {
  createAddress(input: $a, addressSpace: $as) {
      Name
      Namespace
      Uid
  }
}

```

args:

```

{
"a": { "metadata": {"namespace": "app1_ns" },
"spec": {"type": "queue", "plan": "standard-small-queue", "address": "foo2", "addressSpace": "jupiter_as1"}}
}

```

# Patch address

To patch an address, pass the input object corresponding to the address
metadata and a JSON patch of the resource's spec describing the update
to be made.

```

mutation patch_addr(
$a: ObjectMeta_v1_Input!
  $jsonPatch: String!
$patchType: String!
) {
  patchAddress(input: $a, jsonPatch: $jsonPatch, patchType: $patchType)
}

```

args:

```

{
"a": {"name": "jupiter_as1.ganymede", "namespace": "app1_ns" },
"jsonPatch": "[{\"op\":\"replace\",\"path\":\"/spec/plan\",\"value\":\"standard-medium-queue\"}]",
"patchType": "application/json-patch+json"
}

```

# Delete addresses

To delete address(es), call `deleteAddresses` passing the ObjectMeta
objects associated with the address(es) to delete.

```
mutation delete_addr($a:[ObjectMeta_v1_Input!]!) {
  deleteAddresses(input:$a)
}

```

args:

```

{
  "a": [{"name": "jupiter_as1.io", "namespace": "app1_ns" }]
}

```

# Purging addresses

To purge addresses (i.e clear them of their messages), call `purgeAddresses` passing an array of 0the ObjectMeta
objects corresponding to the addresses to purge.

```

mutation purge_addresses($addrs:[ObjectMeta_v1_Input!]!) {
  purgeAddresses(input:$addrs)
}

```

args:

```

{
"addrs": [{"name": "jupiter_as1.wiby1", "namespace": "app1_ns" }]
}

```

# Closing connection

To close a connection, call `closeConnection` passing the ObjectMeta
object associated with the connection to close.

```

mutation close_connections($cons:[ObjectMeta_v1_Input!]!) {
  closeConnections(input:$cons)
}

```

args:

```

{
"cons": [{"name": "cassini:55596", "namespace": "app1_ns" }]
}

```

# Messaging Certificate For Address Space

To get the messaging certificate for an existing address space.

```

query messagingCertificateChain($as:ObjectMeta_v1_Input!) {
  messagingCertificateChain(input :$as)
}

```

```

{
"as": {"name": "cassini:55596", "namespace": "app1_ns" }
}

```

# Address Space / Address Command

To get the equivalent command line that, if run, would cause the given address space or address to be created.

```

query cmd($as: AddressSpace_enmasse_io_v1beta1_Input!) {
  addressSpaceCommand(input:$as)
}

```

args:

```

{
"as": { "metadata": {"name": "wibx", "namespace": "app1_ns" },
"spec": {"type": "standard", "plan": "standard-small"}}
}

```

For addresses, it is also possible to create an address without an ObjectMeta.name. In this case the ObjectMeta.Name
is defaulted from the Spec.Address:

```

query cmd($a: Address_enmasse_io_v1beta1_Input!, $as:String) {
addressCommand(input:$a, addressSpace: $as)
}

```

args:

```

{
"as": "jupiter_as",
"a": { "metadata": {"namespace": "app1_ns" },
"spec": {"type": "standard", "plan": "standard-small", "address":"foo"}}
}

```

## Create Iot project

```
mutation {
  createIotProject(input: {
    metadata: {
      name: "iotProjectGermany",
      namespace: "app1_ns"
    },
    enabled: true
  }) {
    creationTimestamp
  }
}
```

## Delete Iot project

```
mutation delete_iotProject($a:[ObjectMeta_v1_Input!]!) {
  deleteIotProjects(input:$a)
}
```

args:

```
{
  "a": [{"name": "iotProjectFrance", "namespace": "app1_ns" }]
}

```

## Toggle Iot project status

```
mutation toggle_iot_project_status($a: [ObjectMeta_v1_Input!]!, $status: Boolean!){
  toggleIoTProjectsStatus(input: $a, status: $status)
}
```

args:

```
{
  "a": [{"name": "iotProjectFrance", "namespace": "app1_ns" }],
  "status" : true
}

```

## Toggle Iot device status

```
mutation toggle_iot_devices_status($a: ObjectMeta_v1_Input!, $b: [String!]!, $status: Boolean!){
  toggleIoTDevicesStatus(iotproject: $a, devices: $b, status: $status)
}
```

args:

```
{
  "a": {"name": "iotProjectFrance", "namespace": "app1_ns" },
  "b": ["10", "12", "51"] ,
  "status" : false
}

```

## Create Iot device

```
mutation {
  createIotDevice(
    iotproject: {
       name: "iotProjectFrance",
       namespace: "app1_ns"
    },
    device: {
      deviceId: "Jens-phone",
      registration : {
        enabled: true
        ext: "{brand: samsung}"
      },
      credentials: "[{auth-id: \"pin\", type: \"password\", pwd-plain: \"1234\"}]"
    }
	) {
    deviceId
  }
}
```

## Delete Iot device

```
mutation {
  deleteIotDevices(
    iotproject: { name: "iotProjectFrance", namespace:"app1_ns" },
    deviceIds: ["11"]
  )
}
```

## Update iot device

```
mutation {
  updateIotDevice(
    iotproject: { name: "iotProjectFrance", namespace:"app1_ns" },
    device: {
      deviceId: "Jens-phone",
      registration : {
        enabled: true
        ext: "{brand: apple, headphone-jack: false}"
      }
    }
	) {
    deviceId
  }
}
```

## Set credentials for iot device

```
mutation {
  setCredentialsForDevice(
    iotproject: { name: "iotProjectFrance", namespace:"app1_ns" },
    deviceId: "Jens-phone"
    jsonData: ["{auth-id: \"pin\", type: \"password\", pwd-plain: \"1234\"}"]
	)
}
```

## Edit credentials for iot device

Assuming a device `Jens-phone` with no credentials:

```
[]
```

### Add a credential

Let's add one credential containing two secrets :

```
mutation {
  setCredentialsForDevice(
    iotproject: { name: "iotProjectFrance", namespace:"app1_ns" },
    deviceId: "Jens-phone"
    jsonData: '[
                {
                  "type": "hashed-password",
                  "auth-id": "jens",
                  "enabled": true,
                  "secrets": [
                    {
                      "not-after": "2020-10-01T10:00:00Z",
                      "pwd-plain": "some secret password",
                      "comment": "iphone"
                    },
                    {
                      "not-before": "2020-10-01T10:00:00Z",
                      "pwd-plain": "another different secret password",
                      "comment": "android"
                    }
                  ]
                }
              ]'
  )
}
```

When assigning a new secret, the server will assign it a UUID.
The server should not return secrets details, but send the UUID instead. If you query for the credentials
you should receive :

```
[
    {
      "type": "hashed-password",
      "auth-id": "jens",
      "enabled": true,
      "secrets": [
        {
          "not-after": "2020-10-01T10:00:00Z",
          "id": "2c3e8da0-daee-4905-8de6-acdda14beb23",
          "comment": "iphone"
        },
        {
          "not-before": "2019-10-01T10:00:00Z",
          "id": "7fd81926-c129-11ea-b3de-0242ac130004",
          "comment": "android"
        }
      ]
    }
]
```

### Delete a secret

But Jens doesn't want to keep the iphone, so to delete one of the secrets simply remove it from the payload,
while keeping the id for the secret.

```
mutation {
  setCredentialsForDevice(
    iotproject: { name: "iotProjectFrance", namespace:"app1_ns" },
    deviceId: "Jens-phone"
    jsonData: '[
        {
          "type": "hashed-password",
          "auth-id": "jens",
          "enabled": true,
          "secrets": [
            {
              "not-before": "2019-10-01T10:00:00Z",
              "id": "7fd81926-c129-11ea-b3de-0242ac130004",
              "comment": "android"
            }
          ]
        }
    ]'
  )
}
```

### Add a secret

Jens installed a second app on his phone, let's add another secret :

```
mutation {
  setCredentialsForDevice(
    iotproject: { name: "iotProjectFrance", namespace:"app1_ns" },
    deviceId: "Jens-phone"
    jsonData: '[
        {
          "type": "hashed-password",
          "auth-id": "jens",
          "enabled": true,
          "secrets": [
            {
              "not-before": "2019-10-01T10:00:00Z",
              "id": "7fd81926-c129-11ea-b3de-0242ac130004",
              "comment": "android"
            },
            {
              "pwd-plain": "The new password",
              "comment": "android another app"
            }
          ]
        }
    ]'
  )
}
```

### Edit a secret

To update a secret, send the new password/key/certificate value, or any other field.
(Here the comment is deleted and a `not-after` field is added. )

```
mutation {
  setCredentialsForDevice(
    iotproject: { name: "iotProjectFrance", namespace:"app1_ns" },
    deviceId: "Jens-phone"
    jsonData: '[
        {
          "type": "hashed-password",
          "auth-id": "jens",
          "enabled": true,
          "secrets": [
            {
              "not-before": "2019-10-01T10:00:00Z",
              "id": "7fd81926-c129-11ea-b3de-0242ac130004",
              "comment": "android"
            },
            {
              "not-after": "2020-10-01T10:00:00Z",
              "pwd-plain": "yet another new password"
            }
          ]
        }
    ]'
  )
}
```

### Add a credential

In addition to it's phone, jens got a computer, let's add another credential for it.
Note that this is a hashed-password with a different auth-id.
If i wanted to use the same auth-id I could set a PSK secret, but not a hashed-password.
The couple {auth-id, type} must be unique inside an iot project.

```
mutation {
  setCredentialsForDevice(
    iotproject: { name: "iotProjectFrance", namespace:"app1_ns" },
    deviceId: "Jens-phone"
    jsonData: '[
        {
          "type": "hashed-password",
          "auth-id": "jens",
          "enabled": true,
          "secrets": [
            {
              "not-before": "2019-10-01T10:00:00Z",
              "id": "7fd81926-c129-11ea-b3de-0242ac130004",
              "comment": "android"
            },
            {
              "not-after": "2020-10-01T10:00:00Z",
              "id": "98533132-17f0-4c19-be27-2c94731a8edc"
            }
          ]
        },
        {
          "type": "hashed-password",
          "auth-id": "jens-laptop",
          "enabled": true,
          "secrets": [
            {
              "pwd-plain": "some long password because its easy to type on a real keyboard",
            }
          ]
        }
    ]'
  )
}
```

### Delete a credential

Remove it from the payload and keep what you want to keep:

```
mutation {
  setCredentialsForDevice(
    iotproject: { name: "iotProjectFrance", namespace:"app1_ns" },
    deviceId: "Jens-phone"
    jsonData: '[
        {
          "type": "hashed-password",
          "auth-id": "jens",
          "enabled": true,
          "secrets": [
            {
              "not-before": "2019-10-01T10:00:00Z",
              "id": "7fd81926-c129-11ea-b3de-0242ac130004",
              "comment": "android"
            },
            {
              "not-after": "2020-10-01T10:00:00Z",
              "id": "98533132-17f0-4c19-be27-2c94731a8edc"
            }
          ]
        }
    ]'
  )
}
```

## Delete credentials for iot device

This will delete all credentials for a device.

```
mutation {
  deleteCredentialsForDevice(
    iotproject: { name: "iotProjectFrance", namespace:"app1_ns" },
    deviceId: "Jens-phone"
	)
}
```
