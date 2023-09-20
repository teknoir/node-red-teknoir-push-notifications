const fs = require("fs");
const fetch = require("node-fetch");
const os = require("os");

function getOwner(namespace, kfamHost) {
  const url = `${kfamHost}/kfam/v1/bindings?namespace=${namespace}`;
  return fetch(url)
    .then((x) => x.json())
    .then((x) => x.bindings.find((x) => x.RoleRef.name == "admin").name);
}

function k8sNamespace() {
  try {
    return fs.readFileSync(
      "/var/run/secrets/kubernetes.io/serviceaccount/namespace"
    );
  } catch (e) {
    return undefined;
  }
}

async function config() {
  NAMESPACE = process.env.NAMESPACE || k8sNamespace();
  KFAM_HOST =
    process.env.KFAM_URL ||
    "http://profiles-kfam.teknoir.svc.cluster.local:8081";
  ADMIN_HOST = process.env.ADMIN_HOST ||
      "http://admin.teknoir-system.svc.cluster.local:80"
  PIPELINES_HOST = process.env.PIPELINES_HOST ||
    "http://ml-pipeline.teknoir.svc.cluster.local:8888"

  return {
    ADMIN_HOST,
    ADD_AUTH_HEADER: process.env.ADD_AUTH_HEADER,
    PIPELINES_HOST,
    KFAM_HOST,
    NAMESPACE,
    OWNER: process.env.OWNER || (await getOwner(NAMESPACE, KFAM_HOST)),
    PROJECT_ID: process.env.PROJECT_ID,
    HOSTNAME: os.hostname(),  
  };
}

function kfam(kfam_api_host, namespace) {
  const _apiUrl = `${kfam_api_host}`;
  function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
      return response;
    }
    throw "api error appeared"
  }

  return {
    getEmails: function getEmails() {
      const url = `${_apiUrl}/kfam/v1/bindings?namespace=${namespace}`;
      return fetch(url)
        .then((x) => x.json())
        .then((x) => {
          return x.bindings.map((b) => {
            console.log(b)
            return b.user.name
          })});
    }
  };
}

function admin(admin_api_host, namespace) {
  const _apiUrl = `${admin_api_host}`;
  function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
      return response;
    }
    throw "api error appeared"
  }

  return {
    postWebPush: function (emails, title, body) {
      const data = {
        recepients: emails,
        channel : "webpush",
        data: { title, body }, 
      }
      return fetch(`${_apiUrl}/notifications`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      }).then(checkStatus)
        .then((res) => res.json())
        .then((json) => {
          console.log("postWebPush response data", json);
          return json;
        });
    }
  };
}

module.exports = {
  admin,
  kfam,
  config,
};
