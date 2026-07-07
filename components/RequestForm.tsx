"use client";

import { useState, type FormEvent } from "react";

export type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "tel" | "number" | "date" | "url";
  placeholder?: string;
  required?: boolean;
  options?: string[];
  textarea?: boolean;
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
};

export default function RequestForm({
  title,
  kicker,
  description,
  fields,
  submitLabel,
  tone,
  onSubmit,
}: RequestFormProps) {
  const [error, setError] = useState("");

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
      return;
    }

    setError("");
    onSubmit(values);
    event.currentTarget.reset();
  }

  return (
    <section className={`formCard ${tone}`} aria-labelledby={`${tone}-form-title`}>
      <div className="formIntro">
        <span>{kicker}</span>
        <h2 id={`${tone}-form-title`}>{title}</h2>
        <p>{description}</p>
      </div>

      <form className="requestForm" onSubmit={handleSubmit}>
        <div className="formGrid">
          {fields.map((field) => (
            <label className={field.textarea ? "fieldGroup wide" : "fieldGroup"} key={field.name}>
              <span>
                {field.label}
                {field.required ? " *" : ""}
              </span>
              {field.options ? (
                <select name={field.name} required={field.required} defaultValue="">
                  <option value="" disabled>
                    Select one
                  </option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.textarea ? (
                <textarea name={field.name} placeholder={field.placeholder} rows={4} />
              ) : (
                <input
                  name={field.name}
                  placeholder={field.placeholder}
                  required={field.required}
                  type={field.type ?? "text"}
                />
              )}
            </label>
          ))}
        </div>

        {error ? <p className="formError" role="alert">{error}</p> : null}

        <button className="submitButton" type="submit">
          {submitLabel}
        </button>
      </form>
    </section>
  );
}
