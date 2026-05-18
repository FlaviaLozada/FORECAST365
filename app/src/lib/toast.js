let _push = null

export function _initToast(fn) { _push = fn }

export const toast = {
  success: (m) => _push?.(m, 'success'),
  error:   (m) => _push?.(m, 'error'),
  info:    (m) => _push?.(m, 'info'),
}
