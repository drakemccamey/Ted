document.addEventListener('DOMContentLoaded', () => {
  const year = document.getElementById('year');
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.getElementById('site-nav');

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = siteNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    siteNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        siteNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const targetId = anchor.getAttribute('href');
      const target = document.querySelector(targetId);

      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  const brandBulbLayer = document.querySelector('.brand-bulb-layer');
  if (brandBulbLayer) {
    const bulbPositions = [
      { x: 9, y: 20, size: 6 },
      { x: 21, y: 10, size: 6 },
      { x: 38, y: 8, size: 7 },
      { x: 56, y: 6, size: 7 },
      { x: 74, y: 9, size: 6 },
      { x: 87, y: 19, size: 6 },
      { x: 87, y: 56, size: 6 },
      { x: 76, y: 79, size: 7 },
      { x: 58, y: 89, size: 7 },
      { x: 40, y: 91, size: 7 },
      { x: 20, y: 80, size: 6 },
      { x: 10, y: 58, size: 6 }
    ];

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    bulbPositions.forEach((position, index) => {
      const bulb = document.createElement('span');
      bulb.className = 'brand-bulb';
      bulb.dataset.group = String(index % 4);
      bulb.style.left = `${position.x}%`;
      bulb.style.top = `${position.y}%`;
      bulb.style.width = `${position.size}px`;
      bulb.style.height = `${position.size}px`;
      brandBulbLayer.appendChild(bulb);
    });

    const bulbs = Array.from(brandBulbLayer.querySelectorAll('.brand-bulb'));

    if (!reducedMotion) {
      let currentGroup = 0;
      const pulseBulbs = () => {
        bulbs.forEach((bulb) => {
          const isActive = Number(bulb.dataset.group) === currentGroup;
          bulb.classList.toggle('is-active', isActive);
        });
        currentGroup = (currentGroup + 1) % 4;
      };

      pulseBulbs();
      setInterval(pulseBulbs, 700);
    } else {
      bulbs.forEach((bulb) => bulb.classList.add('is-active'));
    }
  }

  const feedbackForm = document.getElementById('feedback-form');
  const formSuccess = document.getElementById('form-success');
  const formStatus = document.getElementById('form-status');
  const submitButton = document.getElementById('submit-button');
  const contactFields = document.getElementById('contact-fields');
  const contactRadios = Array.from(document.querySelectorAll('input[name="contact_preference"]'));
  const contactInputs = contactFields ? Array.from(contactFields.querySelectorAll('input[data-contact-required="true"]')) : [];
  const starInputs = Array.from(document.querySelectorAll('input[name="overall_experience"]'));
  const ratingError = document.getElementById('rating-error');

  const clearFieldErrors = () => {
    document.querySelectorAll('.field-error').forEach((error) => {
      error.textContent = '';
    });
    document.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
      field.removeAttribute('aria-invalid');
    });
  };

  const setFieldError = (field, message) => {
    if (!field) return;
    field.setAttribute('aria-invalid', 'true');
    const error = document.querySelector(`[data-error-for="${field.name}"]`);
    if (error) {
      error.textContent = message;
    }
  };

  const syncStarSelection = () => {
    const selectedIndex = starInputs.findIndex((input) => input.checked);

    starInputs.forEach((input, index) => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) {
        label.classList.toggle('is-selected', index <= selectedIndex);
      }
    });
  };

  const updateContactFields = () => {
    const wantsContact = contactRadios.some((radio) => radio.checked && radio.value === 'Yes');

    contactInputs.forEach((input) => {
      input.required = wantsContact;
      input.disabled = !wantsContact;
      input.classList.toggle('is-disabled', !wantsContact);
      if (!wantsContact) {
        input.value = '';
      }
    });

    if (contactFields) {
      contactFields.classList.toggle('is-visible', wantsContact);
      contactFields.setAttribute('aria-hidden', wantsContact ? 'false' : 'true');
    }
  };

  const validateForm = () => {
    clearFieldErrors();
    let isValid = true;

    if (!starInputs.some((input) => input.checked)) {
      if (ratingError) {
        ratingError.textContent = 'Please choose a rating from 1 to 5.';
      }
      isValid = false;
    }

    const feedbackType = feedbackForm?.elements['feedback_type'];
    if (feedbackType && !feedbackType.value) {
      setFieldError(feedbackType, 'Please choose a feedback type.');
      isValid = false;
    }

    const comments = feedbackForm?.elements['comments'];
    if (comments && !comments.value.trim()) {
      setFieldError(comments, 'Please share a few details about your experience.');
      isValid = false;
    }

    const contactPreference = feedbackForm?.elements['contact_preference'];
    if (!contactPreference || !Array.from(contactPreference).some((radio) => radio.checked)) {
      const contactError = document.querySelector('[data-error-for="contact_preference"]');
      if (contactError) {
        contactError.textContent = 'Please tell us whether you would like a response.';
      }
      isValid = false;
    }

    const wantsContact = contactRadios.some((radio) => radio.checked && radio.value === 'Yes');
    if (wantsContact) {
      contactInputs.forEach((input) => {
        if (!input.value.trim()) {
          setFieldError(input, 'Please share this so we can follow up.');
          isValid = false;
        }
      });

      const emailInput = feedbackForm?.elements['guest_email'];
      if (emailInput && emailInput.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) {
        setFieldError(emailInput, 'Please enter a valid email address.');
        isValid = false;
      }
    }

    return isValid;
  };

  if (feedbackForm) {
    starInputs.forEach((input) => {
      input.addEventListener('change', syncStarSelection);
    });

    contactRadios.forEach((radio) => {
      radio.addEventListener('change', updateContactFields);
    });

    feedbackForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!validateForm()) {
        const firstError = feedbackForm.querySelector('[aria-invalid="true"]');
        if (firstError) {
          firstError.focus();
        }
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = 'SENDING...';
      formStatus.textContent = 'Sending your feedback now...';
      formStatus.className = 'form-status';
      formSuccess.classList.remove('is-visible');
      formSuccess.hidden = true;

      try {
        const response = await fetch(feedbackForm.action, {
          method: 'POST',
          body: new FormData(feedbackForm),
          headers: {
            Accept: 'application/json'
          }
        });

        if (response.ok) {
          feedbackForm.reset();
          updateContactFields();
          syncStarSelection();
          formStatus.textContent = 'Thanks for sharing your thoughts with Ted’s.';
          formStatus.className = 'form-status is-success';
          formSuccess.hidden = false;
          formSuccess.classList.add('is-visible');
          formSuccess.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          throw new Error('Submission failed.');
        }
      } catch (error) {
        formStatus.textContent = 'Sorry, we could not send your feedback right now. Please try again shortly.';
        formStatus.className = 'form-status is-error';
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'SEND FEEDBACK';
      }
    });

    updateContactFields();
    syncStarSelection();
  }
});
