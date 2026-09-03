function clearLoginPassword(passwordInput) {
  if (passwordInput) passwordInput.value = '';
}
if (typeof module !== 'undefined' && module.exports) module.exports = { clearLoginPassword };
if (typeof window !== 'undefined') window.clearKronangLoginPassword = clearLoginPassword;
