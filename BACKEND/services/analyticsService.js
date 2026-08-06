function getAmount(record = {}) {

    return (
        record.poAmount ??
        record.amount ??
        record.totalValue ??
        record.value ??
        0
    );

}

function getHighest(records) {

    records = records ?? [];

    if (!records.length) return null;

    return records.reduce((a, b) =>
        getAmount(a) > getAmount(b) ? a : b
    );

}

function getLowest(records) {

    records = records ?? [];

    if (!records.length) return null;

    return records.reduce((a, b) =>
        getAmount(a) < getAmount(b) ? a : b
    );

}

function getTotalAmount(records) {

    records = records ?? [];

    return records.reduce(
        (sum, record) => sum + (getAmount(record)),
        0
    );

}

function getTotalBalance(records) {

    records = records ?? [];

    return records.reduce(
        (sum, record) => sum + (getBalance(record)),
        0
    );

}

function getLowestBalance(records) {

    records = records ?? [];

    if (!records.length) return null;

    return records.reduce((a, b) =>
        getBalance(a) < getBalance(b) ? a : b
    );

}


function getExpiringSoon(records, days = 90) {

    records = records ?? [];

    const today = new Date();

    return records.filter(record => {

        const endDate = new Date(
            record.poEndDate ??
            record.endDate
        );
        
        if (isNaN(endDate.getTime())) {
            return false;
        }

        const diff =
            (endDate - today) /
            (1000 * 60 * 60 * 24);

        return diff >= 0 && diff <= days;

    });

}


function getCount(records) {

    records = records ?? [];

    return records.length;

}

function getAverageAmount(records) {

    records = records ?? [];

    if (!records.length) return 0;

    const total = records.reduce(
        (sum, record) => sum + (getAmount(record)),
        0
    );

    return Math.round(total / records.length);
}

function getBalance(record = {}) {

    return record.balanceAmount ?? 0;

}

function getHighestBalance(records) {

    records = records ?? [];

    if (!records.length) return null;

    return records.reduce((a, b) =>
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
    getExpiringSoon
};