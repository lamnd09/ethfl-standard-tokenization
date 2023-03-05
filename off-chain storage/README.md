
# MongoDB StatefulSet Replicas on AWS EKS Cluster with Kubernetes in support Ethereum-FL
## Overview

In Kubernetes, a StatefulSet is used to manage stateful applications. A StatefulSet provides guarantees about the ordering and uniqueness of Pods, making it suitable for running replicated stateful applications, such as MongoDB replica sets. In this part, we implement MongoDB Statefulset Replicas on AWS EKS cluster using Kubernetes. 
In stateful application, the N-replicas of master nodes manages several worker nodes under a cluster. So, if any master node goes down the other ordinal instances will be active to execute the workflow. The master node instances must be identified as a unique ordinal number known as StatefulSet.

## Features 
- Ordered deployment: The MongoDB StatefulSet ensures that each replica is deployed in a specific order, which ensures that the primary node is created first, followed by the secondary nodes.
- Stable network identities: Each MongoDB replica in the StatefulSet has a unique and stable hostname that is based on the name of the StatefulSet, the name of the replica, and a unique index assigned by Kubernetes.
- Persistent storage: MongoDB StatefulSet replicas use persistent storage to ensure that data is not lost in case of pod restarts or failures. Each pod in the StatefulSet has a unique Persistent Volume Claim (PVC) associated with it.
- Automatic node replacement: If a MongoDB node fails or is removed from the StatefulSet, Kubernetes automatically creates a new replica and ensures that the data is replicated to the new node.
- Scaling: You can scale the number of MongoDB replicas in a StatefulSet up or down using Kubernetes commands. This allows you to easily add or remove capacity from your MongoDB cluster as needed.
- Rolling updates: The StatefulSet allows for rolling updates of the MongoDB replicas, which means that you can update the replicas one at a time, ensuring that there is always at least one replica available to serve requests.

## Requirements 
* Installed Kubectl, eksctl, aws cli

## Installation 
### Step 1 : Setup AWS EKS Cluster 
The simplest way to create a cluser is using eksctl. 
`
$ eksctl create cluster --name my-cluster --region region-code --fargate
`
"fargate" is an optional, in case you want implement the cluster using AWS Fargate. Fargate is a serverless compute engine that lets you deploy Kubernetes pods without managing Amazon EC2 instances.
In our case, we define the create-cluster.yaml configuration of a cluster first as below: 

```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: private-eks
  region: ap-southeast-2
vpc: 
  subnets:
    private:
      ap-southeast-2a: {id: subnet-024748a5aae594a2c}
      ap-southeast-2b: {id: subnet-0bce04a6aabbabf2a}
managedNodeGroups: 
- name: general
  privateNetworking: true
  instanceType: t3.medium
  desiredCapacity: 2
```

Then, we create a cluster using below command: 
`
$ eksctl create cluster -f create-cluster.yaml
`
you can check your successful cluster creation as below: 
    
    ubuntu@ip-10-0-0-46:~$ eksctl get clusters 
    NAME                    REGION          EKSCTL CREATED
    private-eks             ap-southeast-2  True


### Step 2 : Update kube-config to connect to the cluster 
In order to update the config of kubectl to connect with the aws cluster, use below command: 
`
$ aws eks update-kubeconfig --region ap-southeast-2 --name private-eks 
`
In which, please change the name of region and cluster name to match with your configuration. 

### Step 3: Create headless service for Mongodb Statefulset Replicas 

In the context of MongoDB StatefulSet replicas, a headless service is a Kubernetes service that is used to provide DNS entries for each replica. Unlike a regular Kubernetes service, a headless service does not have a cluster IP address. Instead, it returns the IP addresses of the individual replicas in the StatefulSet. This allows clients to connect directly to a specific replica by using its hostname, which is automatically created based on the name of the StatefulSet and the ordinal index of the replica.

The headless service is an important component of a MongoDB StatefulSet replica because it allows clients to maintain a persistent connection to a specific replica, even if the replica is rescheduled to a different node in the Kubernetes cluster. This is important for maintaining data consistency and minimizing downtime during failover events.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mongodb-service
  labels:
    app: mongo
spec:
  ports:
  - name: mongo
    port: 27017
    targetPort: 27017
  type: LoadBalancer
  selector:
    app: mongo 
```
Then,
`
$ kubectl apply -f mongodb-headless.yaml
`

### Step 4: Setup Mongodb Statefulset Replicas 

Note that before install MongoDB statefulset replicas, you need to have your PersistentVolume (PV) and PersistentVolumeClaim (PVC) available in your cluser. . A PersistentVolume (PV) is a storage abstraction in Kubernetes that represents a piece of storage in the cluster that has been provisioned by an administrator or dynamically provisioned using a storage class. A PV can be seen as a network disk that is available to the cluster nodes, and it has a lifecycle independent of any particular pod that may use it.

A PersistentVolumeClaim (PVC), on the other hand, is a request for a certain amount of storage by a pod. It is a request made to the cluster by a user to allocate storage for a pod. A PVC requests a certain amount of storage from the cluster, and Kubernetes satisfies the request by binding the claim to a matching PV.

In summary, PVs and PVCs provide a way to abstract storage away from the underlying infrastructure and provide a consistent way for pods to request and consume storage. They allow for data persistence across pod restarts and rescheduling in a Kubernetes cluster.

Create a pv and pvc as follow: 

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mongodb-cluster-pv
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: standard
  hostPath:
    path: /mnt/data

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongodb-cluster-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  storageClassName: standard

```
Apply PV and PVC to cluster: 
`
$ kubectl apply -f pv.yaml
`

Next, create a `mongodb-stateful-deployment.yaml` as below:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongo
spec:
  selector:
    matchLabels:
      app: mongo
  serviceName: mongo
  replicas: 3
  template:
    metadata:
      labels:
        app: mongo
    spec:
      terminationGracePeriodSeconds: 10
      containers:
      - name: mongo
        image: mongo
        command: 
        - mongod 
        - --bind_ip_all
        - --replSet
        - rs0
        ports:
        - containerPort: 27017
        volumeMounts:
        - name: mongo-volume
          mountPath: /data/mongo
      volumes:
        - name: mongo-volume
          persistentVolumeClaim:
            claimName: mongodb-cluster-pvc
```
And, run 
`
$ kubectl apply -f mongodb-stateful-deployment.yaml
`
Check your setup by this command: 

`
$ kubect get pods 
`
```bash
    ubuntu@ip-10-0-0-46:~$ kubectl get pods
    NAME      READY   STATUS    RESTARTS   AGE
    mongo-0   1/1     Running   0          10h
    mongo-1   1/1     Running   0          10h
    mongo-2   1/1     Running   0          10h
```

### Step 5: Create a LoadBalancer and expose external IP for connection from outside 
Create a `service.yaml` as below: 
```yaml
apiVersion: v1
kind: Service
metadata:
  name: mongodb-service
spec:
  type: LoadBalancer
  selector:
    app: mongo
  ports:
  - port: 27017
    protocol: TCP
    targetPort: 27017
```
There are multiple methods for external connection 
1. ClusterIP Service: This is the default service type in Kubernetes. It creates a virtual IP address that is only accessible within the cluster. It enables communication between the different components of the application running in the cluster.
2. NodePort Service: This type of service exposes an application on a static port on each node of the cluster. It also creates a ClusterIP service to enable communication between the nodes. This service type is typically used when external clients need to access the application running in the cluster.
3. LoadBalancer Service: This type of service exposes an application on a public IP address that can be accessed from outside the cluster. It typically works with a cloud provider's load balancer to distribute traffic to the nodes in the cluster.

In summary, ClusterIP is used for internal communication between components within the cluster, NodePort is used for external access to the application, and LoadBalancer is used to expose the application to the public internet.

And apply it to kubernetes cluster: 
`
$ kubectl apply -f service.yaml
`

### Step 6: Connect to the Mongdb replicas 
First, you need to check all to coniguration is successful by using the command :

`
$ kubectl get all 
`
The output looks like: 
```bash
ubuntu@ip-10-0-0-46:~$ kubectl get all
NAME          READY   STATUS    RESTARTS   AGE
pod/mongo-0   1/1     Running   0          10h
pod/mongo-1   1/1     Running   0          10h
pod/mongo-2   1/1     Running   0          10h

NAME                      TYPE           CLUSTER-IP       EXTERNAL-IP                                                                   PORT(S)           AGE
service/kubernetes        ClusterIP      172.20.0.1       <none>                                                                        443/TCP           6d20h
service/mongo             ClusterIP      None             <none>                                                                        27017/TCP         2d5h
service/mongodb-service   LoadBalancer   172.20.179.110   a4b468ee807e24911a57c91d63f97878-235541907.ap-southeast-2.elb.amazonaws.com   27017:30328/TCP   29h

NAME                     READY   AGE
statefulset.apps/mongo   3/3     10h
```

### Step 7: Setup your replicas 

First, please access to the mongdb pod by using: 
`
$ kubectl exec -it mongo-0 -- mongo
`
But, sometime you face an error that cannot find the `$PATH` to mongo, or you have not installed it yet.  The best way to figure out it is access using `/bin/bash` 
`
$ kubectl exec -it mongo-0 -- /bin/bash
`
Then, type `mongsh` to connect to the replicas: 
Setup the PRIMARY and SECONDARY Nodes as below: 

```bash
rs.initiate()
var cfg = rs.conf()
cfg.members[0].host="mongo-0.mongo:27017"
rs.reconfig(cfg)
rs.status()
rs.add("mongo-1.mongo:27017")
rs.add("mongo-2.mongo:27017")
rs.status()
exit
```

Finally , connect to the replicas from outside by using `mongsh` as below: 

`
mongsh <external-ip>:<port>/db -u username
`
### Note: Using mongodb Compass to connect to replicas: 

Please copy and paste this link to mongodb compass: 

`URI`

Credentials: 
username: cotton
dbname: cotton 

###End