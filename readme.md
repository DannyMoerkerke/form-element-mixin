# Form Element Mixin 
A mixin to associate a Custom Element with a form: [https://web.dev/articles/more-capable-form-controls](https://web.dev/articles/more-capable-form-controls)


### Usage
To install run:

```
npm install form-element-mixin
```

Then `import` the mixin:

```javascript
import {FormElementMixin} from './node_modules/@dannymoerkerke/form-element-mixin/src/FormElementMixin';
```
Then pass the element you want to extend to the `FormElementMixin` factory function:

```javascript
class MyInput extends FormElementMixin(HTMLElement) {
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

customElements.define('my-input', MyInput);
```

Note that you need to set the internal input to the `inputNode` property.

Add the HTML tag:

```html
<my-element
  type="text"
  name="my-input"
  required
  data-valuemissing="This field is required"
></my-element>
```
### Form Validation
The Custom Element can participate in form validation by setting constraints using the standard attributes used for 
native form elements (`required`, `minlength`, `maxlength`, `min`, `max`, `pattern` etc.)

Custom error messages can be displayed by setting the error messages on the element with `data` attributes (see below) 
and the native error message can be hidden so the error can be shown in another HTML element the user chooses.

To do this, set an event handler for the `invalid` event and get the error message from the element's 
`validationMessage` property:

```javascript
const errorMessage = document.querySelector('.error-message');

myInput.addEventListener('invalid', (e) => {
  errorMessage.textContent = myInput.validationMessage;
});
```
When `custom-error-display` is set the element will get an `invalid` attribute when it's invalid which can be used to 
display the error message with CSS:

```css
.error-message {
  display: none;
}

my-input[invalid] ~ .error-message {
  display: block;
}
```

### Attributes
- `type`: type of the element, can be any type that is valid for `<input>`
- `name`: name of the element
- `placeholder`: placeholder for the element
- `disabled`: whether the element is disabled
- `required`: whether the element is required
- `validate-on-change`: whether the element should be validated on change, meaning when it's interacted with and the 
  `blur` event fires
- `custom-error-display`: shows a custom error message instead of the native error, enables styling of the error message
- `data-valuemissing`: error message when the element is required and has no value
- `data-typemismatch`: error message when the syntax of the data is not correct, for example when type is `email` but 
  the value is not a valid email address
- `data-tooshort`: error message when the element has a `minlength` attribute and the length of the value is less than 
  the value of this attribute
- `data-toolong`: error message when the element has a `maxlength` attribute and the length of the value is greater than 
  the value of this attribute
- `data-rangeunderflow`: error message when the element has a `min` attribute and the numeric value of the field is less 
  than the value of this attribute, works with `type="number"`
- `data-rangeoverflow`: error message when the element has a `max` attribute and the numeric value of the field is greater 
 than the value of this attribute, works with `type="number"`
- `data-patternMismatch`: error message when the element has a `pattern` attribute but the data of the field does not 
  follow this pattern

### Testing
Run `npm test`.

### Browser support
- Chrome 77+
- Edge 79+
- Safari 16.4+
- Firefox 93+
