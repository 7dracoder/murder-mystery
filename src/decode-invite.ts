const invite = "Cm8KPwGU61GSmHGiYpJVILh8zkl2Uu1xsFgWF25m9UvF7rNK4z7AMSiDT66P_gA8zM0CpER3TPM4qLJroA7qUP_2ZxIgEKADcDU_dhN1jrNKIUtq6yDvInEK5OyXZ-Dy9ok2BVEaCmtqd0EzMHNJTlUSQZIm9Ybwki2LzJ5hXxaj5hEy-Ge5marMIwSH9ZwEU5tbYz7P4id_aKdDGB4ziWMpZtrY9vUrTaCGi86-zNueU8wB";
const decoded = Buffer.from(invite.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
console.log("Decoded hex:", decoded.toString('hex'));
console.log("Decoded utf8:", decoded.toString('utf8'));
