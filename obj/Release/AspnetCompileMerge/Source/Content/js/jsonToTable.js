var JSONTable = (function () {
    this.Language = null;
    this.create = function (data, language) {
        var obj = data;
        if (typeof obj === "string") {
            obj = $.parseJSON(obj);
        }

        this.Language = language;

        return parse(obj, null, null);
    };

    this.wordwrap = function (str) {
        parts = str.split(" ");

        for (i = 0; i < parts.length; i++) {
            if (parts[i].length <= 30) continue;

            t = parts[i].length;
            p = "";

            for (var j = 0; j < (parts[i].length - 30) ; j += 30) p += parts[i].substring(j, j + 30) + "<wbr />";
            parts[i] = p + parts[i].substring(j, parts[i].length);
        }

        return parts.join(" ");
    };

    this.toLanguage = function (value) {
        try
        {
            if (value == null || value == '') return value;
            if (value[0] != "{") return value;

            var parsed = JSON.parse(value);

            if (parsed[this.Language] != null && parsed[this.Language] != "") return parsed[this.Language];

            return parsed["en"];
        }
        catch (e)
        {
        }

        return value;
    };

    this.parse = function (val, parent, level) {
        if (parent == null) parent = "";
        if (level == null) level = 1;

        if (typeof (val) == "object") {

            if (val instanceof Array) {
                parent = parent + (parent != "" ? " > " : "") + "Array (" + val.length + " item" + (val.length != 1 ? "s)" : ")");

                var out = "<div class='wrap'>\n<div class='array'>\n";

                if (val.length > 0) {
                    out += "<table class='table table-bordered'>\n";

                    for (prop in val) {
                        if (typeof (val[prop]) == "function") continue;
                        out += "<tr><td>" + this.toLanguage(prop) + "</td><td>" + parse(val[prop], parent, level + 1) + "</td></tr>\n";
                    }

                    out += "</table>\n";
                }
                else { return ""; }
                out += "</div>\n</div>\n";

                return out;
            }
            else {
                i = 0;
                for (prop in val) {
                    if (typeof (val[prop]) != "function") i++;
                }

                parent = parent + (parent != "" ? " > " : "") + "Object (" + i + " item" + (i != 1 ? "s)" : ")");

                var out = "<div class='wrap'>\n<div class='object'>\n";

                if (i > 0) {
                    out += "<table class='table table-bordered'>\n";
                    for (prop in val) {
                        if (typeof (val[prop]) == "function") continue;
                        out += "<tr><td>" + this.toLanguage(prop) + "</td><td>" + parse(val[prop], parent, level + 1) + "</td></tr>\n";
                    }

                    out += "</table><div class='clear'></div>\n";
                }
                else {
                    return "";
                }

                out += "</div>\n</div>\n";
                return out;
            }
        }
        else
        {
            if (typeof (val) == "string") {
                if (val.indexOf('/Date') != -1) {
                    try {
                        var d = /\/Date\((\d*)\)\//.exec(val);
                        var d2 = d ? new Date(+d[1]) : val;

                        d2 = moment(d2).format('YYYY-MM-DD HH:mm:ss');

                        return "<span class='string'>" + d2 + "</span>";
                    }
                    catch (e) {
                        return "<span class='string'></span>";
                    }
                }
                else {
                    return "<span class='string'>" + wordwrap(this.toLanguage(val).replace(/\n/g, "<br />")) + "</span>";
                }
            }
            else if (typeof (val) == "number") return "<span class='number'>" + val + "</span>";
            else if (typeof (val) == "boolean") return "<span class='boolean'>" + val + "</span>";
            else return "<span class='void'>(null)</span>";
        }
    };

    return this;

})();