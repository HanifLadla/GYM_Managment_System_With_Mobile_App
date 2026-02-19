import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import { FiDownload, FiUser, FiCheckCircle, FiAward } from 'react-icons/fi';

const TrainerCard = () => {
  const { id } = useParams();
  const [trainer, setTrainer] = useState(null);
  const { alerts, addAlert, removeAlert } = useAlert();

  useEffect(() => {
    if (id) fetchTrainer();
  }, [id]);

  const fetchTrainer = async () => {
    try {
      const { data } = await axios.get(`/api/trainers/${id}`);
      setTrainer(data);
    } catch (error) {
      addAlert('Failed to load trainer', 'error');
    }
  };

  if (!trainer) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />
      
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold dark:text-white">Trainer ID Card</h1>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <FiDownload /> Print Card
        </button>
      </div>

      <div className="flex justify-center">
        <motion.div
          id="printable-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-[350px] h-[220px]"
        >
          {/* Card Front */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-teal-900 to-emerald-900 rounded-2xl shadow-2xl overflow-hidden print-gradient">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 print-bg-pattern">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400 rounded-full blur-3xl transform -translate-x-24 translate-y-24"></div>
            </div>

            {/* Card Content */}
            <div className="relative h-full p-6 flex flex-col justify-between text-white">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold tracking-wider">GYM TRAINER</h2>
                  <p className="text-xs opacity-75 mt-1">Staff ID Card</p>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <FiAward className="w-6 h-6" />
                </div>
              </div>

              {/* Trainer Info */}
              <div className="space-y-2">
                <div>
                  <p className="text-xs opacity-75 uppercase tracking-wide">Trainer Name</p>
                  <p className="text-lg font-bold">{trainer.name}</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-xs opacity-75 uppercase tracking-wide">Specialization</p>
                    <p className="text-sm font-mono">{trainer.specialization || 'General'}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-75 uppercase tracking-wide">ID</p>
                    <p className="text-sm font-semibold whitespace-nowrap">{trainer.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {trainer.status === 'active' ? (
                    <>
                      <FiCheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-semibold text-green-400">ACTIVE</span>
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-red-400">INACTIVE</span>
                  )}
                </div>
                <div className="text-xs opacity-50">STAFF ACCESS</div>
              </div>
            </div>

            {/* Chip Design */}
            <div className="absolute top-16 right-6 w-12 h-10 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded opacity-80 print-chip">
              <div className="grid grid-cols-3 gap-0.5 p-1.5">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="bg-yellow-600 rounded-sm"></div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Card Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow print:hidden"
      >
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Trainer Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Trainer ID</p>
            <p className="font-semibold dark:text-white">{trainer.id.slice(0, 8)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
            <p className="font-semibold dark:text-white">{trainer.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
            <p className="font-semibold dark:text-white">{trainer.user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Classes</p>
            <p className="font-semibold dark:text-white">{trainer.classes?.length || 0}</p>
          </div>
        </div>
      </motion.div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-card,
          #printable-card * {
            visibility: visible;
          }
          #printable-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 85.6mm !important;
            height: 54mm !important;
          }
          @page {
            size: 85.6mm 54mm;
            margin: 0;
          }
          .print-gradient {
            background: linear-gradient(135deg, #064e3b 0%, #0f766e 50%, #047857 100%) !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-bg-pattern {
            opacity: 0.1 !important;
          }
          .print-chip {
            background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%) !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default TrainerCard;
