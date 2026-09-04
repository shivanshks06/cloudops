import { useState, useEffect } from "react";
import { Plus, Server, Globe, ExternalLink, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import Modal from "../components/ui/Modal";
import AddServiceForm from "../components/forms/AddServiceForm";
import { getServices, deleteService } from "../services/api";

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);

  const loadServices = async () => {
    try {
      const res = await getServices();
      setServices(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this service? All its metrics, alerts, and incidents will also be deleted.")) {
      setIsDeleting(id);
      try {
        await deleteService(id);
        await loadServices();
      } catch (error) {
        console.error("Failed to delete service", error);
        alert("Failed to delete service.");
      } finally {
        setIsDeleting(null);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-slate-400 mt-1">Manage and monitor your cloud services</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition duration-200 cursor-pointer"
        >
          <Plus size={18} />
          Add Service
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : services.length === 0 ? (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-12 text-center max-w-xl mx-auto mt-12 shadow-xl">
          <Server className="mx-auto text-slate-400 mb-4" size={48} />
          <h3 className="text-xl font-bold mb-2 text-white">No Services Registered</h3>
          <p className="text-slate-400 mb-6 text-sm">Start monitoring your infrastructure by registering your first service.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition duration-200 cursor-pointer shadow-lg shadow-blue-600/20"
          >
            Register Service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Link
              to={`/services/${service.id}`}
              key={service.id}
              className="bg-slate-800/60 border border-slate-700/50 hover:border-slate-600/60 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between group relative cursor-pointer"
            >
              {/* Delete Button */}
              <button
                onClick={(e) => handleDelete(service.id, e)}
                disabled={isDeleting === service.id}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50"
                title="Delete Service"
              >
                {isDeleting === service.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400/20 border-b-red-400"></div>
                ) : (
                  <Trash2 size={16} />
                )}
              </button>

              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-600/10 text-blue-400 p-3 rounded-xl border border-blue-500/10">
                    <Server size={22} />
                  </div>
                  <span
                    className={`text-[10px] px-2.5 py-1 mr-8 rounded-full font-semibold uppercase tracking-wider ${
                      service.environment === "production"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : service.environment === "staging"
                        ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        : "bg-green-500/10 text-green-400 border border-green-500/20"
                    }`}
                  >
                    {service.environment}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{service.name}</h3>
                <p className="text-slate-400 text-xs mb-4 line-clamp-2 leading-relaxed">
                  {service.description || "No description provided."}
                </p>
              </div>

              <div className="border-t border-slate-700/50 pt-4 mt-2 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5 truncate mr-4">
                  <Globe size={14} className="text-slate-500 shrink-0" />
                  <span className="truncate">{service.endpoint_url || "No endpoint"}</span>
                </div>
                {service.endpoint_url && (
                  <a
                    href={service.endpoint_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold transition"
                  >
                    Visit <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Service"
      >
        <AddServiceForm
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadServices}
        />
      </Modal>
    </div>
  );
}
