export function format(str, obj) {
    var re = new RegExp(/{(.*?)}/, 'g');

    var matches = str.match(re);
    var newString = str;

    for (var index in matches) {
        var match = matches[index];
        var propertyName = match.replace('{', '').replace('}', '');
        newString = newString.replace(match, obj[propertyName]);
    }

    return newString;
}