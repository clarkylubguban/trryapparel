"use client";

import { useState, type FormEvent } from "react";

export type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "tel" | "number" | "date" | "url";
  placeholder?: string;
  selectPlaceholder?: string;
  required?: boolean;
  options?: string[];
  textarea?: boolean;
  section?: string;
};

export type RequestFormValues = Record<string, string>;

type RequestFormProps = {
  title: string;
  kicker: string;
  description: string;
  fields: FieldConfig[];
  submitLabel: string;
  tone: "pink" | "yellow" | "teal" | "purple";
  onSubmit: (values: RequestFormValues) => void;
  layout?: "grid" | "stacked";
};

export default function RequestForm({
  title,
  kicker,
  description,
  fields,
  submitLabel,
  tone,
  onSubmit,
  layout = "grid",
}: RequestFormProps) {
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState("");
  const isStacked = layout === "stacked";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = fields.reduce<RequestFormValues>((nextValues, field) => {
      const value = formData.get(field.name);
      nextValues[field.name] = typeof value === "string" ? value.trim() : "";
      return nextValues;
    }, {});

    const missingField = fields.find((field) => field.required && !values[field.name]);
    if (missingField) {
      setError(`Please fill in ${missingField.label}.`);
      setErrorField(missingField.name);
      return;
    }

    setError("");
    setErrorField("");
    onSubmit(values);
    event.currentTarget.reset();
  }

  function getValidationProps(fieldName: string) {
    const hasError = errorField === fieldName;

    return {
      "aria-describedby": hasError ? "request-form-error" : undefined,
      "aria-invalid": hasError || undefined,
    };
  }

  return (
    <section
      className={`formCard ${tone}${isStacked ? " stackedFormCard" : ""}`}
      aria-labelledby={`${tone}-form-title`}
    >
      <div className="formIntro">
        <span>{kicker}</span>
        <h2 id={`${tone}-form-title`}>{title}</h2>
        <p>{description}</p>
      </div>

      <form className={`requestForm${isStacked ? " stackedRequestForm" : ""}`} onSubmit={handleSubmit} noValidate>
        <div className={`formGrid${isStacked ? " stackedFormGrid" : ""}`}>
          {fields.map((field, index) => {
            const previousField = fields[index - 1];
            const showSection = isStacked && field.section && field.section !== previousField?.section;

            return (
              <div className="fieldBlock" key={field.name}>
                {showSection ? <h3 className="formSectionTitle">{field.section}</h3> : null}
                <label className={field.textarea || isStacked ? "fieldGroup wide" : "fieldGroup"}>
                  <span className={isStacked ? "visuallyHidden" : undefined}>{field.label}</span>
                  {field.options ? (
                    <select
                      {...getValidationProps(field.name)}
                      aria-label={field.label}
                      name={field.name}
                      required={field.required}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        {field.selectPlaceholder ?? "Select one"}
                      </option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.textarea ? (
                    <textarea
                      {...getValidationProps(field.name)}
                      aria-label={field.label}
                      name={field.name}
                      placeholder={field.placeholder}
                      required={field.required}
                      rows={4}
                    />
                  ) : (
                    <input
                      {...getValidationProps(field.name)}
                      aria-label={field.label}
                      name={field.name}
                      placeholder={field.placeholder}
                      required={field.required}
                      type={field.type ?? "text"}
                    />
                  )}
                </label>
              </div>
            );
          })}
        </div>

        {error ? <p className="formError" id="request-form-error" role="alert">{error}</p> : null}

        <button className="submitButton" type="submit">
          {submitLabel}
        </button>
      </form>
    </section>
  );
}
