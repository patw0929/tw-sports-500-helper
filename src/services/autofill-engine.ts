import { UserProfile, rocToWesternYear, formatIsoDate } from '@/types/sports500';

export function generateAutoFillScript(profile: UserProfile | null, isManual = false): string {
  if (!profile) {
    return `
      (function() {
        console.log('[Sports500Helper] No active profile to auto-fill');
      })();
    `;
  }

  const payload = JSON.stringify({
    name: profile.name,
    idNo: profile.idNo.toUpperCase(),
    rocYear: profile.birthYearRoc,
    westernYear: rocToWesternYear(profile.birthYearRoc),
    month: profile.birthMonth,
    day: profile.birthDay,
    isoDate: formatIsoDate(profile.birthYearRoc, profile.birthMonth, profile.birthDay),
    phone: profile.phone,
    email: profile.email || '',
  });

  return `
    (function() {
      const user = ${payload};
      const manualMode = ${JSON.stringify(isManual)};
      console.log('[Sports500Helper] Injected auto-fill for:', user.name, user.idNo, 'manual:', manualMode);

      function dismissBadge(el) {
        if (!el) return;
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        el.style.opacity = '0';
        el.style.transform = 'translateX(-50%) translateY(-12px)';
        setTimeout(() => {
          if (el && el.parentNode) {
            el.parentNode.removeChild(el);
          }
        }, 450);
      }

      function showNotice(msg, isSuccess = true) {
        let badge = document.getElementById('sports500-helper-badge');
        if (!badge) {
          badge = document.createElement('div');
          badge.id = 'sports500-helper-badge';
          badge.style.position = 'fixed';
          badge.style.top = '12px';
          badge.style.left = '50%';
          badge.style.transform = 'translateX(-50%) translateY(0)';
          badge.style.zIndex = '9999999';
          badge.style.backgroundColor = isSuccess ? '#FF5E1E' : '#2D3748';
          badge.style.color = '#ffffff';
          badge.style.padding = '8px 12px 8px 16px';
          badge.style.borderRadius = '30px';
          badge.style.fontSize = '13px';
          badge.style.fontWeight = '600';
          badge.style.lineHeight = '1.4';
          badge.style.boxShadow = '0 8px 24px rgba(255, 94, 30, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)';
          badge.style.display = 'flex';
          badge.style.alignItems = 'center';
          badge.style.gap = '10px';
          badge.style.maxWidth = '92vw';
          badge.style.pointerEvents = 'auto';
          badge.style.transition = 'opacity 0.4s ease, transform 0.4s ease';

          const contentSpan = document.createElement('span');
          contentSpan.id = 'sports500-badge-content';
          contentSpan.style.flex = '1';

          const closeBtn = document.createElement('button');
          closeBtn.type = 'button';
          closeBtn.id = 'sports500-badge-close';
          closeBtn.innerHTML = '&#x2715;';
          closeBtn.title = '關閉提示';
          closeBtn.style.background = 'rgba(255, 255, 255, 0.25)';
          closeBtn.style.border = 'none';
          closeBtn.style.color = '#ffffff';
          closeBtn.style.width = '20px';
          closeBtn.style.height = '20px';
          closeBtn.style.borderRadius = '50%';
          closeBtn.style.fontSize = '11px';
          closeBtn.style.fontWeight = 'bold';
          closeBtn.style.cursor = 'pointer';
          closeBtn.style.display = 'flex';
          closeBtn.style.alignItems = 'center';
          closeBtn.style.justifyContent = 'center';
          closeBtn.style.padding = '0';
          closeBtn.style.outline = 'none';
          closeBtn.style.flexShrink = '0';

          closeBtn.onclick = function(e) {
            e.stopPropagation();
            if (badge._timer) clearTimeout(badge._timer);
            dismissBadge(badge);
          };

          badge.appendChild(contentSpan);
          badge.appendChild(closeBtn);
          document.body.appendChild(badge);
        } else {
          badge.style.opacity = '1';
          badge.style.transform = 'translateX(-50%) translateY(0)';
        }

        const contentSpan = document.getElementById('sports500-badge-content');
        if (contentSpan) {
          contentSpan.innerHTML = '⚡️ <b>加碼券小幫手</b>：' + msg;
        }

        if (badge._timer) {
          clearTimeout(badge._timer);
        }

        badge._timer = setTimeout(() => {
          dismissBadge(badge);
        }, 5000);
      }

      function triggerInput(el, val) {
        if (!el) return;
        el.focus();
        try {
          const proto = Object.getPrototypeOf(el);
          const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set ||
                         Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (setter) {
            setter.call(el, val);
          } else {
            el.value = val;
          }
        } catch (e) {
          el.value = val;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }

      function tryFillAccessPage(isManualTrigger) {
        // Check if on registration-finished page first
        if (document.querySelector('.registration-finished, #finished-title')) {
          showNotice('官方公告：運動紀錄已達 300 萬筆上限，新帳號登記與上傳功能已截止。', false);
          return false;
        }

        const idInput = document.querySelector('input#idNo, input[name="idNo"]');
        if (!idInput || idInput.readOnly) return false;

        // Always fill the ID number first so user does not need to retype
        triggerInput(idInput, user.idNo);

        // Check if there is an active error message from server (excluding informational quota notices)
        const hasError = !!document.querySelector(
          '.error, .alert-danger, .form-error, .text-danger, .field__error, .notice--error, .is-invalid, .invalid-feedback, .notice--warning:not(noscript p):not(.quota-notice)'
        );
        if (hasError && !isManualTrigger) {
          console.log('[Sports500Helper] Page has error message, skipping auto-submit to prevent loop');
          showNotice('已為 ' + user.name + ' 填寫身分證號。網頁顯示提示，請確認後手動送出。', false);
          return false;
        }

        const forceSubmit = sessionStorage.getItem('sports500_force_auto_submit') === 'true';
        if (forceSubmit) {
          sessionStorage.removeItem('sports500_force_auto_submit');
        }

        // Prevent rapid re-submissions on access page (throttle 6 seconds) unless manually triggered or forced
        if (!isManualTrigger && !forceSubmit) {
          const lastSubmit = parseInt(sessionStorage.getItem('sports500_last_access_submit') || '0', 10);
          if (Date.now() - lastSubmit < 6000) {
            console.log('[Sports500Helper] Skipping access submit: submitted recently');
            showNotice('已為 ' + user.name + ' 填寫身分證號，若未跳轉請點擊「確認」。');
            return false;
          }

          if (window._sports500_access_submitting) {
            return false;
          }
        }

        showNotice('已為 ' + user.name + ' 自動填寫身分證號！');

        const submitBtn = document.querySelector('form[action*="access"] button[type="submit"], button.btn--primary');
        if (submitBtn && !submitBtn.disabled) {
          window._sports500_access_submitting = true;
          sessionStorage.setItem('sports500_last_access_submit', Date.now().toString());
          setTimeout(() => {
            showNotice('正在進入下一步...');
            submitBtn.click();
            setTimeout(() => {
              window._sports500_access_submitting = false;
            }, 2000);
          }, 700);
          return true;
        }
        return false;
      }

      function tryFillLoginPage(isManualTrigger) {
        let filledAny = false;

        // 1. ID Number
        const idInput = document.querySelector('input#idNo, input[name="idNo"]');
        if (idInput && (!idInput.value || idInput.value !== user.idNo)) {
          triggerInput(idInput, user.idNo);
          filledAny = true;
        }

        // 2. Phone
        const phoneInput = document.querySelector('input#phone, input[name="phone"]');
        if (phoneInput && phoneInput.value !== user.phone) {
          triggerInput(phoneInput, user.phone);
          filledAny = true;
        }

        // 3. ROC Date dropdowns or ISO date input
        const dateInput = document.querySelector('input[type="date"], input#birthDate, input[name="birthDate"]');
        if (dateInput && dateInput.value !== user.isoDate) {
          triggerInput(dateInput, user.isoDate);
          filledAny = true;
        }

        // Dropdowns for year / month / day
        const selects = document.querySelectorAll('select');
        selects.forEach((sel, idx) => {
          const name = (sel.name || sel.id || '').toLowerCase();
          const isYearAttr = sel.hasAttribute('data-date-year');
          const isMonthAttr = sel.hasAttribute('data-date-month');
          const isDayAttr = sel.hasAttribute('data-date-day');
          const insideRocDate = !!sel.closest('.roc-date-input, .roc-date-input__controls');
          const options = Array.from(sel.options);

          const isYear = isYearAttr || name.includes('year') || (insideRocDate && idx === 0 && !isMonthAttr && !isDayAttr);
          const isMonth = isMonthAttr || name.includes('month') || (insideRocDate && idx === 1 && !isYearAttr && !isDayAttr);
          const isDay = isDayAttr || name.includes('day') || name.includes('date') || (insideRocDate && idx === 2 && !isYearAttr && !isMonthAttr);

          if (isYear) {
            const matchOpt = options.find(o => 
              o.value === String(user.rocYear) || 
              o.value === String(user.westernYear) ||
              o.text.includes(String(user.rocYear))
            );
            if (matchOpt && sel.value !== matchOpt.value) {
              sel.value = matchOpt.value;
              sel.dispatchEvent(new Event('change', { bubbles: true }));
              filledAny = true;
            }
          } else if (isMonth) {
            const matchOpt = options.find(o => 
              parseInt(o.value, 10) === user.month || 
              parseInt(o.text, 10) === user.month
            );
            if (matchOpt && sel.value !== matchOpt.value) {
              sel.value = matchOpt.value;
              sel.dispatchEvent(new Event('change', { bubbles: true }));
              filledAny = true;
            }
          } else if (isDay) {
            const matchOpt = options.find(o => 
              parseInt(o.value, 10) === user.day || 
              parseInt(o.text, 10) === user.day
            );
            if (matchOpt && sel.value !== matchOpt.value) {
              sel.value = matchOpt.value;
              sel.dispatchEvent(new Event('change', { bubbles: true }));
              filledAny = true;
            }
          }
        });

        if (filledAny) {
          showNotice('已自動填入 ' + user.name + ' 的登入資料！');

          const hasError = !!document.querySelector(
            '.error, .alert-danger, .form-error, .text-danger, .field__error, .notice--error, .is-invalid, .invalid-feedback, .notice--warning:not(noscript p):not(.quota-notice)'
          );
          if (hasError && !isManualTrigger) {
            console.log('[Sports500Helper] Login page has error, skipping auto-submit');
            return true;
          }

          const forceSubmit = sessionStorage.getItem('sports500_force_auto_submit') === 'true';
          if (forceSubmit) {
            sessionStorage.removeItem('sports500_force_auto_submit');
          }

          if (!isManualTrigger && !forceSubmit) {
            const lastLogin = parseInt(sessionStorage.getItem('sports500_last_login_submit') || '0', 10);
            if (Date.now() - lastLogin < 6000) {
              console.log('[Sports500Helper] Skipping login submit: submitted recently');
              showNotice('已填入登入資料，若未自動登入請點擊「登入」。');
              return true;
            }
          }

          const loginBtn = document.querySelector('button[type="submit"], input[type="submit"]');
          if (loginBtn && !loginBtn.disabled) {
            if (window._sports500_login_submitting && !isManualTrigger) return true;
            window._sports500_login_submitting = true;
            sessionStorage.setItem('sports500_last_login_submit', Date.now().toString());
            setTimeout(() => {
              showNotice('正在為您登入我的任務...');
              loginBtn.click();
              setTimeout(() => {
                window._sports500_login_submitting = false;
              }, 2000);
            }, 800);
          }
          return true;
        }

        return false;
      }

      function runAutoFill(isManualTrigger) {
        const url = window.location.href;

        // If we just performed a logout, navigate to access page to log in the new user
        if (sessionStorage.getItem('sports500_pending_login') === 'true') {
          if (!url.includes('/access') && !url.includes('/login')) {
            sessionStorage.removeItem('sports500_pending_login');
            showNotice('已完成登出，正在為 ' + user.name + ' 前往登入頁面...');
            setTimeout(() => {
              window.location.href = 'https://500.gov.tw/registrant/access';
            }, 500);
            return;
          } else {
            sessionStorage.removeItem('sports500_pending_login');
          }
        }

        if (document.querySelector('.registration-finished, #finished-title')) {
          showNotice('官方公告：運動紀錄已達 300 萬筆上限，新帳號登記與上傳功能已截止。', false);
          return;
        }

        if (url.includes('/access')) {
          tryFillAccessPage(isManualTrigger);
        } else if (url.includes('/login')) {
          tryFillLoginPage(isManualTrigger);
        } else if (url.includes('/register')) {
          // Prefill registration if on register page
          const nameInput = document.querySelector('input#name, input[name="name"]');
          if (nameInput && !nameInput.value) triggerInput(nameInput, user.name);

          const phoneInput = document.querySelector('input#phone, input[name="phone"]');
          if (phoneInput && !phoneInput.value) triggerInput(phoneInput, user.phone);

          const emailInput = document.querySelector('input#email, input[name="email"]');
          if (emailInput && !emailInput.value && user.email) triggerInput(emailInput, user.email);

          showNotice('已為新註冊帶入基本資料！');
        } else {
          // Attempt to fill if login or access form elements exist on current page
          const accessFilled = tryFillAccessPage(isManualTrigger);
          if (accessFilled) return;

          const loginFilled = tryFillLoginPage(isManualTrigger);
          if (loginFilled) return;

          // Check if already in member tasks page
          if (url.includes('/member/tasks') || url.includes('/member/')) {
            if (isManualTrigger) {
              showNotice('已就緒身分：' + user.name + '，您目前已在「我的任務」！');
            }
            return;
          }

          // If manual trigger on non-form pages (e.g. 活動首頁, 任務辦法, 萊爾富等通路介紹)
          if (isManualTrigger) {
            showNotice('正在前往「我的任務」並為 ' + user.name + ' 自動填寫...');
            sessionStorage.setItem('sports500_force_auto_submit', 'true');
            setTimeout(() => {
              window.location.href = 'https://500.gov.tw/registrant/access';
            }, 400);
            return;
          }

          // On automatic load without manual trigger, check if there is a logout button (meaning currently logged in)
          const allEls = Array.from(document.querySelectorAll('a, button, input[type="button"], span, div'));
          const logoutBtn = allEls.find(el => {
            const text = (el.innerText || el.textContent || el.value || '').trim();
            const href = (el.getAttribute && el.getAttribute('href')) || '';
            return (text === '登出' || text.includes('登出') || href.toLowerCase().includes('logout'));
          });
          if (logoutBtn) {
            showNotice('已就緒身分：' + user.name + '。若需換人，請在網頁中點擊「登出」。', false);
          }
        }
      }

      window.sports500RunAutoFill = runAutoFill;

      // Initial run
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => runAutoFill(manualMode));
      } else {
        runAutoFill(manualMode);
      }

      if (!manualMode) {
        // Re-run once after dynamic DOM loads
        setTimeout(() => runAutoFill(false), 800);
      }

      // Notify React Native WebView once per URL to avoid terminal message flood
      if (window._sports500_last_reported_url !== window.location.href) {
        window._sports500_last_reported_url = window.location.href;
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PAGE_LOADED',
            url: window.location.href,
            title: document.title,
          }));
        }
      }
    })();
    true;
  `;
}

export function generateLogoutScript(profile: UserProfile): string {
  return `
    (async function() {
      function dismissBadge(el) {
        if (!el) return;
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        el.style.opacity = '0';
        el.style.transform = 'translateX(-50%) translateY(-12px)';
        setTimeout(() => {
          if (el && el.parentNode) {
            el.parentNode.removeChild(el);
          }
        }, 450);
      }

      function showNotice(msg, isSuccess = true) {
        let badge = document.getElementById('sports500-helper-badge');
        if (!badge) {
          badge = document.createElement('div');
          badge.id = 'sports500-helper-badge';
          badge.style.position = 'fixed';
          badge.style.top = '12px';
          badge.style.left = '50%';
          badge.style.transform = 'translateX(-50%) translateY(0)';
          badge.style.zIndex = '9999999';
          badge.style.backgroundColor = isSuccess ? '#FF5E1E' : '#2D3748';
          badge.style.color = '#ffffff';
          badge.style.padding = '8px 12px 8px 16px';
          badge.style.borderRadius = '30px';
          badge.style.fontSize = '13px';
          badge.style.fontWeight = '600';
          badge.style.lineHeight = '1.4';
          badge.style.boxShadow = '0 8px 24px rgba(255, 94, 30, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)';
          badge.style.display = 'flex';
          badge.style.alignItems = 'center';
          badge.style.gap = '10px';
          badge.style.maxWidth = '92vw';
          badge.style.pointerEvents = 'auto';
          badge.style.transition = 'opacity 0.4s ease, transform 0.4s ease';

          const contentSpan = document.createElement('span');
          contentSpan.id = 'sports500-badge-content';
          contentSpan.style.flex = '1';

          const closeBtn = document.createElement('button');
          closeBtn.type = 'button';
          closeBtn.id = 'sports500-badge-close';
          closeBtn.innerHTML = '&#x2715;';
          closeBtn.title = '關閉提示';
          closeBtn.style.background = 'rgba(255, 255, 255, 0.25)';
          closeBtn.style.border = 'none';
          closeBtn.style.color = '#ffffff';
          closeBtn.style.width = '20px';
          closeBtn.style.height = '20px';
          closeBtn.style.borderRadius = '50%';
          closeBtn.style.fontSize = '11px';
          closeBtn.style.fontWeight = 'bold';
          closeBtn.style.cursor = 'pointer';
          closeBtn.style.display = 'flex';
          closeBtn.style.alignItems = 'center';
          closeBtn.style.justifyContent = 'center';
          closeBtn.style.padding = '0';
          closeBtn.style.outline = 'none';
          closeBtn.style.flexShrink = '0';

          closeBtn.onclick = function(e) {
            e.stopPropagation();
            if (badge._timer) clearTimeout(badge._timer);
            dismissBadge(badge);
          };

          badge.appendChild(contentSpan);
          badge.appendChild(closeBtn);
          document.body.appendChild(badge);
        } else {
          badge.style.opacity = '1';
          badge.style.transform = 'translateX(-50%) translateY(0)';
        }

        const contentSpan = document.getElementById('sports500-badge-content');
        if (contentSpan) {
          contentSpan.innerHTML = '⚡️ <b>加碼券小幫手</b>：' + msg;
        }

        if (badge._timer) {
          clearTimeout(badge._timer);
        }

        badge._timer = setTimeout(() => {
          dismissBadge(badge);
        }, 5000);
      }

      showNotice('正在為您自動登出，並準備切換至 ${profile.name}...');
      sessionStorage.setItem('sports500_pending_login', 'true');

      // 1. Check if already on access or login page
      const currentUrl = window.location.href;
      if (currentUrl.includes('/access') || currentUrl.includes('/login')) {
        sessionStorage.removeItem('sports500_pending_login');
        showNotice('已在登入頁面，正在為 ${profile.name} 自動填入...');
        if (window.sports500RunAutoFill) {
          window.sports500RunAutoFill();
        } else {
          window.location.reload();
        }
        return;
      }

      // 2. Check for form with action containing logout
      const existingLogoutForm = document.querySelector('form[action*="logout"], form[action*="Logout"]');
      if (existingLogoutForm) {
        console.log('[Sports500Helper] Submitting existing logout form');
        existingLogoutForm.submit();
        return;
      }

      // 3. Check for any button or link containing '登出' or 'logout'
      const allClickables = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"], [role="button"]'));
      const logoutBtn = allClickables.find(el => {
        const text = (el.textContent || el.value || '').trim();
        const href = (el.getAttribute && el.getAttribute('href')) || '';
        return text === '登出' || text.includes('登出') || href.toLowerCase().includes('logout');
      });

      if (logoutBtn) {
        console.log('[Sports500Helper] Clicking logout element');
        window.confirm = () => true;
        logoutBtn.click();
        return;
      }

      // 4. Submit POST /registrant/logout with CSRF token
      let csrfToken = null;
      const csrfInput = document.querySelector('input[name="_csrf"]');
      if (csrfInput && csrfInput.value) {
        csrfToken = csrfInput.value;
      } else {
        const csrfMeta = document.querySelector('meta[name="_csrf"]');
        if (csrfMeta && csrfMeta.content) csrfToken = csrfMeta.content;
      }

      if (!csrfToken) {
        try {
          const resp = await fetch('/registrant/access');
          const html = await resp.text();
          const match = html.match(/name="_csrf"\\s+value="([^"]+)"/i) || html.match(/value="([^"]+)"\\s+name="_csrf"/i);
          if (match && match[1]) {
            csrfToken = match[1];
          }
        } catch (e) {
          console.warn('[Sports500Helper] Failed to fetch CSRF token:', e);
        }
      }

      if (csrfToken) {
        console.log('[Sports500Helper] Submitting POST to /registrant/logout with CSRF');
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/registrant/logout';
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = '_csrf';
        input.value = csrfToken;
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
        return;
      }

      // 5. Fallback redirect
      window.location.href = 'https://500.gov.tw/registrant/access';
    })();
    true;
  `;
}
