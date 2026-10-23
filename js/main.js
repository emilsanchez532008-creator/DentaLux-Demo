/* =========================================================
   DentaLux — interacción compartida
   JavaScript vanilla. No requiere frameworks ni build step.
   ========================================================= */

(() => {
  'use strict';

  const WHATSAPP_NUMBER = '524774020597';
  const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER}`;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.documentElement.classList.add('js');

  /* Año del footer */
  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  /* Menú móvil, accesible con teclado y lectores de pantalla */
  const menuToggle = document.querySelector('.menu-toggle');
  const primaryNavigation = document.querySelector('#primary-navigation');

  if (menuToggle && primaryNavigation) {
    const closeMenu = () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Abrir menú de navegación');
      primaryNavigation.classList.remove('is-open');
      document.body.classList.remove('menu-open');
    };

    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Abrir menú de navegación' : 'Cerrar menú de navegación');
      primaryNavigation.classList.toggle('is-open', !isOpen);
      document.body.classList.toggle('menu-open', !isOpen);
      if (!isOpen) {
        const firstLink = primaryNavigation.querySelector('a');
        firstLink?.focus({ preventScroll: true });
      }
    });

    primaryNavigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 799) closeMenu();
    }, { passive: true });
  }

  /* Animaciones reveal al entrar en pantalla */
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });

    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  }

  /* Prepara enlaces de WhatsApp con el número común del prototipo. */
  document.querySelectorAll('[data-whatsapp]').forEach((link) => {
    const currentText = link.getAttribute('href')?.split('?text=')[1];
    link.href = currentText ? `${WHATSAPP_BASE}?text=${currentText}` : WHATSAPP_BASE;
  });

  /* Catálogo de servicios: filtro por categoría y búsqueda en vivo. */
  const serviceCards = Array.from(document.querySelectorAll('[data-service-card]'));
  const serviceFilterButtons = document.querySelectorAll('[data-service-filter]');
  const serviceSearch = document.querySelector('#service-search');
  const serviceEmpty = document.querySelector('#service-empty');
  let activeServiceFilter = 'all';

  const filterServices = () => {
    if (!serviceCards.length) return;
    const query = (serviceSearch?.value || '').trim().toLocaleLowerCase('es-MX');
    let visibleCount = 0;

    serviceCards.forEach((card) => {
      const categories = (card.dataset.categories || '').split(/\s+/).filter(Boolean);
      const searchableText = `${card.dataset.search || ''} ${card.textContent || ''}`.toLocaleLowerCase('es-MX');
      const matchesCategory = activeServiceFilter === 'all' || categories.includes(activeServiceFilter);
      const matchesQuery = !query || searchableText.includes(query);
      const shouldShow = matchesCategory && matchesQuery;
      card.hidden = !shouldShow;
      if (shouldShow) visibleCount += 1;
    });

    if (serviceEmpty) serviceEmpty.hidden = visibleCount > 0;
  };

  serviceFilterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeServiceFilter = button.dataset.serviceFilter || 'all';
      serviceFilterButtons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      filterServices();
    });
  });
  serviceSearch?.addEventListener('input', filterServices);

  /* Galería de casos: filtros por categoría, sin recarga. */
  const caseCards = Array.from(document.querySelectorAll('[data-case-card]'));
  const caseFilterButtons = document.querySelectorAll('[data-case-filter]');
  const caseEmpty = document.querySelector('#case-empty');

  caseFilterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const activeFilter = button.dataset.caseFilter || 'all';
      caseFilterButtons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-pressed', String(selected));
      });

      let visibleCount = 0;
      caseCards.forEach((card) => {
        const matches = activeFilter === 'all' || card.dataset.caseCategory === activeFilter;
        card.hidden = !matches;
        if (matches) visibleCount += 1;
      });
      if (caseEmpty) caseEmpty.hidden = visibleCount > 0;
    });
  });

  /* Slider de comparación. El input range ofrece ratón, tacto y teclado. */
  document.querySelectorAll('[data-before-after]').forEach((comparison) => {
    const range = comparison.querySelector('.before-after__range');
    if (!range) return;

    const updateSplit = () => {
      const value = Math.min(100, Math.max(0, Number(range.value) || 0));
      comparison.style.setProperty('--split', `${value}%`);
      range.setAttribute('aria-valuetext', `${value}% de imagen izquierda visible`);
    };

    range.addEventListener('input', updateSplit);
    range.addEventListener('change', updateSplit);
    updateSplit();
  });

  /* Formulario: validación en cliente y mensaje prellenado para WhatsApp.
     Este prototipo no transmite datos a una base de datos ni confirma citas. */
  const appointmentForm = document.querySelector('#appointment-form');
  const formStatus = document.querySelector('#form-status');

  if (appointmentForm && formStatus) {
    const dateInput = appointmentForm.querySelector('#preferred-date');
    const phoneInput = appointmentForm.querySelector('#phone');
    const nameInput = appointmentForm.querySelector('#full-name');
    const serviceInput = appointmentForm.querySelector('#interest');
    const consentInput = appointmentForm.querySelector('#privacy-consent');

    // Usa la fecha local, no toISOString(), para evitar desfases por zona horaria.
    if (dateInput) {
      const now = new Date();
      const localToday = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
      dateInput.min = localToday;
    }

    const setFieldError = (field, message = '') => {
      if (!field) return;
      const error = appointmentForm.querySelector(`[data-error-for="${field.id}"]`);
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (error) error.textContent = message;
    };

    const clearStatus = () => {
      formStatus.textContent = '';
      formStatus.classList.remove('is-error', 'is-success');
      const existingLink = formStatus.querySelector('a');
      existingLink?.remove();
    };

    [nameInput, phoneInput, serviceInput, dateInput, consentInput].forEach((field) => {
      field?.addEventListener('input', () => {
        setFieldError(field, '');
        clearStatus();
      });
      field?.addEventListener('change', () => {
        setFieldError(field, '');
        clearStatus();
      });
    });

    const addWhatsAppFallback = (url) => {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'text-link';
      link.textContent = 'Abrir WhatsApp manualmente ↗';
      link.style.marginTop = '8px';
      formStatus.append(document.createElement('br'), link);
    };

    appointmentForm.addEventListener('submit', (event) => {
      event.preventDefault();
      clearStatus();

      const name = (nameInput?.value || '').trim();
      const rawPhone = (phoneInput?.value || '').trim();
      const phoneDigits = rawPhone.replace(/\D/g, '');
      const service = serviceInput?.value || '';
      const preferredDate = dateInput?.value || '';
      const preferredTime = appointmentForm.querySelector('#preferred-time')?.value || 'Sin preferencia';
      const comments = (appointmentForm.querySelector('#comments')?.value || '').trim();
      const consentGiven = Boolean(consentInput?.checked);
      let firstInvalidField = null;

      const fail = (field, message) => {
        setFieldError(field, message);
        if (!firstInvalidField && field) firstInvalidField = field;
      };

      if (name.length < 2) fail(nameInput, 'Escribe tu nombre (al menos 2 caracteres).');
      if (phoneDigits.length < 10 || phoneDigits.length > 14) fail(phoneInput, 'Ingresa un teléfono válido de 10 a 14 dígitos.');
      if (!service) fail(serviceInput, 'Selecciona el servicio que te interesa.');
      if (preferredDate && dateInput?.min && preferredDate < dateInput.min) fail(dateInput, 'Elige hoy o una fecha posterior.');
      if (!consentGiven) fail(consentInput, 'Necesitamos tu autorización para preparar la solicitud.');

      if (firstInvalidField) {
        formStatus.textContent = 'Revisa los campos señalados para continuar.';
        formStatus.classList.add('is-error');
        firstInvalidField.focus({ preventScroll: false });
        return;
      }

      const messageLines = [
        'Hola, DentaLux. Me gustaría solicitar una cita de valoración.',
        '',
        `Nombre: ${name}`,
        `Teléfono de contacto: ${rawPhone}`,
        `Servicio de interés: ${service}`,
        `Día preferido: ${preferredDate || 'Por definir'}`,
        `Horario preferido: ${preferredTime}`,
        comments ? `Comentarios: ${comments}` : ''
      ].filter(Boolean);
      const whatsappUrl = `${WHATSAPP_BASE}?text=${encodeURIComponent(messageLines.join('\n'))}`;

      formStatus.textContent = 'Solicitud preparada. Revisa el mensaje en WhatsApp y envíalo para que el equipo pueda responderte. La cita no queda confirmada hasta recibir respuesta.';
      formStatus.classList.add('is-success');
      addWhatsAppFallback(whatsappUrl);

      // Abrir en una pestaña separada; el enlace de respaldo queda visible si el navegador bloquea ventanas.
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    });
  }

  /* Modal informativo de privacidad (contenido de demostración). */
  const privacyModal = document.querySelector('#privacy-modal');
  if (privacyModal) {
    const openPrivacyLinks = document.querySelectorAll('[data-privacy-link]');
    const closeButtons = privacyModal.querySelectorAll('.privacy-modal__close, [data-close-privacy]');
    let previousFocus = null;

    const openModal = (event) => {
      event?.preventDefault();
      previousFocus = document.activeElement;
      privacyModal.hidden = false;
      document.body.style.overflow = 'hidden';
      privacyModal.querySelector('.privacy-modal__close')?.focus();
    };

    const closeModal = () => {
      privacyModal.hidden = true;
      document.body.style.overflow = '';
      previousFocus?.focus?.({ preventScroll: true });
    };

    openPrivacyLinks.forEach((link) => link.addEventListener('click', openModal));
    closeButtons.forEach((button) => button.addEventListener('click', closeModal));
    privacyModal.addEventListener('click', (event) => {
      if (event.target === privacyModal) closeModal();
    });
    document.addEventListener('keydown', (event) => {
      if (!privacyModal.hidden && event.key === 'Escape') closeModal();
    });
  }
})();
