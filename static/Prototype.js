// https://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format

// First, checks if it isn't implemented yet. "{0} is dead, but {1} is alive! {0} {2}".format("ASP", "ASP.NET")
if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}

// String.format('{0} is dead, but {1} is alive! {0} {2}', 'ASP', 'ASP.NET');
if (!String.format) {
    String.format = function (format) {
        var args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}

// machaine.cleanString .    "'LeMessage".cleanString()
if (!String.prototype.cleanString) {
    String.prototype.cleanString = function () {
        return this.replace(/'/gi, "");
    }
}

// String.cleanString("'machaine")
if (!String.cleanString) {
    String.cleanString = function (message) {
        return message.replace(/'/gi, "");
    }
}


// machaine.trunDesc
if (!String.prototype.truncateString) {
    String.prototype.truncateString = function (nbChar) {
        if (this.length <= nbChar) {
            return this;
        }

        return this.slice(0, nbChar) + "...";
    }
}