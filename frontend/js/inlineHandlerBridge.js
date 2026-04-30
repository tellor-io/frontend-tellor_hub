/**
 * Inline handler bridge for strict CSP.
 * Keeps existing onclick/onchange attributes functional without allowing inline JS execution.
 */
(function () {
  'use strict';

  function resolvePath(path) {
    if (!path) return null;
    const parts = path.split('.');
    let owner = window;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const part = parts[i];
      if (!Object.prototype.hasOwnProperty.call(owner, part)) {
        return null;
      }
      owner = owner[part];
    }
    const last = parts[parts.length - 1];
    if (!Object.prototype.hasOwnProperty.call(owner, last)) {
      return null;
    }
    return {
      fn: owner[last],
      context: owner
    };
  }

  function parseArguments(raw) {
    const src = String(raw || '').trim();
    if (!src) return [];

    const args = [];
    let token = '';
    let quote = null;
    let escaped = false;

    for (let i = 0; i < src.length; i += 1) {
      const ch = src[i];
      if (escaped) {
        token += ch;
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (quote) {
        if (ch === quote) {
          quote = null;
        } else {
          token += ch;
        }
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        continue;
      }
      if (ch === ',') {
        args.push(token.trim());
        token = '';
        continue;
      }
      token += ch;
    }
    if (token.trim().length > 0) {
      args.push(token.trim());
    }

    return args.map((value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      if (value === 'null') return null;
      if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
      return value;
    });
  }

  function parseCallExpression(handlerCode) {
    const code = String(handlerCode || '').trim().replace(/;$/, '');
    if (!code) return null;

    if (code === 'event.stopPropagation()') {
      return { kind: 'stopPropagation' };
    }

    const match = code.match(/^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\((.*)\)$/);
    if (!match) return null;

    const path = match[1];
    const rawArgs = match[2];
    const allowed =
      path === 'switchDisputeTab' ||
      path.startsWith('App.');
    if (!allowed) return null;

    return {
      kind: 'call',
      path,
      args: parseArguments(rawArgs)
    };
  }

  function runInlineHandler(event, attributeName) {
    const target = event.target && event.target.closest(`[${attributeName}]`);
    if (!target) return;

    const expression = target.getAttribute(attributeName);
    const parsed = parseCallExpression(expression);
    if (!parsed) return;

    if (parsed.kind === 'stopPropagation') {
      event.stopPropagation();
      return;
    }

    const resolved = resolvePath(parsed.path);
    if (!resolved || typeof resolved.fn !== 'function') {
      return;
    }

    try {
      resolved.fn.apply(resolved.context, parsed.args);
    } catch (error) {
      console.error(`Inline handler bridge error for ${parsed.path}:`, error);
    }
  }

  document.addEventListener('click', (event) => {
    runInlineHandler(event, 'onclick');
  });

  document.addEventListener('change', (event) => {
    runInlineHandler(event, 'onchange');
  });
})();
