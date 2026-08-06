const MS_PER_DAY = 1000 * 60 * 60 * 24;

function getAmount(record = {}) {
    return (
        record.poAmount ??
        record.amount ??
        record.totalValue ??
        record.value ??
        0
    );
}


function normalizeRecords(records) {
    return Array.isArray(records) ? records : [];
}


function getHighest(records) {
    const normalizedRecords = normalizeRecords(records);

    if (!normalizedRecords.length) {
        return null;
    }

    return normalizedRecords.reduce((a, b) =>
        getAmount(a) > getAmount(b) ? a : b
    );
}


function getLowest(records) {
    const normalizedRecords = normalizeRecords(records);

    if (!normalizedRecords.length) {
        return null;
    }

    return normalizedRecords.reduce((a, b) =>
        getAmount(a) < getAmount(b) ? a : b
    );
}


function getTotalAmount(records) {
    const normalizedRecords = normalizeRecords(records);

    return normalizedRecords.reduce(
        (sum, record) => sum + getAmount(record),
        0
    );
}


function getTotalBalance(records) {
    const normalizedRecords = normalizeRecords(records);

    return normalizedRecords.reduce(
        (sum, record) => sum + getBalance(record),
        0
    );
}


function getLowestBalance(records) {
    const normalizedRecords = normalizeRecords(records);

    if (!normalizedRecords.length) {
        return null;
    }

    return normalizedRecords.reduce((a, b) =>
        getBalance(a) < getBalance(b) ? a : b
    );
}


function getExpiringSoon(records, days = 90) {
    const normalizedRecords = normalizeRecords(records);
    const today = new Date();

    return normalizedRecords.filter(record => {
        const endDate = new Date(
            record.poEndDate ??
            record.endDate
        );
        
        if (isNaN(endDate.getTime())) {
            return false;
        }

        const diff = (endDate - today) / MS_PER_DAY;
        return diff >= 0 && diff <= days;
    });
}


function getCount(records) {
    const normalizedRecords = normalizeRecords(records);
    return normalizedRecords.length;
}


function getAverageAmount(records) {
    const normalizedRecords = normalizeRecords(records);

    if (!normalizedRecords.length) {
        return 0;
    }
    
    const total = getTotalAmount(normalizedRecords);
    return Math.round(total / normalizedRecords.length);
}


function getBalance(record = {}) {
    return record.balanceAmount ?? 0;
}


function getHighestBalance(records) {
    const normalizedRecords = normalizeRecords(records);

    if (!normalizedRecords.length) {
        return null;
    }

    return normalizedRecords.reduce((a, b) =>
        getBalance(a) > getBalance(b) ? a : b
    );
}


module.exports = {
    getHighest,
    getLowest,
    getTotalAmount,
    getTotalBalance,
    getCount,
    getAverageAmount,
    getHighestBalance,
    getLowestBalance,
    getExpiringSoon,
    getAmount,
    getBalance
};