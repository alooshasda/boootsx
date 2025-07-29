String.prototype.toUserId = function () {
  return this.replace(/[<@!>]/g, '');
}

String.prototype.toRoleId = function () {
  return this.replace(/[<@&!>]/g, '');
}

String.prototype.toChannelId = function () {
  return this.replace(/[<@#!>]/g, '');
}

String.prototype.toNumber = () => Number(this.valueOf());
Number.prototype.toNumber = () => Number(this.valueOf());
String.prototype.isNumber = isNumber;
Number.prototype.isNumber = isNumber;

function isNumber() {
    for (var r = !0, t = this.toString(), i = 0; i < t.length; i++)
        if (!t.charAt(i).match(/[0-9]/g)) {
            r = !r;
            break
        } return r
}