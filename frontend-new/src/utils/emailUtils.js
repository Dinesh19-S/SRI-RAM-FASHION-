const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export const splitEmailRecipients = (value) => {
    if (Array.isArray(value)) {
        return value.flatMap((entry) => splitEmailRecipients(entry));
    }

    return String(value || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
};

export const normalizeEmailRecipients = (value) => {
    const recipients = splitEmailRecipients(value);
    return [...new Set(recipients.map((entry) => entry.toLowerCase()))];
};

export const isValidEmailRecipientList = (value) => {
    const recipients = splitEmailRecipients(value);
    return recipients.length > 0 && recipients.every((entry) => EMAIL_PATTERN.test(entry));
};

export const pickDefaultRecipient = (...sources) => {
    for (const source of sources) {
        const recipient = splitEmailRecipients(source).find((entry) => EMAIL_PATTERN.test(entry));
        if (recipient) {
            return recipient;
        }
    }

    return '';
};
