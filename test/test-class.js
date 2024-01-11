import {FormElementMixin} from '../src/FormElementMixin.js';

class CustomInput extends FormElementMixin(HTMLElement) {

  constructor() {
    super();
    const shadowRoot = this.attachShadow({mode: 'open'});

    shadowRoot.innerHTML = `
      <input>
    `;
  }

  connectedCallback() {
    this.inputNode = this.shadowRoot.querySelector('input');
  }
}

customElements.define('custom-input', CustomInput);
