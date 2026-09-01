
import { useState } from "react";
import { createService } from "../../services/api";

export default function AddServiceForm({ onSuccess, onClose }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    environment: "development",
    endpoint_url: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      await createService(form);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to create service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        name="name"
        placeholder="Service Name"
        value={form.name}
        onChange={handleChange}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3"
        required
      />

      <textarea
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3"
      />

      <select
        name="environment"
        value={form.environment}
        onChange={handleChange}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3"
      >
        <option value="development">Development</option>
        <option value="staging">Staging</option>
        <option value="production">Production</option>
      </select>

      <input
        name="endpoint_url"
        placeholder="https://example.com"
        value={form.endpoint_url}
        onChange={handleChange}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3"
      />

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg"
        >
          {loading ? "Creating..." : "Create Service"}
        </button>
      </div>
    </form>
  );
}