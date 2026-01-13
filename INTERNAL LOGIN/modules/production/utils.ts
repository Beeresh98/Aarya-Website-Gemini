
export const today = new Date().toISOString().split('T')[0];

export const formatDate = (isoDate: string): string => {
    if (!isoDate || !isoDate.includes('-')) return isoDate;
    const date = new Date(isoDate);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset()); 
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-GB', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

export function numberToWords(num: number): string {
    const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    if (num === 0) return 'Zero';
    if (num > 999999999) return 'Number too large';
    const inWords = (n: number): string => {
        let str = "";
        if (n > 99) {
            str += a[Math.floor(n / 100)] + ' hundred';
            n %= 100;
            if (n > 0) str += ' ';
        }
        if (n > 19) {
            str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' : '') + a[n % 10];
        } else {
            str += a[n];
        }
        return str;
    }
    let n = Math.floor(num);
    let str = "";
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    if (crore > 0) str += inWords(crore) + ' crore ';
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    if (lakh > 0) str += inWords(lakh) + ' lakh ';
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    if (thousand > 0) str += inWords(thousand) + ' thousand ';
    if (n > 0) str += inWords(n);
    let result = str.trim().split(' ').map(s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '').join(' ');
    return result.replace(/\s\s+/g, ' ');
}

export function amountToWords(num: number): string {
    const integerPart = Math.floor(num);
    const fractionalPart = Math.round((num - integerPart) * 100);
    let result = '';
    if (integerPart > 0) result += numberToWords(integerPart) + ' Rupees';
    if (fractionalPart > 0) {
        if (result) result += ' and ';
        result += numberToWords(fractionalPart) + ' Paise';
    }
    return (result || 'Zero Rupees') + ' Only';
}
