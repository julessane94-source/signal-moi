const MIN_PASSWORD_LENGTH = 12;

const validatePassword = (value) => {
  const password = String(value || '');

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, message: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caracteres.` };
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir une minuscule, une majuscule et un chiffre.' };
  }

  return { valid: true, message: '' };
};

module.exports = { MIN_PASSWORD_LENGTH, validatePassword };
