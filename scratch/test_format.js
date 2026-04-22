function formatId(val) {
    let raw = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (raw.length >= 3 && /^[A-Z]/.test(raw)) {
        let res = '';
        res += raw.substring(0, 2); 
        if (raw.length > 2) res += '-' + raw.substring(2, 4); 
        if (raw.length > 4) res += '-' + raw.substring(4, 5); 
        if (raw.length > 5) res += '-' + raw.substring(5, 8);
        return res;
    }
    return val.toUpperCase();
}

function simulateType(sequence) {
    let value = "";
    let cursor = 0;
    console.log("Typing:", sequence);
    for (let char of sequence) {
        // simulate typing char at cursor
        let originalValue = value.slice(0, cursor) + char + value.slice(cursor);
        cursor += 1;
        
        let formatted = formatId(originalValue);
        
        if (originalValue !== formatted) {
            let beforeCursor = originalValue.substring(0, cursor).replace(/-/g, '').length;
            value = formatted;
            let newCursor = 0;
            let realCount = 0;
            while (realCount < beforeCursor && newCursor < formatted.length) {
                if (formatted[newCursor] !== '-') realCount++;
                newCursor++;
            }
            while (newCursor < formatted.length && formatted[newCursor] === '-') {
                newCursor++;
            }
            cursor = newCursor;
        } else {
            value = originalValue;
        }
        console.log(`Type '${char}' -> value: "${value}", cursor: ${cursor}`);
    }
}

simulateType("hrsp7009");
simulateType("08");
