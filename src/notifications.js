const util = require("./utils");

module.exports = async function (RED) {
  const teknoirCfg = await util.config();
  const admin = util.admin(teknoirCfg.ADMIN_HOST, teknoirCfg.NAMESPACE)
  const kfam = util.kfam(teknoirCfg.KFAM_HOST, teknoirCfg.NAMESPACE)

  function Init(config) {
    var node = this;
    RED.nodes.createNode(this, config);
    const context = this.context();

    node.on("input", async function (msg) {
      const title = msg.payload.title || config.notifTitle
      const body  = msg.payload.body || config.notifBody
      const emails  = msg.payload.emails || config.recepients
      if (emails.length && emails.length > 0) {
        admin.postWebPush(emails, title, body)
      }
    });
  }

  RED.httpAdmin.get("/notifications/organisation-emails", async function (req, res) {
    return kfam.getEmails().then(x => res.json(x))
  });

  RED.nodes.registerType("teknoir-push-notification", Init);
};
