import {assert, fixture } from '@open-wc/testing';
import sinon from 'sinon';

import './test-class.js';

const submitForm = (form) => {
  return new Promise((resolve) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const data = [...formData.entries()].reduce((acc, [key, value]) => ({...acc, ...{[key]: value}}), {});
      resolve(data);
    });

    const submit = form.querySelector('button');
    submit.click();
  })
}

const getFormHTML = (options = []) => `
  <form method="POST">
    <input type="text" name="foo" value="bar"></input>
    <label>
      Custom Input
      <custom-input
        ${Object.entries(options)
.map(([key, value]) => `${key}="${value}"\n`).join(' ')}
      ></custom-input>

      <div class="error-message"></div>
    </label>

    <button type="submit">Send</button>
  </form>
`;
describe('FormElementMixin', () => {
  it('gets focus when the label is clicked', async () => {
    const form = await fixture(getFormHTML());
    const label = form.querySelector('label');
    const input = form.querySelector('custom-input');

    label.click();

    assert.equal(document.activeElement, input);
  });

  it('is submitted with the form', async () => {
    const options = {
      type: 'text',
      name: 'firstname',
      value: 'John'
    };
    const form = await fixture(getFormHTML(options));
    const input = form.querySelector('custom-input');
    input.value = options.value;
    form.addEventListener('submit', e => e.preventDefault());
    const formData = await submitForm(form);

    assert.equal(formData.firstname, input.value);
  });

  it('is not submitted with the form when disabled', async () => {
    const options = {
      type: 'text',
      name: 'firstname',
      value: 'John',
      disabled: true
    };
    const form = await fixture(getFormHTML(options));
    const input = form.querySelector('custom-input');
    input.value = options.value;
    form.addEventListener('submit', e => e.preventDefault());
    const formData = await submitForm(form);

    assert.equal('firstname' in formData, false);
  });

  it('automatically gets a tabindex', async () => {
    const form = await fixture(getFormHTML());
    const input = form.querySelector('custom-input');

    assert.equal(input.hasAttribute('tabindex'), true);
  });

  it('gets the value of its internal input', async () => {
    const form = await fixture(getFormHTML());
    const input = form.querySelector('custom-input');
    const inputNode = input.shadowRoot.querySelector('input');
    inputNode.value = 'foo';

    assert.equal(input.value, 'foo');
  });

  it('validates when its internal input changes', async () => {
    const form = await fixture(getFormHTML());
    const input = form.querySelector('custom-input');
    sinon.spy(input, 'validateInput');
    const inputNode = input.shadowRoot.querySelector('input');
    inputNode.value = 'foo';
    inputNode.dispatchEvent(new Event('change'));

    assert.equal(input.validateInput.called, true);
  });

  it('forwards focus to its internal input', async () => {
    const form = await fixture(getFormHTML());
    const input = form.querySelector('custom-input');
    const inputNode = input.shadowRoot.querySelector('input');
    sinon.spy(inputNode, 'focus');
    input.dispatchEvent(new Event('focus'));

    assert.equal(inputNode.focus.called, true);
  });

  it('get validation status and message from its internal input', async () => {
    const options = {
      type: 'text',
      name: 'name',
      required: true,
      'data-valuemissing': 'You forgot something'
    }
    const form = await fixture(getFormHTML(options));
    const input = form.querySelector('custom-input');
    const inputNode = input.shadowRoot.querySelector('input');
    const submit = form.querySelector('button');

    form.addEventListener('submit', e => e.preventDefault());
    submit.click();

    assert.equal(input.validity.valueMissing, true);
    assert.equal(inputNode.validity.valueMissing, true);
    assert.equal(input.validationMessage, options['data-valuemissing']);
  });

  it('is validated on change when "validate-on-change" is set', async () => {
    const options = {
      type: 'text',
      name: 'name',
      required: true,
      'validate-on-change': '',
      'data-valuemissing': 'You forgot something'
    }
    const form = await fixture(getFormHTML(options));
    const input = form.querySelector('custom-input');
    const inputNode = input.shadowRoot.querySelector('input');

    sinon.spy(input, 'reportValidity');
    inputNode.dispatchEvent(new Event('change'));

    assert.equal(input.reportValidity.called, true);
  });

  it('is validated on change when "validate-on-change" is set with custom error message', async () => {
    const options = {
      type: 'text',
      name: 'name',
      required: true,
      'validate-on-change': '',
      'custom-error-message': '',
      'data-valuemissing': 'You forgot something'
    }
    const form = await fixture(getFormHTML(options));
    const input = form.querySelector('custom-input');
    const inputNode = input.shadowRoot.querySelector('input');

    const spy = sinon.spy(input, 'dispatchEvent');
    inputNode.dispatchEvent(new Event('change'));

    assert.equal(spy.args[0][0].type, 'change');
  });

  it('gets its "minlength" constraint rewritten to "pattern"', async () => {
    const options = {
      type: 'text',
      minLength: 5,
      value: 'foo',
      'data-tooshort': 'Must have at least 5 characters'
    };

    const form = await fixture(getFormHTML(options));
    const input = form.querySelector('custom-input');

    assert.equal(input.getAttribute('pattern'), `.{${options.minLength},}`);
    assert.equal(input.dataset['data-tooshort'], input.dataset['data-patternmismatch']);
  });

  it('gets the correct error message when it is required and has no value', async () => {
    const options = {
      type: 'text',
      required: true,
      'data-valuemissing': 'You forgot something'
    };

    const form = await fixture(getFormHTML(options));
    const input = form.querySelector('custom-input');
    const submit = form.querySelector('button');

    form.addEventListener('submit', e => e.preventDefault());
    submit.click();

    assert.equal(input.validity.valueMissing, true);
    assert.equal(input.validationMessage, options['data-valuemissing']);
  });

  it('gets the correct error message when it has a value smaller than "min"', async () => {
    const options = {
      type: 'number',
      min: 5,
      value: 4,
      'data-rangeunderflow': 'Must be greater than 5'
    };

    const form = await fixture(getFormHTML(options));
    const input = form.querySelector('custom-input');
    const submit = form.querySelector('button');

    form.addEventListener('submit', e => e.preventDefault());
    submit.click();

    assert.equal(input.validity.rangeUnderflow, true);
    assert.equal(input.validationMessage, options['data-rangeunderflow']);
  });

  it('gets the correct error message when it has a value greater than "max"', async () => {
    const options = {
      type: 'number',
      max: 5,
      value: 6,
      'data-rangeoverflow': 'Must be smaller than 5'
    };

    const form = await fixture(getFormHTML(options));
    const input = form.querySelector('custom-input');
    const submit = form.querySelector('button');

    form.addEventListener('submit', e => e.preventDefault());
    submit.click();

    assert.equal(input.validity.rangeOverflow, true);
    assert.equal(input.validationMessage, options['data-rangeoverflow']);
  });

  it('gets the correct error message when it has a value with length smaller than "minlength"', async () => {
    const options = {
      type: 'text',
      minLength: 5,
      value: 'foo',
      'data-tooshort': 'Must have at least 5 characters'
    };

    const form = await fixture(getFormHTML(options));
    const input = form.querySelector('custom-input');
    const submit = form.querySelector('button');

    form.addEventListener('submit', e => e.preventDefault());
    submit.click();

    assert.equal(input.validity.patternMismatch, true);
    assert.equal(input.validationMessage, options['data-tooshort']);
  });

  it('gets the correct error message when it has a value with not allowed characters', async () => {
    const options = {
      type: 'text',
      value: 'foo',
      pattern: '[0-9]+',
      'data-patternmismatch': 'Only numbers are allowed'
    };

    const form = await fixture(getFormHTML(options));
    const input = form.querySelector('custom-input');
    const submit = form.querySelector('button');

    form.addEventListener('submit', e => e.preventDefault());
    submit.click();

    assert.equal(input.validity.patternMismatch, true);
    assert.equal(input.validationMessage, options['data-patternmismatch']);
  });
})
