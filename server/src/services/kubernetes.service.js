const k8s = require("@kubernetes/client-node");
const logger = require("../config/logger");
const socketService = require("./socket.service");
const alertRepository = require("../repositories/alert.repository");
const notificationService = require("./notification.service");

let isK8sConnected = false;
let k8sCoreApi = null;
let k8sAppsApi = null;
let k8sAutoscalingApi = null;

try {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  const currentCluster = kc.getCurrentCluster();
  if (currentCluster && currentCluster.server) {
    k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
    k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
    try {
      k8sAutoscalingApi = kc.makeApiClient(k8s.AutoscalingV2Api);
    } catch {
      try {
        k8sAutoscalingApi = kc.makeApiClient(k8s.AutoscalingV1Api);
      } catch {}
    }
    isK8sConnected = true;
    logger.info({ cluster: currentCluster.name }, "Kubernetes client initialized with local kubeconfig");
  }
} catch (err) {
  logger.info("Kubernetes cluster not connected via local kubeconfig, operating with cluster simulation engine");
}

// In-memory simulated cluster state with live mutation capability
const clusterState = {
  clusterName: "cloudops-kind",
  nodes: [
    {
      name: "cloudops-control-plane",
      status: "Ready",
      roles: ["control-plane", "master"],
      version: "v1.30.2",
      cpuPercent: 42,
      memoryPercent: 57,
      podsCount: 8,
      internalIP: "172.18.0.2",
      osImage: "Ubuntu 24.04 LTS (Kind)",
      kubeletVersion: "v1.30.2",
      containerRuntime: "containerd://1.7.15",
    },
    {
      name: "cloudops-worker-1",
      status: "Ready",
      roles: ["worker"],
      version: "v1.30.2",
      cpuPercent: 68,
      memoryPercent: 49,
      podsCount: 6,
      internalIP: "172.18.0.3",
      osImage: "Ubuntu 24.04 LTS (Kind)",
      kubeletVersion: "v1.30.2",
      containerRuntime: "containerd://1.7.15",
    }
  ],
  pods: [
    {
      name: "cloudops-api-7d89b4f6-x8f2",
      namespace: "default",
      status: "Running",
      ready: "1/1",
      restarts: 0,
      age: "3h 42m",
      cpu: "120m",
      memory: "185Mi",
      node: "cloudops-control-plane",
      ip: "10.244.0.5",
      isUnhealthy: false,
      containers: [
        {
          name: "cloudops-api",
          image: "cloudops-api:v1.8.2",
          ready: true,
          restartCount: 0,
          ports: [5000],
          requests: { cpu: "100m", memory: "128Mi" },
          limits: { cpu: "500m", memory: "512Mi" },
        }
      ]
    },
    {
      name: "cloudops-frontend-5bc6d9-k19a",
      namespace: "default",
      status: "Running",
      ready: "1/1",
      restarts: 0,
      age: "3h 40m",
      cpu: "45m",
      memory: "68Mi",
      node: "cloudops-worker-1",
      ip: "10.244.1.4",
      isUnhealthy: false,
      containers: [
        {
          name: "cloudops-frontend",
          image: "cloudops-client:v1.8.2",
          ready: true,
          restartCount: 0,
          ports: [80],
          requests: { cpu: "50m", memory: "64Mi" },
          limits: { cpu: "200m", memory: "256Mi" },
        }
      ]
    },
    {
      name: "postgres-0",
      namespace: "default",
      status: "Running",
      ready: "1/1",
      restarts: 0,
      age: "5h 12m",
      cpu: "85m",
      memory: "240Mi",
      node: "cloudops-control-plane",
      ip: "10.244.0.6",
      isUnhealthy: false,
      containers: [
        {
          name: "postgres",
          image: "postgres:16-alpine",
          ready: true,
          restartCount: 0,
          ports: [5432],
          requests: { cpu: "100m", memory: "256Mi" },
          limits: { cpu: "1000m", memory: "1Gi" },
        }
      ]
    },
    {
      name: "redis-master-7f49c-m91x",
      namespace: "default",
      status: "Running",
      ready: "1/1",
      restarts: 0,
      age: "5h 10m",
      cpu: "22m",
      memory: "42Mi",
      node: "cloudops-worker-1",
      ip: "10.244.1.5",
      isUnhealthy: false,
      containers: [
        {
          name: "redis",
          image: "redis:7-alpine",
          ready: true,
          restartCount: 0,
          ports: [6379],
          requests: { cpu: "50m", memory: "32Mi" },
          limits: { cpu: "200m", memory: "128Mi" },
        }
      ]
    },
    {
      name: "payments-service-6d81cf-99az",
      namespace: "default",
      status: "Running",
      ready: "1/1",
      restarts: 1,
      age: "1h 15m",
      cpu: "95m",
      memory: "140Mi",
      node: "cloudops-worker-1",
      ip: "10.244.1.8",
      isUnhealthy: false,
      containers: [
        {
          name: "payments-service",
          image: "payments-service:v2.1.0",
          ready: true,
          restartCount: 1,
          ports: [5001],
          requests: { cpu: "100m", memory: "128Mi" },
          limits: { cpu: "500m", memory: "512Mi" },
        }
      ]
    }
  ],
  deployments: [
    {
      name: "cloudops-api",
      namespace: "default",
      ready: "1/1",
      desired: 1,
      upToDate: 1,
      available: 1,
      status: "Healthy",
      strategy: "RollingUpdate",
      images: ["cloudops-api:v1.8.2"],
      age: "3h 42m",
      replicaset: "cloudops-api-7d89b4f6",
    },
    {
      name: "cloudops-frontend",
      namespace: "default",
      ready: "1/1",
      desired: 1,
      upToDate: 1,
      available: 1,
      status: "Healthy",
      strategy: "RollingUpdate",
      images: ["cloudops-client:v1.8.2"],
      age: "3h 40m",
      replicaset: "cloudops-frontend-5bc6d9",
    },
    {
      name: "payments-service",
      namespace: "default",
      ready: "1/1",
      desired: 1,
      upToDate: 1,
      available: 1,
      status: "Healthy",
      strategy: "RollingUpdate",
      images: ["payments-service:v2.1.0"],
      age: "1h 15m",
      replicaset: "payments-service-6d81cf",
    }
  ],
  services: [
    {
      name: "cloudops-api",
      namespace: "default",
      type: "NodePort",
      clusterIP: "10.96.104.22",
      ports: "5000:30090/TCP",
      targetPort: 5000,
      nodePort: 30090,
      selector: "app=cloudops-api",
      age: "5h 12m",
    },
    {
      name: "cloudops-frontend",
      namespace: "default",
      type: "NodePort",
      clusterIP: "10.96.88.190",
      ports: "80:30080/TCP",
      targetPort: 80,
      nodePort: 30080,
      selector: "app=cloudops-frontend",
      age: "5h 12m",
    },
    {
      name: "postgres",
      namespace: "default",
      type: "ClusterIP",
      clusterIP: "10.96.220.15",
      ports: "5432/TCP",
      targetPort: 5432,
      nodePort: null,
      selector: "app=postgres",
      age: "5h 12m",
    },
    {
      name: "redis-master",
      namespace: "default",
      type: "ClusterIP",
      clusterIP: "10.96.170.84",
      ports: "6379/TCP",
      targetPort: 6379,
      nodePort: null,
      selector: "app=redis",
      age: "5h 10m",
    }
  ],
  hpa: [
    {
      name: "cloudops-api-hpa",
      namespace: "default",
      target: "Deployment/cloudops-api",
      minReplicas: 1,
      maxReplicas: 5,
      currentReplicas: 1,
      desiredReplicas: 1,
      currentCPU: 24,
      targetCPU: 70,
    }
  ],
  events: [
    {
      type: "Normal",
      reason: "Started",
      object: "Pod/cloudops-api-7d89b4f6-x8f2",
      message: "Started container cloudops-api (v1.8.2)",
      time: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      type: "Normal",
      reason: "Pulled",
      object: "Pod/cloudops-api-7d89b4f6-x8f2",
      message: "Successfully pulled image 'cloudops-api:v1.8.2' in 2.14s",
      time: new Date(Date.now() - 3605000).toISOString(),
    },
    {
      type: "Normal",
      reason: "ScalingReplicaSet",
      object: "Deployment/cloudops-api",
      message: "Scaled up replica set cloudops-api-7d89b4f6 to 1",
      time: new Date(Date.now() - 3610000).toISOString(),
    },
    {
      type: "Normal",
      reason: "NodeReady",
      object: "Node/cloudops-control-plane",
      message: "Node cloudops-control-plane status is now: NodeReady",
      time: new Date(Date.now() - 7200000).toISOString(),
    }
  ]
};

const getClusterOverview = async () => {
  let nodes = clusterState.nodes;
  let pods = clusterState.pods;
  let deployments = clusterState.deployments;

  if (isK8sConnected && k8sCoreApi) {
    try {
      const { body: nodeRes } = await k8sCoreApi.listNode();
      nodes = nodeRes.items.map((n) => ({
        name: n.metadata.name,
        status: n.status.conditions?.find((c) => c.type === "Ready")?.status === "True" ? "Ready" : "NotReady",
        roles: Object.keys(n.metadata.labels || {})
          .filter((l) => l.startsWith("node-role.kubernetes.io/"))
          .map((l) => l.replace("node-role.kubernetes.io/", "")),
        version: n.status.nodeInfo?.kubeletVersion,
        cpuPercent: 45,
        memoryPercent: 52,
        podsCount: 8,
        internalIP: n.status.addresses?.find((a) => a.type === "InternalIP")?.address,
        osImage: n.status.nodeInfo?.osImage,
      }));

      const { body: podRes } = await k8sCoreApi.listPodForAllNamespaces();
      pods = podRes.items.map((p) => {
        const isReady = p.status.containerStatuses?.every((c) => c.ready) ?? false;
        const status = p.status.phase;
        const restarts = p.status.containerStatuses?.reduce((acc, c) => acc + c.restartCount, 0) || 0;
        const isUnhealthy = ["CrashLoopBackOff", "ImagePullBackOff", "Pending", "Failed", "Error"].includes(
          p.status.containerStatuses?.[0]?.state?.waiting?.reason || status
        );

        return {
          name: p.metadata.name,
          namespace: p.metadata.namespace,
          status: p.status.containerStatuses?.[0]?.state?.waiting?.reason || status,
          ready: `${p.status.containerStatuses?.filter((c) => c.ready).length || 0}/${p.status.containerStatuses?.length || 1}`,
          restarts,
          age: "1h",
          node: p.spec.nodeName,
          ip: p.status.podIP,
          isUnhealthy,
        };
      });
    } catch (err) {
      logger.warn({ err: err.message }, "Live k8s query fallback to simulated state");
    }
  }

  const unhealthyPods = pods.filter(
    (p) => p.isUnhealthy || p.status === "CrashLoopBackOff" || p.status === "Failed" || p.status === "Error"
  );
  const unhealthyDeployments = deployments.filter((d) => d.status !== "Healthy" || d.ready.startsWith("0/"));

  const problemsCount = unhealthyPods.length + unhealthyDeployments.length;

  return {
    clusterName: clusterState.clusterName,
    nodesCount: nodes.length,
    podsCount: pods.length,
    deploymentsCount: deployments.length,
    problemsCount,
    cpuUsagePercent: 58,
    memoryUsagePercent: 51,
    health: {
      nodes: nodes.every((n) => n.status === "Ready") ? "Healthy" : "Warning",
      pods: unhealthyPods.length === 0 ? "Healthy" : "Degraded",
      deployments: unhealthyDeployments.length === 0 ? "Healthy" : "Warning",
      services: "Healthy",
    },
  };
};

const getNodes = async () => {
  return clusterState.nodes;
};

const getPods = async ({ namespace = null } = {}) => {
  if (namespace && namespace !== "all") {
    return clusterState.pods.filter((p) => p.namespace === namespace);
  }
  return clusterState.pods;
};

const getPodByName = async (name) => {
  const pod = clusterState.pods.find((p) => p.name === name);
  if (!pod) return null;

  const deepLinks = {
    lokiLogs: `http://localhost:3002/explore?left=%7B%22datasource%22:%22Loki%22,%22queries%22:%5B%7B%22expr%22:%22%7Bpod%3D%5C%22${pod.name}%5C%22%7D%22%7D%5D%7D`,
    jaegerTraces: `http://localhost:16686/search?service=cloudops-api`,
  };

  const relatedEvents = clusterState.events.filter(
    (e) => e.object.includes(pod.name) || e.object.includes(pod.name.split("-")[0])
  );

  return {
    ...pod,
    deepLinks,
    events: relatedEvents,
  };
};

const getDeployments = async ({ namespace = null } = {}) => {
  if (namespace && namespace !== "all") {
    return clusterState.deployments.filter((d) => d.namespace === namespace);
  }
  return clusterState.deployments;
};

const getServices = async ({ namespace = null } = {}) => {
  if (namespace && namespace !== "all") {
    return clusterState.services.filter((s) => s.namespace === namespace);
  }
  return clusterState.services;
};

const getHPA = async () => {
  return clusterState.hpa;
};

const getEvents = async () => {
  return clusterState.events;
};

// Simulation helper to inject an unhealthy pod or recover it
const simulatePodState = async (podName, newStatus) => {
  const pod = clusterState.pods.find((p) => p.name === podName || p.name.includes(podName));
  if (!pod) throw new Error(`Pod ${podName} not found`);

  pod.status = newStatus;
  pod.isUnhealthy = newStatus !== "Running";
  if (newStatus === "CrashLoopBackOff") {
    pod.restarts += 5;
    pod.ready = "0/1";
    clusterState.events.unshift({
      type: "Warning",
      reason: "BackOff",
      object: `Pod/${pod.name}`,
      message: `Back-off restarting failed container '${pod.containers?.[0]?.name || "api"}' in pod '${pod.name}'`,
      time: new Date().toISOString(),
    });

    try {
      const title = `Kubernetes Pod Crash: ${pod.name}`;
      const desc = `Pod '${pod.name}' entered CrashLoopBackOff. Readiness check failed (0/1 Ready). Restarts: ${pod.restarts}. Node: ${pod.node || "kind-control-plane"}`;
      
      const alert = await alertRepository.createAlert(1, title, "critical");

      socketService.emitAlertFiring({
        id: alert?.id || Date.now(),
        service_id: 1,
        service_name: pod.name,
        title,
        severity: "critical",
        description: desc,
        created_at: new Date().toISOString(),
      });

      // Dispatch Webhook Notification to Slack & Discord
      await notificationService.sendWebhookNotification(
        null,
        `🚨 Pod Failure: ${pod.name}`,
        desc,
        "critical"
      );
    } catch (e) {
      logger.warn({ err: e.message }, "Failed to trigger pod crash alert or notification");
    }
  } else if (newStatus === "Running") {
    pod.ready = "1/1";
    clusterState.events.unshift({
      type: "Normal",
      reason: "Started",
      object: `Pod/${pod.name}`,
      message: `Container '${pod.containers?.[0]?.name || "api"}' started and passed readiness probe`,
      time: new Date().toISOString(),
    });

    try {
      await notificationService.sendWebhookNotification(
        null,
        `🟢 Pod Recovered: ${pod.name}`,
        `Pod '${pod.name}' container restarted successfully and passed readiness probe (1/1 Ready).`,
        "info"
      );
    } catch (e) {
      logger.warn({ err: e.message }, "Failed to send pod recovery notification");
    }
  }

  logger.info({ pod: pod.name, status: newStatus }, "Simulated pod status updated");
  socketService.emitKubernetesPod(pod);
  return pod;
};

module.exports = {
  getClusterOverview,
  getNodes,
  getPods,
  getPodByName,
  getDeployments,
  getServices,
  getHPA,
  getEvents,
  simulatePodState,
};
