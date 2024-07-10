class Validator {
    /**
     * Creates a new instance of the Validator class.
     * @param {any} value - The value to be validated.
     */
    constructor(value) {
        this.value = value;
        this.errors = [];
    }

    /**
     * Updates the validator value.
     * @param {any} newValue - The new value to be set.
     * @returns {Validator} - Returns the current instance for method chaining.
     */
    setValue(newValue) {
        this.value = newValue;

        return this;
    }

    /**
     * Checks if the length of the value is less than a specified maximum.
     * @param {number} maxLength - The maximum allowed length.
     * @param {string} field - A description of the field being checked.
     * @returns {Validator} - Returns the current instance for method chaining.
     */
    checkLength(maxLength, field) {
        if (String(this.value).trim().length >= maxLength) {
            this.errors.push(`${field} must not exceed ${maxLength} characters.`);
        }

        return this;
    }

    /**
     * Checks if the value is not empty.
     * @param {string} field - A description of the field being checked.
     * @returns {Validator} - Returns the current instance for method chaining.
     */
    checkNotEmpty(field) {
        if (String(this.value).trim().length === 0) {
            this.errors.push(`${field} is required.`);
        }

        return this;
    }

    /**
     *  - GEMINI BRO -
     * Checks if the value is a valid Date.
     * @returns {Validator} - Returns the current instance for method chaining.
     */
    isValidDate() {
        // Regex to match DD:MM:YYYY format
        const regex = /^\d{2}:\d{2}:\d{4}$/;

        // Check if the string matches the format
        if (!regex.test(dateString)) {
            this.errors.push(`Invalid date.`);
            return this;
        }

        // Split the string into separate parts
        const parts = dateString.split(':');

        // Check if each part is a valid number within range
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        if (isNaN(day) || isNaN(month) || isNaN(year)) {
            this.errors.push(`Invalid date.`);
            return this;
        }

        if (day < 1 || day > 31) {
            this.errors.push(`Invalid date.`);
            return this;
        }

        if (month < 1 || month > 12) {
            this.errors.push(`Invalid date.`);
            return this;
        }

        // Check for leap year (needed for February)
        if (month === 2 && (year % 4 !== 0 || (year % 100 === 0 && year % 400 !== 0))) {
            if (day > 28) {
                this.errors.push(`Invalid date.`);
                return this;
                }
        } else if (month === 2 && day > 29) {
            this.errors.push(`Invalid date.`);
            return this;
        } else if ((month === 4 || month === 6 || month === 9 || month === 11) && day > 30) {
            this.errors.push(`Invalid date.`);
            return this;
        }

        return this;
    }
      

    /**
     * Checks if the type of the value matches the specified type.
     * @param {string} type - The expected type.
     * @param {string} field - A description of the field being checked.
     * @returns {Validator} - Returns the current instance for method chaining.
     */
    checkType(type, field) {
        if (typeof this.value !== type) {
            this.errors.push(`Invalid ${field}`);
        }

        return this;
    }

    /**
     * Checks if the value is a valid email address.
     * @returns {Validator} - Returns the current instance for method chaining.
     */
    checkEmail() {
        const [localPart, domainPart] = this.value.split('@');

        if (!localPart || !domainPart) {
            this.errors.push("Invalid email format.");
          return this;
        }
      
        if (localPart.length > 254) {
            this.errors.push("Invalid email format.");
          return this;
        }
      
        if (localPart.indexOf('..') !== -1) {
            this.errors.push("Invalid email format.");
          return this;
        }
      
        if (domainPart.length > 255) {
            this.errors.push("Invalid email format.");
          return this;
        }

        const emailRegex = /^\w+@[a-zA-Z]+\.[a-zA-Z]+$/;
        if (!emailRegex.test(this.value)) {
            this.errors.push("Invalid email format.");
        }
        
        return this;
    }

    /**
     * Checks if the Validator instance has no errors.
     * @returns {boolean} - True if no errors are found, false otherwise.
     */
    isValid() {
        return this.errors.length === 0;
    }

    /**
     * Gets the array of validation errors.
     * @returns {Array} - Array containing validation error messages.
     */
    getErrors() {
        return this.errors;
    }

    /**
     * Resets the Validator instance, clearing errors for the next validation.
     * @returns {Validator}
     */
    reset() {
        this.errors = [];

        return this;
    }
}

module.exports = { Validator };