export const FormElementMixin = (superClass) => class extends superClass {
  #internals;
  #inputNode;
  #invalid;

  static formAssociated = true;

  static get observedAttributes() {
    return [
      'type',
      'value',
      'placeholder',
      'required',
      'min',
      'max',
      'minlength',
      'maxlength',
      'pattern',
      'disabled'
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if(this.#inputNode) {
      if(newValue === null) {
        this.#inputNode.removeAttribute(name);
      }
      else {
        this.#inputNode.setAttribute(name, newValue);
      }
    }
  }

  formResetCallback() {
    this.value = this.getAttribute('value') || '';
  }

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.invalid = false;
    this.pristine = true;
  }

  set inputNode(node) {
    this.#inputNode = node;

    // set the required properties (constraints) on the internal <input>
    this.constructor.observedAttributes.forEach((a) => {
      const attr = a.toLowerCase();
      const attrValue = attr === 'required' ? this.hasAttribute(attr) : this.getAttribute(attr);

      if(attrValue !== null && attrValue !== undefined && !(attr === 'required' && !attrValue)) {
        // workaround for 'minlength' attribute which doesn't seem to work for some reason
        // when 'minlength' is present it will be rewritten to 'pattern' unless 'pattern' is also present in which case
        // a warning will be displayed in the console
        // a custom error message for the minlength constraint in the "data-tooshort" attribute will be rewritten to
        // "data-patternmismatch"
        if(attr === 'minlength') {
          if(this.hasAttribute('pattern')) {
            console.warn(
              '\n',
              'minlength and pattern cannot be used together and should be combined if possible.',
              '\n',
              'For example: pattern="[a-z]" and minlength="5" can be combined as pattern="[a-z]{5,}".',
              '\n',
              `If you have set a custom error message for the minlength constraint with "data-tooshort" you should change this to "data-patternmismatch"`);
          }
          else {
            this.#inputNode.setAttribute('pattern', `.{${attrValue},}`);
            // also set the rewritten 'pattern' on the custom element, so it's clear to the user what the needed value is
            this.setAttribute('pattern', `.{${attrValue},}`);

            if(this.hasAttribute('data-tooshort')) {
              this.setAttribute('data-patternmismatch', this.getAttribute('data-tooshort'));
            }
          }
        }
        else {
          this.#inputNode.setAttribute(attr, attrValue);
        }
      }
    });

    this.#inputNode.addEventListener('change', (e) => {
      if(this.validateOnChange) {
        this.pristine = false;
      }

      this.value = this.#inputNode.value;

      // we also want to dispatch a `change` event from
      // our custom element
      const clone = new e.constructor(e.type, e);
      this.dispatchEvent(clone);

      // set the element's validity whenever the value of #inputNode changes
      this.validateInput();
    });

    this.addEventListener('invalid', (e) => {
      this.invalid = true;
      this.pristine = false;
      // console.log('invalid');
      // when a custom error needs to be displayed, prevent the native error from showing
      // NOTE: this suppresses the error "element is not focusable" when native form validation is implemented but the
      // element does not have a tabindex attribute and the element is invalid and the form in which it is placed is
      // submitted
      // since this mixin always adds tabindex when not already present this should not be a problem but it is important
      // to remember this behavior
      if(this.customErrorDisplay) {
        e.preventDefault();
      }
    });

    // this can be replaced by 'delegatesFocus: true' in ShadowRoot creation options but that selects text in focusable
    // child while this handler only focuses the input. It's here in case the element that uses this mixin has a
    // ShadowRoot added to it and 'delegatesFocus' is not set to 'true'
    this.addEventListener('focus', () => this.#inputNode.focus());

    // add 'tabindex' so the element is focused when any label is clicked. It's also required if the native error
    // message needs to be displayed otherwise the error "element is not focusable" will be displayed
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }

    // set the initial validity of the component
    this.validateInput();
  }

  get defaultValue() {
    return this.#inputNode.defaultValue;
  }

  set defaultValue(value) {
    this.#inputNode.defaultValue = value;
    this.setAttribute('value', value);
  }

  get validateOnChange() {
    return this.hasAttribute('validate-on-change');
  }

  get customErrorDisplay() {
    return this.hasAttribute('custom-error-display');
  }

  get invalid() {
    return this.#invalid;
  }

  set invalid(isInvalid) {
    this.#invalid = isInvalid;
    isInvalid && this.customErrorDisplay ? this.setAttribute('invalid', '') : this.removeAttribute('invalid');
  }

  get value() {
    return this.#inputNode.value;
  }

  set value(value) {
    this.#inputNode.value = value;
    this.#internals.setFormValue(value);
    this.validateInput();
  }

  get form() {
    return this.#internals.form;
  }

  get name() {
    return this.getAttribute('name');
  }

  get type() {
    return this.localName;
  }

  get internals() {
    return this.#internals
  }

  get validity() {
    return this.#internals.validity;
  }

  get validationMessage() {
    return this.#internals.validationMessage;
  }

  get willValidate() {
    return this.#internals.willValidate;
  }

  checkValidity() {
    return this.#internals.checkValidity();
  }

  reportValidity() {
    return this.#internals.reportValidity();
  }

  validateInput() {
    // get the validity of the internal <input>
    const validState = this.#inputNode.validity;
    // console.log(validState);
    // reset this.invalid before validating again
    this.invalid = false;

    // if the input is invalid, show the correct error
    if(!validState.valid) {
      // loop through the error reasons
      for(let state in validState) {

        // get the name of the data attribute that holds the error message
        const attr = `data-${state.toString()}`;

        // if there is an error
        if(validState[state]) {
          this.validationError = state.toString();
          this.invalid = !this.pristine && !validState.valid;

          // get either the custom of native error message
          const errorMessage = this.hasAttribute(attr) ? this.getAttribute(attr) : this.#inputNode.validationMessage;

          // set the validity error reason and the corresponding message
          this.#internals.setValidity({[this.validationError]: true}, errorMessage);

          // when a custom error needs to be displayed, dispatch the 'invalid' event manually so consuming code
          // can use this as a hook to get the correct error message and display it
          if(this.invalid) {
            if(this.customErrorDisplay) {
              this.dispatchEvent(new Event('invalid'));
            }
            else {
              this.reportValidity();
            }
          }
        }
      }
    }
    else {
      this.#internals.setValidity({});
    }
  }

  setCustomValidity(message) {
    // when there is a `message`, set the current error reason in the `validationError`
    // property to `true`, otherwise pass an empty object `{}`
    const error = message ? {[this.validationError]: true} : {};

    // the error is now shown or cleared depending on `error`
    this.#internals.setValidity(error, message);
  }

  setErrorMessage(message) {
    this.validationError = 'customError';
    this.setCustomValidity(message);
    this.reportValidity();
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(isDisabled) {
    this.#inputNode.disabled = isDisabled;

    if(isDisabled) {
      this.setAttribute('disabled', '');
    }
    else {
      this.removeAttribute('disabled');
    }
  }
}
