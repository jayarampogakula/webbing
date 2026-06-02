"use client";

import React, { useState } from "react";

interface ContactFormProps {
  projectId: string;
}

export default function ContactForm({ projectId }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus({ type: "error", message: "Please fill out all fields." });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/sites/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          ...formData,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({
          type: "success",
          message: "Thank you! Your message has been sent successfully.",
        });
        setFormData({ name: "", email: "", message: "" });
      } else {
        setStatus({
          type: "error",
          message: data.error || "Failed to send message. Please try again.",
        });
      }
    } catch (err) {
      console.error("Error submitting contact form:", err);
      setStatus({
        type: "error",
        message: "An error occurred. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
      {status && (
        <div
          className={status.type === "success" ? "success-alert" : "form-alert"}
          style={{
            padding: "0.85rem 1rem",
            borderRadius: "0.5rem",
            fontSize: "0.9rem",
          }}
        >
          {status.message}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="field-group">
          <label htmlFor="contact-name">Full Name</label>
          <input
            id="contact-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="field"
            placeholder="John Doe"
            disabled={loading}
            required
          />
        </div>
        <div className="field-group">
          <label htmlFor="contact-email">Email Address</label>
          <input
            id="contact-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="field"
            placeholder="john@company.com"
            disabled={loading}
            required
          />
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="contact-message">Your Message</label>
        <textarea
          id="contact-message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          className="field"
          rows={4}
          placeholder="Tell us about your project..."
          disabled={loading}
          required
        ></textarea>
      </div>

      <button
        type="submit"
        className="primary-action"
        style={{ alignSelf: "flex-start", minHeight: "auto", padding: "0.75rem 1.5rem" }}
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
