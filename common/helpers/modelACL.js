/**
 * Created by Antonio Di Mariano on 13/10/15.
 * email:antonio.dimariano@gmail.com
 * https://github.com/antoniodimariano/
 */

module.exports = function (app) {

  var User = app.models.user;
  var Role = app.models.Role;
  var RoleMapping = app.models.RoleMapping;
  var ACL = app.models.ACL;


  return {

    createRole: function createRole(roleName, next) {

      console.log("roleName",roleName);
      Role.findOne({'name': roleName}, function (err, role) {
        if (err) {
          console.log('Role.findOne Error', err);
          next(false);
        }
        console.log("Role",role);
        if (role) {
          console.log("[createRole] Role is already created")
          next(false)
        } else {
          Role.create({
            name: roleName
          }, function (err, role) {
            if (err) throw err;
            console.log('[createRole][Role.createad] : ', role);
            next(true);
          });
        }
      })
    },

    addPrincipalIdToRole: function addPrincipalIdToRole(roleName, principalType, principalId, next) {

      //cerco il ruolo ed estraggo id
      Role.findOne({'name': roleName}, function (err, role) {
        if (err) {
          console.log('Role.findOne Error', err);
          next(false);

        }
        if (role) {
          console.log("------------------------------------ ")
          console.log("[Role.id]:", role.id)
          console.log("[principalType]:", principalType)
          console.log("[principalId]:", principalId)
          console.log("------------------------------------ ")
          /*
           ISSUE
           The principleId field in
           the Rolemapping model is stored as a string in mongodb
           Delete principalId = (principalId).toString() if you plan to use relation db
           */

          principalId = (principalId).toString()

          RoleMapping.find({where: {principalId: principalId}}, function (err, rolemapping) {
            if (err) {
              console.log('RoleMapping.find', err);
              next(false);
            }
            if (rolemapping && rolemapping.length > 0) {
              console.log("[addPrincipalIdToRole]:esiste return false", rolemapping.length);
              return next(false)
            }
            console.log("!rolemapping", principalType + ' ' + principalId + " " + rolemapping.length);
            role.principals.create(
              {
                principalType: principalType,
                principalId: principalId
              }, function (err, principal) {

                if (err) {
                  console.log('[addPrincipalIdToRole][role.principals.create] Error', err);
                  next(false);
                } else {
                  console.log("[addPrincipalIdToRole] OK", principal)
                  next(true);
                }
              })
          })
        }
        else {
          console.log("[addPrincipalIdToRole]!Role");
          next(false);
        }
      })
    },

    loadACL: function loadACL(modelName, next) {

      ACL.find({where: {model: modelName}}, function (err, acl) {

        if (acl && acl.length > 0) {

          acl.forEach(function (entry) {
            if (app.models[modelName]) {
              console.log(" entry:", entry);
              app.models[modelName].settings.acls.push(entry);
            }
          })
          next(true)

        }


      })

    },

    setACLtoModel: function setACLToModel(model, acl, next) {
      model.settings.acls.push(acl);
      ACL.create(acl, function (err, result) {
        console.log('[setACLtoModel] ACL entry created: %j', result);
        next();
      })
    },

    initDefaultDenyACL: function initDefaultDenyACL(model, next) {
      model.settings.acls.push
      (
        {
          "accessType": "*",
          "principalType": "ROLE",
          "principalId": "$everyone",
          "permission": "DENY"
        });
      next(true);
    },

    roleResolver: function roleResolver() {

    },


  }
}