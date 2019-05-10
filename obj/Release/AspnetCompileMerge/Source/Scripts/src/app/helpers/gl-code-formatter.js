export default function glCodeFormatter(rawValue) {
    const pattern = /^(\d{2})(\d{2})(\d{4})(\d{2})$/g;

    if (!pattern.test(rawValue)) {
        return rawValue;
    }

    return rawValue.replace(pattern, '$1-$2-$3-$4');
}